import hashlib
import hmac
import os
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserOut
from app.services.sms_service import sms_service

router = APIRouter(prefix="/api", tags=["auth"])

def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"{salt}${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, stored_hash = hashed_password.split("$")
        computed_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
        return hmac.compare_digest(stored_hash, computed_hash)
    except Exception:
        return False

# In-memory active session map: token -> user_dict
_active_sessions = {}

class UpdatePhoneRequest(BaseModel):
    phone: str

class TestSMSRequest(BaseModel):
    phone: Optional[str] = None
    message: Optional[str] = None

@router.post("/register")
def register(req: UserRegister, db: Session = Depends(get_db)):
    clean_username = req.username.strip().lower()
    clean_name = req.full_name.strip()
    clean_phone = req.phone.strip()

    if not clean_username or not req.password:
        raise HTTPException(status_code=400, detail="Username and password are required.")

    # Check for duplicate username
    existing = db.query(User).filter(User.username == clean_username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists. Please choose a different one.")

    # Create user with salted hash
    pwd_hash = hash_password(req.password)
    new_user = User(
        full_name=clean_name,
        username=clean_username,
        password_hash=pwd_hash,
        phone=clean_phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "Registration successful. You can now login.",
        "username": new_user.username
    }

@router.post("/login")
def login(req: UserLogin, db: Session = Depends(get_db)):
    clean_username = req.username.strip().lower()
    user = db.query(User).filter(User.username == clean_username).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    # Generate session token
    token = f"sess_{user.id}_{os.urandom(16).hex()}"
    user_info = {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "phone": user.phone
    }
    _active_sessions[token] = user_info

    return {
        "success": True,
        "token": token,
        "user": user_info
    }

@router.get("/me")
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        user_info = _active_sessions.get(token)
        if user_info:
            return user_info

    # Fallback: check latest user in DB
    last_user = db.query(User).order_by(User.id.desc()).first()
    if last_user:
        return {
            "id": last_user.id,
            "username": last_user.username,
            "full_name": last_user.full_name,
            "phone": last_user.phone
        }
    raise HTTPException(status_code=401, detail="Invalid or expired session.")

@router.put("/user/phone")
def update_user_phone(req: UpdatePhoneRequest, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    clean_phone = req.phone.strip()
    if not clean_phone:
        raise HTTPException(status_code=400, detail="Mobile number cannot be empty.")

    user = None
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        user_info = _active_sessions.get(token)
        if user_info:
            user = db.query(User).filter(User.id == user_info["id"]).first()
            if user:
                user_info["phone"] = clean_phone

    if not user:
        user = db.query(User).order_by(User.id.desc()).first()

    if not user:
        # Automatically create system administrator user with this phone
        user = User(
            full_name="Classroom Administrator",
            username="admin",
            password_hash=hash_password("admin123"),
            phone=clean_phone
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.phone = clean_phone
        db.commit()

    # Store in active sessions map
    _active_sessions["default_admin"] = {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "phone": clean_phone
    }

    # Also update any existing active alerts that had "No registered mobile number"
    from app.models.alert import Alert
    try:
        db.query(Alert).filter(Alert.sms_status == "No registered mobile number.").update({
            "sms_recipient": clean_phone,
            "sms_status": f"Alert number saved ({clean_phone})"
        })
        db.commit()
    except Exception as e:
        print(f"[Auth] Alert update error: {e}")

    return {
        "success": True,
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "phone": clean_phone,
        "message": f"SMS alert mobile number saved ({clean_phone})."
    }

@router.get("/sms/status")
def get_sms_status():
    """Check whether SMS provider is configured in environment."""
    return sms_service.get_provider_status()

@router.post("/sms/test")
def test_sms(req: TestSMSRequest, db: Session = Depends(get_db)):
    """Test actual SMS delivery via configured provider."""
    target_phone = req.phone or get_registered_user_phone(db)
    msg = req.message or "IdleAlert Test: Automatic SMS alerts are active and functional."
    result = sms_service.send_sms(target_phone, msg, alert_type="test_sms")
    return result

@router.post("/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        _active_sessions.pop(token, None)
    return {"success": True}

def get_registered_user_phone(db: Session = None, user_id: Optional[int] = None) -> str:
    """Helper to retrieve active user's phone for SMS alerts."""
    if _active_sessions:
        latest = list(_active_sessions.values())[-1]
        return latest.get("phone", "")
    if db:
        user = db.query(User).order_by(User.id.desc()).first()
        if user:
            return user.phone
    return ""
