from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api", tags=["classroom"])

# Simple in-memory classroom name (single classroom prototype)
_current_classroom = {"name": None}

class SetClassroomRequest(BaseModel):
    name: str

@router.get("/classroom")
def get_classroom():
    return {"name": _current_classroom["name"]}

@router.post("/classroom")
def set_classroom(req: SetClassroomRequest):
    _current_classroom["name"] = req.name.strip() if req.name else None
    return {"success": True, "name": _current_classroom["name"]}

def get_current_classroom_name() -> str:
    return _current_classroom.get("name", "") or "Unnamed Classroom"
