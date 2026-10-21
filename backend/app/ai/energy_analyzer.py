import cv2
import numpy as np

class EnergyAnalyzer:
    def evaluate(
        self,
        people_count: int,
        fan_on_count: int = 0,
        light_on_count: int = 0,
        fan_off_count: int = 0,
        light_off_count: int = 0,
        light_brightness_on: bool = False
    ):
        """
        Combines Person occupancy with Fan and Light ON/OFF states strictly following
        the 5 Core Energy Rules:

        1. Human Present (Person > 0) + Equipment ON:
           -> STATUS: NORMAL (Occupied - Fan/Light usage is legitimate, no wastage alert)

        2. Human Absent (Person = 0) + Fan ON (Light OFF):
           -> STATUS: WARNING (ENERGY WASTAGE DETECTED: No person is present while the fan is ON.)

        3. Human Absent (Person = 0) + Light ON (Fan OFF):
           -> STATUS: WARNING (ENERGY WASTAGE DETECTED: No person is present while the light is ON.)

        4. Human Absent (Person = 0) + Fan ON + Light ON:
           -> STATUS: CRITICAL (CRITICAL ENERGY WASTAGE: No person is present while the fan and lights are ON.)

        5. Human Absent (Person = 0) + Fan OFF + Light OFF:
           -> STATUS: NORMAL (No alert)
        """
        fan_is_on = fan_on_count > 0
        light_is_on = (light_on_count > 0) or light_brightness_on

        # RULE 1: HUMAN PRESENT + EQUIPMENT ON (or OFF)
        if people_count > 0:
            equipment_details = []
            if fan_is_on:
                equipment_details.append(f"{fan_on_count} fan{'s' if fan_on_count > 1 else ''} ON")
            if light_is_on:
                equipment_details.append("light ON")

            equip_str = f" with {', '.join(equipment_details)}" if equipment_details else ""
            return {
                "status": "Normal",
                "message": f"Classroom is occupied ({people_count} person{'s' if people_count > 1 else ''} present){equip_str}. Fan/Light usage is not considered wastage.",
                "recommended_action": "No action needed.",
                "sms_text": "",
                "fan_on": fan_is_on,
                "light_on": light_is_on,
                "is_wastage": False
            }

        # HUMAN ABSENT (people_count == 0)

        # RULE 4: HUMAN ABSENT + FAN ON + LIGHT ON
        if fan_is_on and light_is_on:
            return {
                "status": "Critical",
                "message": "CRITICAL ENERGY WASTAGE: No person is present while the fan and lights are ON.",
                "recommended_action": "Please check the classroom and switch off unnecessary electrical equipment.",
                "sms_text": "Smart Class Critical Alert: No person detected in the classroom. The fan and light are ON. Please switch them OFF to prevent energy wastage.",
                "alert_type": "FAN_LIGHT_CRITICAL",
                "fan_on": True,
                "light_on": True,
                "is_wastage": True
            }

        # RULE 2: HUMAN ABSENT + FAN ON (Light OFF)
        elif fan_is_on and not light_is_on:
            return {
                "status": "Warning",
                "message": "ENERGY WASTAGE DETECTED: No person is present while the fan is ON.",
                "recommended_action": "Please check the classroom and switch off the fan if it is not required.",
                "sms_text": "Smart Class Warning: No person detected in the classroom. The fan is ON. Please turn OFF the fan to prevent energy wastage.",
                "alert_type": "FAN_ON",
                "fan_on": True,
                "light_on": False,
                "is_wastage": True
            }

        # RULE 3: HUMAN ABSENT + LIGHT ON (Fan OFF)
        elif light_is_on and not fan_is_on:
            return {
                "status": "Warning",
                "message": "ENERGY WASTAGE DETECTED: No person is present while the light is ON.",
                "recommended_action": "Please check the classroom and switch off the light if it is not required.",
                "sms_text": "Smart Class Warning: No person detected in the classroom. The light is ON. Please turn OFF the light to prevent energy wastage.",
                "alert_type": "LIGHT_ON",
                "fan_on": False,
                "light_on": True,
                "is_wastage": True
            }

        # RULE 5: HUMAN ABSENT + FAN OFF + LIGHT OFF
        else:
            return {
                "status": "Normal",
                "message": "Classroom is unoccupied. All electrical equipment is OFF.",
                "recommended_action": "No action needed.",
                "sms_text": "",
                "alert_type": "",
                "fan_on": False,
                "light_on": False,
                "is_wastage": False
            }

    def estimate_light_from_frame(self, image_np):
        """
        Supplementary optical luminance analysis when custom YOLO light model is not loaded.
        Analyzes ceiling region (top 30%) V-channel brightness.
        """
        try:
            hsv = cv2.cvtColor(image_np, cv2.COLOR_BGR2HSV)
            v_channel = hsv[:, :, 2]
            ceiling = v_channel[:int(v_channel.shape[0] * 0.3), :]
            avg_brightness = float(np.mean(ceiling))
            is_on = avg_brightness > 140
            return {"is_on": is_on, "brightness": round(avg_brightness, 1)}
        except Exception:
            return {"is_on": False, "brightness": 0.0}

energy_analyzer = EnergyAnalyzer()
