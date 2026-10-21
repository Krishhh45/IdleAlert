export interface User {
  id: number;
  full_name: string;
  username: string;
  phone: string;
}

export type EnergyStatus = 'Normal' | 'Warning' | 'Critical';
export type SystemStatus = 'Normal' | 'Warning' | 'Critical' | 'Unknown';

export interface Detection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  label: string;
}

export interface ModelInfo {
  has_custom_model: boolean;
  available_classes: string[];
  model_type: string;
}

export interface FrameResult {
  detections: Detection[];
  people_count: number;
  fan_count: number;
  light_count: number;
  fan_on_count?: number;
  fan_off_count?: number;
  light_on_count?: number;
  light_off_count?: number;
  litter_count: number;
  occupancy_status: string;
  light_estimated: boolean;
  light_brightness_on: boolean;
  energy_status: EnergyStatus;
  energy_message: string;
  recommended_action: string;
  alert_created: boolean;
  annotated_frame: string;
  model_info: ModelInfo;
}

export interface ImageAnalysisResult {
  detections: Detection[];
  people_count: number;
  fan_count: number;
  light_count: number;
  fan_on_count?: number;
  fan_off_count?: number;
  light_on_count?: number;
  light_off_count?: number;
  litter_count: number;
  occupancy_status: string;
  light_estimated: boolean;
  light_brightness_on: boolean;
  energy_status: EnergyStatus;
  energy_message: string;
  recommended_action: string;
  alert_created: boolean;
  annotated_image_base64: string;
  model_info: ModelInfo;
}

export interface VideoTimelineEvent {
  timestamp: string;
  seconds: number;
  event_type: string;
  description: string;
}

export interface VideoAnalysisResult {
  annotated_video_url: string;
  total_frames_processed: number;
  total_frames: number;
  duration_seconds: number;
  max_people_detected: number;
  max_fans_detected: number;
  max_lights_detected: number;
  energy_wastage_frames: number;
  energy_status_summary: string;
  smart_recommendation: string;
  events_timeline: VideoTimelineEvent[];
  model_info: ModelInfo;
}

export interface SessionSummary {
  session_id: number;
  classroom_name: string;
  duration_seconds: number;
  duration_formatted: string;
  avg_occupancy: number;
  max_people: number;
  fans_detected: number;
  lights_detected: number;
  energy_wastage_events: number;
  alerts_generated: number;
  total_frames: number;
}

export interface Alert {
  id: number;
  classroom_name: string;
  alert_type: string;
  severity: string;
  condition: string;
  recommended_action: string;
  status: string;
  sms_sent: boolean;
  sms_status: string;
  sms_recipient: string;
  sms_message?: string;
  created_at: string;
  resolved_at: string | null;
}

export interface AnalyticsData {
  has_data: boolean;
  total_monitoring_sessions: number;
  total_frames_analyzed?: number;
  occupancy_over_time: Array<{
    timestamp: string;
    people_count: number;
    fan_count: number;
    light_count: number;
    energy_status: string;
  }>;
  energy_alerts_over_time: Array<{
    timestamp: string;
    energy_status: string;
    people_count: number;
  }>;
  sessions_summary?: Array<{
    session_id: number;
    classroom_name: string;
    start_time: string;
    duration_seconds: number;
    avg_occupancy: number;
    max_people: number;
    energy_wastage_events: number;
    alerts_generated: number;
  }>;
  detection_summary: {
    people: number;
    fans: number;
    lights: number;
  };
  alert_counts: {
    total: number;
    active: number;
    resolved: number;
  };
}
