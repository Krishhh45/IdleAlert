import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { FrameResult, SessionSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import { useClassroom } from '../context/ClassroomContext';
import { useAlerts } from '../context/AlertContext';
import { useToast } from '../context/ToastContext';
import {
  Video,
  VideoOff,
  Users,
  Fan,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Activity,
  BarChart2,
  Info,
  Clock,
  Zap,
  Radio,
  Eye,
  Maximize2,
  Building,
  Phone,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LiveMonitoring: React.FC = () => {
  const { user } = useAuth();
  const { classroomName, activePhone, upsertClassroom, getPhoneForClassroom, directory } = useClassroom();
  const { fetchAlerts } = useAlerts();
  const { showToast } = useToast();

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [latestResult, setLatestResult] = useState<FrameResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-stream modal setup
  const [showStartModal, setShowStartModal] = useState(false);
  const [targetRoom, setTargetRoom] = useState(classroomName || 'A101');
  const [targetPhone, setTargetPhone] = useState(getPhoneForClassroom(classroomName || 'A101') || activePhone);
  const [currentRoom, setCurrentRoom] = useState(classroomName || 'A101');
  const [currentPhone, setCurrentPhone] = useState(activePhone);

  // Session Tracking
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Elapsed timer for active session
  useEffect(() => {
    let interval: any;
    if (isMonitoring) {
      interval = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setSessionSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Critical fix: Ensure video element always binds and plays stream
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.warn('Video play caught:', err));
    }
  }, [stream, isMonitoring]);

  const handleInitiateCamera = () => {
    const room = classroomName || 'A101';
    setTargetRoom(room);
    setTargetPhone(getPhoneForClassroom(room) || activePhone);
    setShowStartModal(true);
  };

  const handleRoomChange = (roomVal: string) => {
    setTargetRoom(roomVal);
    const linked = getPhoneForClassroom(roomVal);
    if (linked) {
      setTargetPhone(linked);
    }
  };

  const handleConfirmStart = async () => {
    const cleanRoom = targetRoom.trim() || 'A101';
    const cleanPhone = targetPhone.trim() || activePhone;
    await upsertClassroom(cleanRoom, cleanPhone, 'live');
    setCurrentRoom(cleanRoom);
    setCurrentPhone(cleanPhone);
    setShowStartModal(false);
    await executeStartCamera(cleanRoom, cleanPhone);
  };

  const executeStartCamera = async (activeRoom: string, activeNum: string) => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24 } },
        audio: false
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play error:", playErr);
        }
      }

      // Create a real Monitoring Session
      try {
        const sessionRes = await api.monitoring.startSession(activeRoom);
        setSessionId(sessionRes.data.session_id);
      } catch (sessErr) {
        console.warn('Session init warning:', sessErr);
      }

      setIsMonitoring(true);
      showToast(`Live monitoring started for ${activeRoom} (Alerts to: ${activeNum})`, 'info');
    } catch (err: any) {
      console.error("Camera access error:", err);
      let errorMsg = "Camera access error. Please check your webcam.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = "Camera permission denied. Please allow camera access in your browser.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = "No webcam detected.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = "Camera is already in use by another application.";
      }
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const stopCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (sessionId) {
      try {
        const summaryRes = await api.monitoring.stopSession(sessionId);
        setSessionSummary(summaryRes.data);
        setShowSummaryModal(true);
      } catch (sumErr) {
        console.error('Failed to get session summary:', sumErr);
      }
      setSessionId(null);
    }

    setIsMonitoring(false);
    setLatestResult(null);
    showToast('Monitoring session ended.', 'info');
  }, [stream, sessionId, showToast]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Real-time frame capture and YOLO processing loop
  useEffect(() => {
    if (!isMonitoring || !videoRef.current) return;

    let isActive = true;

    const processFrame = async () => {
      if (!isActive || !videoRef.current) return;

      const video = videoRef.current;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        let canvas = canvasRef.current;
        if (!canvas) {
          canvas = document.createElement('canvas');
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64Image = canvas.toDataURL('image/jpeg', 0.85);

          try {
            setIsProcessing(true);
            const res = await api.monitoring.processFrame(
              base64Image,
              sessionId,
              currentRoom || 'A101',
              currentPhone || user?.phone || null
            );

            if (isActive) {
              setLatestResult(res.data);
              if (res.data.alert_created) {
                fetchAlerts();
                showToast(`Energy alert created! ${res.data.energy_message}`, 'warning');
              }
            }
          } catch (err) {
            console.error('Frame processing error:', err);
          } finally {
            if (isActive) setIsProcessing(false);
          }
        }
      }

      if (isActive) {
        setTimeout(processFrame, 500);
      }
    };

    const timeout = setTimeout(processFrame, 400);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [isMonitoring, sessionId, currentRoom, currentPhone, user, fetchAlerts, showToast]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col lg:flex-row h-[calc(100vh-5rem)] p-4 lg:p-6 gap-5 overflow-hidden"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Live Camera Feed Area (Broadcast Vision HUD) */}
      <div className="flex-1 lg:flex-[7] bg-slate-950 border border-slate-800 rounded-3xl flex flex-col overflow-hidden relative shadow-2xl">
        {/* Stream Top HUD Strip */}
        <div className="h-14 border-b border-slate-800/90 px-5 flex items-center justify-between bg-slate-950/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isMonitoring ? (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600"></span>
              )}
              <span className="font-bold text-xs uppercase tracking-wider text-white">
                Live Vision Stream
              </span>
            </div>

            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono">
              <Building className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-white font-bold">{currentRoom || 'A101'}</span>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-300">
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentPhone}</span>
            </div>

            {isMonitoring && (
              <span className="ml-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-slate-900 text-indigo-300 border border-slate-800 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-indigo-400" />
                {formatTimer(sessionSeconds)}
              </span>
            )}
          </div>

          {/* Action Button */}
          <motion.button
            onClick={isMonitoring ? stopCamera : handleInitiateCamera}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer ${
              isMonitoring
                ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {isMonitoring ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span>{isMonitoring ? 'Stop Monitoring' : 'Start Camera'}</span>
          </motion.button>
        </div>

        {/* Viewport - Always mounted video element with live SVG bounding box overlay */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          {/* Always mounted video element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain ${isMonitoring && !error ? 'block' : 'hidden'}`}
          />

          {/* Live SVG Bounding Box Layer */}
          {isMonitoring && !error && latestResult?.detections && latestResult.detections.length > 0 && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                {latestResult.detections.map((det, idx) => {
                  const x = det.x1 * 1000;
                  const y = det.y1 * 1000;
                  const w = (det.x2 - det.x1) * 1000;
                  const h = (det.y2 - det.y1) * 1000;

                  const isFan = det.label.includes('Fan');
                  const isLight = det.label.includes('Light');
                  const isPerson = det.label === 'Person';

                  const strokeColor = isFan ? '#38bdf8' : isLight ? '#f59e0b' : isPerson ? '#10b981' : '#a855f7';
                  const labelText = `${det.label.toUpperCase()} ${Math.round(det.confidence * 100)}%`;

                  return (
                    <g key={idx}>
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="3.5"
                        rx="4"
                      />
                      <rect
                        x={x}
                        y={Math.max(0, y - 26)}
                        width={labelText.length * 9.5 + 14}
                        height="26"
                        fill={strokeColor}
                        rx="3"
                      />
                      <text
                        x={x + 7}
                        y={Math.max(18, y - 8)}
                        fill={isPerson ? '#ffffff' : '#000000'}
                        fontSize="13"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {labelText}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* HUD Overlay Badge */}
          {isMonitoring && !error && (
            <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center gap-2 pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE INFERENCE FEED</span>
            </div>
          )}

          {/* Processing Indicator */}
          {isMonitoring && isProcessing && (
            <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md text-[11px] text-white px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-2 pointer-events-none">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              <span className="font-mono">Inferencing</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-center text-rose-400 px-6 max-w-md z-20">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <p className="text-base font-semibold text-rose-300 mb-1">Webcam Error</p>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
          )}

          {/* Inactive Empty State */}
          {!isMonitoring && !error && (
            <div className="text-center text-slate-400 px-6 z-20 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 shadow-inner text-indigo-400">
                <Video className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Webcam Inactive</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-5">
                Click "Start Camera" above to begin real-time YOLO object detection on your laptop webcam feed.
              </p>
              <button
                onClick={handleInitiateCamera}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Launch Webcam Stream
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats & Real-Time Telemetry Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col overflow-y-auto shadow-xl text-slate-800 dark:text-slate-100">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-[#273087] dark:text-[#3742fa] mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider font-['Poppins',sans-serif]">Telemetry HUD</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Current frame detections & energy evaluation</p>
        </div>

        <div className="p-5 space-y-4 flex-1">
          {!isMonitoring || !latestResult ? (
            <div className="text-center text-slate-500 py-16">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Live detection metrics and equipment status will appear here as soon as camera monitoring begins.
              </p>
            </div>
          ) : (
            <>
              {/* Energy Status Card */}
              <motion.div
                key={latestResult.energy_status}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-xl border flex items-start space-x-3 ${
                  latestResult.energy_status === 'Normal'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    : latestResult.energy_status === 'Warning'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                }`}
              >
                {latestResult.energy_status === 'Normal' ? (
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs tracking-wider uppercase">
                      {latestResult.energy_status}
                    </span>
                    <span className="text-[10px] font-mono opacity-80 uppercase">
                      {latestResult.occupancy_status}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-95 text-slate-700 dark:text-slate-200">
                    {latestResult.energy_message}
                  </p>
                </div>
              </motion.div>

              {/* PRIMARY TARGETS: Fans & Lights */}
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Fans */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-sky-500/30">
                  <div className="flex items-center justify-between text-sky-600 dark:text-sky-400 mb-1">
                    <span className="text-xs font-bold tracking-wide uppercase">FANS</span>
                    <Fan className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                      {latestResult.fan_on_count ?? latestResult.fan_count}
                    </span>
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase">ON</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Fans OFF: <span className="font-mono text-slate-800 dark:text-slate-300 font-semibold">{latestResult.fan_off_count ?? 0}</span>
                  </div>
                </div>

                {/* 2. Lights */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-amber-500/30">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                    <span className="text-xs font-bold tracking-wide uppercase">LIGHTS</span>
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                      {latestResult.light_on_count ?? latestResult.light_count}
                    </span>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">ON</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Lights OFF: <span className="font-mono text-slate-800 dark:text-slate-300 font-semibold">{latestResult.light_off_count ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* SECONDARY TARGET: Occupancy */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider mb-0.5">
                    Classroom Occupancy
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      latestResult.people_count > 0 ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {latestResult.people_count > 0 ? 'OCCUPIED' : 'UNOCCUPIED'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      ({latestResult.people_count} person{latestResult.people_count !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              {/* Detected Objects List */}
              {latestResult.detections && latestResult.detections.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Detected Objects in Frame:</div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {latestResult.detections.map((det, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/50">
                        <span className={`font-semibold ${
                          det.label.includes('Fan') ? 'text-sky-600 dark:text-sky-400' : det.label.includes('Light') ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                        }`}>{det.label}</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{Math.round(det.confidence * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Smart Recommendation Banner */}
              {latestResult.energy_status !== 'Normal' && latestResult.recommended_action && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-semibold block mb-0.5">Action Plan:</span>
                  <span>{latestResult.recommended_action}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pre-Stream Configuration Modal */}
      <AnimatePresence>
        {showStartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-slate-900 dark:text-white"
            >
              <button
                onClick={() => setShowStartModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Poppins',sans-serif]">
                    Connect Live Stream
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set classroom identifier & alert recipient mobile number
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider">
                    Classroom / Lab Identifier
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={targetRoom}
                      onChange={(e) => handleRoomChange(e.target.value)}
                      placeholder="e.g. A101, Lab 201"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                      autoFocus
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                  {/* Quick Suggestions from Directory */}
                  {directory.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 mr-1 self-center">Recent:</span>
                      {directory.slice(0, 4).map((d) => (
                        <button
                          key={d.classroom}
                          type="button"
                          onClick={() => {
                            setTargetRoom(d.classroom);
                            setTargetPhone(d.phone);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                            targetRoom.toLowerCase() === d.classroom.toLowerCase()
                              ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/40 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {d.classroom}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider">
                    Alert Recipient Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={targetPhone}
                      onChange={(e) => setTargetPhone(e.target.value)}
                      placeholder="+919XXXXXXXXX"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    When fans or lights are left ON in an empty room, this number receives an automated SMS.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <motion.button
                    type="button"
                    onClick={() => setShowStartModal(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleConfirmStart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Confirm & Start Camera</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Session Summary Modal */}
      <AnimatePresence>
        {showSummaryModal && sessionSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl"
            >
              <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monitoring Session Summary</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Classroom: {sessionSummary.classroom_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Duration</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{sessionSummary.duration_formatted}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Average Occupancy</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{sessionSummary.avg_occupancy} persons</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Peak Occupants</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{sessionSummary.max_people} detected</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Wastage Events</span>
                  <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{sessionSummary.energy_wastage_events}</span>
                </div>
              </div>

              <motion.button
                onClick={() => setShowSummaryModal(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer shadow-md"
              >
                Close Summary
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
