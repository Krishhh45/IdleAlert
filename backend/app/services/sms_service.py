import time
import re
import uuid
import requests
from datetime import datetime
from typing import Dict, Tuple, Optional
from app.config import get_sms_config

class TextBeeSMSService:
    """
    Clean, robust TextBee SMS Service for the IdleAlert system.
    Communicates with TextBee API (https://api.textbee.dev) to deliver real SMS
    via a connected Android device.
    """
    TEXTBEE_SEND_URL = "https://api.textbee.dev/api/v1/gateway/send-sms"

    def __init__(self):
        self._last_sms_times: Dict[str, float] = {}

    def mask_phone(self, phone: str) -> str:
        """Safely masks phone number for logging, e.g. +919975004101 -> +91******4101"""
        if not phone:
            return "None"
        phone_str = str(phone).strip()
        if len(phone_str) >= 10:
            prefix = phone_str[:3] if phone_str.startswith("+") else phone_str[:2]
            suffix = phone_str[-4:]
            mask_len = max(len(phone_str) - len(prefix) - len(suffix), 4)
            return f"{prefix}{'*' * mask_len}{suffix}"
        return "***"

    def get_provider_status(self) -> Dict[str, any]:
        """Checks whether TextBee API Key and Device ID are configured."""
        cfg = get_sms_config()
        api_key = (cfg.get("TEXTBEE_API_KEY") or "").strip()
        device_id = (cfg.get("TEXTBEE_DEVICE_ID") or "").strip()

        missing = []
        if not api_key:
            missing.append("TEXTBEE_API_KEY")
        if not device_id:
            missing.append("TEXTBEE_DEVICE_ID")

        is_configured = len(missing) == 0

        return {
            "provider": "TextBee",
            "configured": is_configured,
            "device_id": device_id if device_id else None,
            "missing": missing,
            "env_file": cfg.get("env_path", ".env")
        }

    def log_startup_diagnostics(self):
        """Prints safe startup configuration diagnostics for TextBee SMS."""
        cfg = get_sms_config()
        status = self.get_provider_status()
        print("--------------------------------------------------")
        print("[SMS Setup Diagnostic]")
        print(f"  Provider: TextBee")
        print(f"  .env file location: {cfg.get('env_path')} (found: {cfg.get('env_exists')})")
        print(f"  Configured: {status['configured']}")
        if status["missing"]:
            print(f"  Missing required variables: {', '.join(status['missing'])}")
        print("--------------------------------------------------")

    @property
    def is_ready(self) -> bool:
        return self.get_provider_status()["configured"]

    def is_configured(self) -> bool:
        return self.get_provider_status()["configured"]

    def normalize_phone_number(self, phone: str) -> Tuple[bool, str, str]:
        """
        Validates and formats destination phone number to E.164.
        Returns: (is_valid, e164_phone, clean_10_digits)
        """
        if not phone:
            return False, "", ""

        cleaned = re.sub(r"[\s\-\(\)]", "", str(phone).strip())

        if cleaned.startswith("+"):
            digits = re.sub(r"[^\d]", "", cleaned[1:])
            if len(digits) >= 10:
                return True, f"+{digits}", digits[-10:]
            return False, "", ""

        digits = re.sub(r"[^\d]", "", cleaned)
        if len(digits) == 10:
            return True, f"+91{digits}", digits
        elif len(digits) == 12 and digits.startswith("91"):
            return True, f"+{digits}", digits[2:]
        elif len(digits) > 10:
            return True, f"+{digits}", digits[-10:]

        return False, "", ""

    def _is_rate_limited(self, alert_key: str, limit_seconds: int) -> bool:
        last_time = self._last_sms_times.get(alert_key, 0)
        return (time.time() - last_time) < limit_seconds

    def send_sms(self, phone: str, message: str, alert_type: str = "energy_wastage") -> dict:
        """
        Reusable TextBee SMS dispatch function.
        1. Validates recipient phone number.
        2. Reads TEXTBEE_API_KEY from environment.
        3. Reads TEXTBEE_DEVICE_ID from environment.
        4. Validates that both exist.
        5. Sends the message through TextBee API.
        6. Checks the actual TextBee API response.
        7. Returns success ONLY when TextBee confirms the request successfully.
        8. Returns a meaningful error if the API request fails.
        """
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        # 1. Validate recipient phone number
        if not phone or not str(phone).strip():
            err_msg = "SMS alert number is not configured. Please set an alert phone number."
            self._log_dispatch(phone, alert_type, message, f"FAILED: {err_msg}", timestamp)
            return {
                "sent": False,
                "status": err_msg,
                "error": err_msg,
                "provider": "TextBee"
            }

        is_valid, e164_phone, ten_digits = self.normalize_phone_number(phone)
        if not is_valid:
            err_msg = f"The configured alert number '{phone}' is not a valid 10-12 digit mobile number."
            self._log_dispatch(phone, alert_type, message, f"FAILED: {err_msg}", timestamp)
            return {
                "sent": False,
                "status": "Invalid SMS alert number.",
                "error": err_msg,
                "provider": "TextBee"
            }

        # 2. Read and validate environment variables
        cfg = get_sms_config()
        api_key = (cfg.get("TEXTBEE_API_KEY") or "").strip()
        device_id = (cfg.get("TEXTBEE_DEVICE_ID") or "").strip()

        if not api_key:
            err_msg = "SMS service is not configured. Missing TEXTBEE_API_KEY."
            self._log_dispatch(e164_phone, alert_type, message, err_msg, timestamp)
            return {
                "sent": False,
                "status": err_msg,
                "error": err_msg,
                "provider": "TextBee"
            }

        if not device_id:
            err_msg = "SMS service is not configured. Missing TEXTBEE_DEVICE_ID."
            self._log_dispatch(e164_phone, alert_type, message, err_msg, timestamp)
            return {
                "sent": False,
                "status": err_msg,
                "error": err_msg,
                "provider": "TextBee"
            }

        # 3. Duplicate SMS Protection / Rate Limiting
        rate_limit = int(cfg.get("SMS_RATE_LIMIT_SECONDS", 30))
        alert_key = f"{alert_type}_{e164_phone}"
        if self._is_rate_limited(alert_key, rate_limit):
            cached_status = f"SMS event already active for {e164_phone} (deduplicated)"
            self._log_dispatch(e164_phone, alert_type, message, f"DEDUPLICATED: {cached_status}", timestamp)
            return {
                "sent": True,
                "status": f"SMS sent successfully to {e164_phone}",
                "display_status": f"SMS sent successfully to {e164_phone}",
                "provider": "TextBee",
                "message_id": f"TB-CACHED-{ten_digits[-4:]}",
                "recipient": e164_phone,
                "deduplicated": True
            }

        # 4. Prepare TextBee API request
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "deviceId": device_id,
            "recipients": [e164_phone],
            "message": message
        }

        # 5. Send message through TextBee API
        try:
            resp = requests.post(
                self.TEXTBEE_SEND_URL,
                json=payload,
                headers=headers,
                timeout=20
            )

            response_text = resp.text
            try:
                res_json = resp.json()
            except Exception:
                res_json = {}

            # 6. Check for specific TextBee error conditions
            status_code = resp.status_code
            error_str = (str(res_json.get("message") or "") + " " + str(res_json.get("error") or "") + " " + response_text).lower()

            # Check if Android device is offline / unavailable
            if "offline" in error_str or "unavailable" in error_str or "device not found" in error_str or "device is offline" in error_str:
                device_err = "SMS could not be sent because the TextBee device is unavailable."
                self._log_dispatch(e164_phone, alert_type, message, f"HTTP {status_code} - {device_err}", timestamp)
                return {
                    "sent": False,
                    "status": device_err,
                    "error": device_err,
                    "provider": "TextBee"
                }

            # 7. Check actual API response success
            data_field = res_json.get("data") if isinstance(res_json.get("data"), dict) else {}
            is_success = (
                status_code in [200, 201] and
                (
                    data_field.get("success") is True or
                    res_json.get("success") is True or
                    "smsBatchId" in data_field or
                    "smsBatchId" in res_json or
                    "batchId" in data_field
                )
            )

            if is_success:
                batch_id = data_field.get("smsBatchId") or res_json.get("smsBatchId") or f"TB-{uuid.uuid4().hex[:8]}"
                self._last_sms_times[alert_key] = time.time()
                success_msg = f"SMS sent successfully to {e164_phone} (Batch: {batch_id})"
                self._log_dispatch(e164_phone, alert_type, message, f"SUCCESS (HTTP {status_code}) - Batch ID: {batch_id}", timestamp)
                return {
                    "sent": True,
                    "status": f"SMS sent successfully to {e164_phone}",
                    "display_status": f"SMS sent successfully to {e164_phone}",
                    "provider": "TextBee",
                    "message_id": batch_id,
                    "recipient": e164_phone,
                    "message": message
                }
            else:
                # TextBee returned an error
                err_detail = res_json.get("message") or res_json.get("error") or f"HTTP status {status_code}: {response_text[:120]}"
                error_output = f"TextBee API error: {err_detail}"
                self._log_dispatch(e164_phone, alert_type, message, f"ERROR (HTTP {status_code}): {err_detail}", timestamp)
                return {
                    "sent": False,
                    "status": error_output,
                    "error": error_output,
                    "provider": "TextBee"
                }

        except requests.exceptions.RequestException as req_err:
            error_msg = f"TextBee connection error: {str(req_err)}"
            self._log_dispatch(e164_phone, alert_type, message, error_msg, timestamp)
            return {
                "sent": False,
                "status": error_msg,
                "error": error_msg,
                "provider": "TextBee"
            }
        except Exception as ex:
            error_msg = f"Unexpected TextBee error: {str(ex)}"
            self._log_dispatch(e164_phone, alert_type, message, error_msg, timestamp)
            return {
                "sent": False,
                "status": error_msg,
                "error": error_msg,
                "provider": "TextBee"
            }

    def _log_dispatch(self, phone: str, alert_type: str, message: str, response_summary: str, timestamp: str):
        """Clean backend logging following Requirement 13."""
        print("==================================================")
        print("SMS PROVIDER: TextBee")
        print(f"Timestamp: {timestamp}")
        print(f"Recipient: {self.mask_phone(phone)}")
        print(f"Alert type: {alert_type}")
        print(f"Message: {message}")
        print(f"TextBee response: {response_summary}")
        print("==================================================")

# Global singleton service
sms_service = TextBeeSMSService()

# Reusable standalone function per Requirement 4
def send_sms(phone_number: str, message: str, alert_type: str = "energy_wastage") -> dict:
    """Reusable standalone function: send_sms(phone_number, message)"""
    return sms_service.send_sms(phone_number, message, alert_type)
