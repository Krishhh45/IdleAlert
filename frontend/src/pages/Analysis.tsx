import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { ImageAnalysisResult, VideoAnalysisResult } from '../types';
import { useToast } from '../context/ToastContext';
import { useAlerts } from '../context/AlertContext';
import { useClassroom } from '../context/ClassroomContext';
import {
  UploadCloud, Image as ImageIcon, Film, Loader2, Users, Fan,
  Lightbulb, AlertTriangle, CheckCircle2, ShieldCheck, Clock,
  Sparkles, Info, Play, RefreshCw, AlertCircle, Building, Phone, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Analysis: React.FC = () => {
  const [tab, setTab] = useState<'image' | 'video'>('image');

  // Classroom Directory & Phone integration
  const { classroomName, activePhone, upsertClassroom, getPhoneForClassroom, directory } = useClassroom();
  const [showMediaPromptModal, setShowMediaPromptModal] = useState(false);
  const [mediaPromptType, setMediaPromptType] = useState<'image' | 'video'>('video');
  const [mediaRoom, setMediaRoom] = useState(classroomName || 'A101');
  const [mediaPhone, setMediaPhone] = useState(getPhoneForClassroom(classroomName || 'A101') || activePhone);

  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageResult, setImageResult] = useState<ImageAnalysisResult | null>(null);

  // Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isVideoAnalyzing, setIsVideoAnalyzing] = useState(false);
  const [videoResult, setVideoResult] = useState<VideoAnalysisResult | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);
  const [activeVideoView, setActiveVideoView] = useState<'annotated' | 'original'>('annotated');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();
  const { fetchAlerts } = useAlerts();

  // Handlers for Image
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageResult(null);
    }
  };

  const initiateImageAnalyze = () => {
    setMediaPromptType('image');
    const room = classroomName || 'A101';
    setMediaRoom(room);
    setMediaPhone(getPhoneForClassroom(room) || activePhone);
    setShowMediaPromptModal(true);
  };

  const executeImageAnalyze = async (room: string, phone: string) => {
    if (!imageFile) return;
    setIsAnalyzingImage(true);
    try {
      const res = await api.analysis.image(imageFile, room, phone);
      setImageResult(res.data);
      if (res.data.alert_created) {
        fetchAlerts();
      }
      showToast(`Image analysis complete for ${room}!`, 'success');
    } catch (error: any) {
      console.error(error);
      showToast(error.response?.data?.detail || 'Failed to analyze image.', 'error');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Handlers for Video
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setVideoResult(null);
      setVideoLoadError(null);
      setActiveVideoView('original');
    }
  };

  const initiateVideoAnalyze = () => {
    setMediaPromptType('video');
    const room = classroomName || 'A101';
    setMediaRoom(room);
    setMediaPhone(getPhoneForClassroom(room) || activePhone);
    setShowMediaPromptModal(true);
  };

  const handleMediaRoomChange = (roomVal: string) => {
    setMediaRoom(roomVal);
    const linked = getPhoneForClassroom(roomVal);
    if (linked) {
      setMediaPhone(linked);
    }
  };

  const handleConfirmMediaAnalyze = async () => {
    const cleanRoom = mediaRoom.trim() || 'A101';
    const cleanPhone = mediaPhone.trim() || activePhone;
    await upsertClassroom(cleanRoom, cleanPhone, 'uploaded');
    setShowMediaPromptModal(false);

    if (mediaPromptType === 'video') {
      executeVideoAnalyze(cleanRoom, cleanPhone);
    } else {
      executeImageAnalyze(cleanRoom, cleanPhone);
    }
  };

  const executeVideoAnalyze = async (room: string, phone: string) => {
    if (!videoFile) return;
    setIsVideoAnalyzing(true);
    setVideoLoadError(null);
    setVideoStatus('Uploading...');

    // Progress updates
    const t1 = setTimeout(() => setVideoStatus('Processing video...'), 1500);
    const t2 = setTimeout(() => setVideoStatus('Generating annotated video...'), 4500);

    try {
      const res = await api.analysis.video(videoFile, room, phone);
      clearTimeout(t1);
      clearTimeout(t2);
      setVideoStatus('Processing complete');

      // Brief delay before switching to output view
      setTimeout(() => {
        setVideoResult(res.data);
        setActiveVideoView('annotated');
        setIsVideoAnalyzing(false);
        showToast(`Video processed for ${room}! SMS alert recipient: ${phone}`, 'success');
        fetchAlerts();
      }, 600);
    } catch (error: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      setIsVideoAnalyzing(false);
      const msg = error.response?.data?.detail || error.message || 'Failed to process video.';
      showToast(msg, 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Header with Styled Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
              Inference Lab
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Recorded Media Analysis</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Media Computer Vision Inspection
          </h1>
          <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Analyze classroom snapshots or full video footage with automated bounding box rendering.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm self-start sm:self-auto">
          <motion.button
            onClick={() => setTab('image')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              tab === 'image'
                ? 'bg-[#273087] dark:bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Analysis</span>
          </motion.button>
          <motion.button
            onClick={() => setTab('video')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              tab === 'video'
                ? 'bg-[#273087] dark:bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video Analysis</span>
          </motion.button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col relative min-h-0 shadow-xl">
        <AnimatePresence mode="wait">
          {tab === 'image' ? (
            <motion.div
              key="image-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {!imagePreview ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <motion.div
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700/80 rounded-2xl p-12 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-brand-500/50 transition-all cursor-pointer max-w-lg w-full shadow-sm hover:shadow-md"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={imageInputRef}
                      onChange={handleImageSelect}
                    />
                    <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
                      <UploadCloud className="w-8 h-8 text-brand-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1.5">Upload Classroom Image</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Select an image to detect people, fans, and evaluate energy</p>
                    <p className="text-xs text-slate-500 mt-3">JPG, PNG, WebP supported</p>
                  </motion.div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">
                  {/* Visual Media Viewer */}
                  <div className="flex-1 lg:flex-[7] bg-black rounded-xl overflow-hidden relative border border-slate-800 flex items-center justify-center min-h-[320px]">
                    {imageResult ? (
                      <img
                        src={`data:image/jpeg;base64,${imageResult.annotated_image_base64}`}
                        alt="AI Detection Overlay"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <img
                        src={imagePreview}
                        alt="Original Classroom Preview"
                        className="max-w-full max-h-full object-contain opacity-75"
                      />
                    )}

                    {isAnalyzingImage && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-3" />
                        <p className="font-semibold text-base">Running YOLOv8 Neural Inference...</p>
                        <p className="text-xs text-slate-400 mt-1">Drawing real bounding boxes & calculating confidence</p>
                      </div>
                    )}
                  </div>

                  {/* Results Panel */}
                  <div className="w-full lg:w-96 flex flex-col justify-start space-y-4 overflow-y-auto">
                    {!imageResult && !isAnalyzingImage && (
                      <div className="bg-slate-50 dark:bg-slate-950/70 p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-slate-800 dark:text-slate-300 font-medium mb-1">Image Loaded</p>
                        <p className="text-xs text-slate-500 mb-4">{imageFile?.name}</p>
                        <motion.button
                          onClick={initiateImageAnalyze}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl py-3 font-medium transition-all shadow-lg shadow-brand-600/20 flex items-center justify-center cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Run AI Detection
                        </motion.button>
                        <motion.button
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="mt-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs cursor-pointer inline-block"
                        >
                          Choose different image
                        </motion.button>
                      </div>
                    )}

                    {imageResult && (
                      <>
                        <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
                            <span className="flex items-center">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mr-1.5" />
                              Real Detection Counts
                            </span>
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{imageResult.occupancy_status}</span>
                          </h3>

                          <div className="grid grid-cols-2 gap-2.5">
                            {/* PRIMARY TARGET: Fans */}
                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-sky-500/30 shadow-sm">
                              <span className="text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1 mb-1 font-bold">
                                <Fan className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> FANS
                              </span>
                              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                                {imageResult.model_info?.has_custom_model ? imageResult.fan_count : 'N/A'}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                {imageResult.model_info?.has_custom_model
                                  ? (imageResult.fan_count > 0 ? `${imageResult.fan_count} detected` : 'None detected')
                                  : 'Model not loaded'}
                              </span>
                            </div>

                            {/* PRIMARY TARGET: Lights */}
                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-500/30 shadow-sm">
                              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1 font-bold">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> LIGHTS
                              </span>
                              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                                {imageResult.model_info?.has_custom_model
                                  ? imageResult.light_count
                                  : (imageResult.light_brightness_on ? 'ON' : 'OFF')}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                {imageResult.model_info?.has_custom_model
                                  ? (imageResult.light_count > 0 ? `${imageResult.light_count} detected` : 'None detected')
                                  : (imageResult.light_brightness_on ? 'Active' : 'Inactive')}
                              </span>
                            </div>

                            {/* SECONDARY TARGET: Occupancy / Persons */}
                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 col-span-2 flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                <div>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Classroom Occupancy</span>
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    {imageResult.occupancy_status.toUpperCase()} ({imageResult.people_count} person{imageResult.people_count !== 1 ? 's' : ''})
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-semibold ${
                                imageResult.people_count > 0 ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                {imageResult.occupancy_status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Confidence Scores List */}
                        {imageResult.detections && imageResult.detections.length > 0 && (
                          <div className="bg-slate-50/80 dark:bg-slate-950/60 rounded-xl p-3 border border-slate-200 dark:border-slate-800/80">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Detected Objects:</div>
                            <div className="space-y-1 max-h-28 overflow-y-auto">
                              {imageResult.detections.map((det, i) => (
                                <div key={i} className="flex justify-between items-center text-xs px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-200/60 dark:border-transparent">
                                  <span className="text-slate-700 dark:text-slate-200 font-medium">{det.label}</span>
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{Math.round(det.confidence * 100)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Energy Status & Smart Recommendation */}
                        <div className={`rounded-xl p-3.5 border ${
                          imageResult.energy_status === 'Normal'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                            : imageResult.energy_status === 'Warning'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                        }`}>
                          <div className="flex items-center space-x-2 mb-1">
                            {imageResult.energy_status === 'Normal' ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            )}
                            <span className="font-bold text-xs uppercase tracking-wide">
                              {imageResult.energy_status} Condition
                            </span>
                          </div>
                          <p className="text-xs opacity-90">{imageResult.energy_message}</p>
                          {imageResult.recommended_action && (
                            <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-xs font-medium">
                              <span className="underline">Recommendation:</span> {imageResult.recommended_action}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => { setImageFile(null); setImagePreview(null); setImageResult(null); }}
                          className="mt-auto w-full bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-xl py-2.5 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Analyze Another Image
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="video-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {!videoFile ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <motion.div
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700/80 rounded-2xl p-12 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-brand-500/50 transition-all cursor-pointer max-w-lg w-full shadow-sm hover:shadow-md"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      accept="video/mp4,video/avi,video/mov,video/mkv"
                      className="hidden"
                      ref={videoInputRef}
                      onChange={handleVideoSelect}
                    />
                    <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
                      <Film className="w-8 h-8 text-brand-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1.5">Upload Classroom Video</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Processes video frame-by-frame with actual YOLO detection</p>
                    <p className="text-xs text-slate-500 mt-3">MP4, AVI, MOV formats supported</p>
                  </motion.div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">
                  {/* Visual Media Viewer (Plays annotated output video or original preview) */}
                  <div className="flex-1 lg:flex-[7] bg-black rounded-xl overflow-hidden relative border border-slate-800 flex flex-col min-h-[320px]">
                    {/* View Switcher Bar (Original Video vs AI Annotated Video) */}
                    <div className="bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between z-10">
                      <div className="flex items-center gap-2">
                        {videoResult && (
                          <motion.button
                            onClick={() => setActiveVideoView('annotated')}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                              activeVideoView === 'annotated'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                          >
                            <Play className="w-3 h-3" />
                            <span>AI Annotated Video</span>
                          </motion.button>
                        )}
                        <motion.button
                          onClick={() => setActiveVideoView('original')}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeVideoView === 'original'
                              ? 'bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/40 shadow'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                          }`}
                        >
                          <Film className="w-3 h-3" />
                          <span>Original Video</span>
                        </motion.button>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-xs">
                        {videoFile.name}
                      </span>
                    </div>

                    {/* Video Player Display */}
                    <div className="flex-1 relative flex items-center justify-center p-2 bg-black">
                      {activeVideoView === 'annotated' && videoResult ? (
                        videoLoadError ? (
                          <div className="text-center p-6 text-rose-400">
                            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-80" />
                            <p className="text-sm font-medium">Video playback error: {videoLoadError}</p>
                            <a
                              href={`http://127.0.0.1:8000${videoResult.annotated_video_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-block px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg"
                            >
                              Open video directly in new tab
                            </a>
                          </div>
                        ) : (
                          <video
                            key={videoResult.annotated_video_url}
                            controls
                            playsInline
                            autoPlay
                            muted
                            loop
                            src={`http://127.0.0.1:8000${videoResult.annotated_video_url}`}
                            onError={(e) => {
                              console.error('Video element load error:', e);
                              setVideoLoadError('Browser failed to load video. Ensure the file is accessible.');
                            }}
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                        )
                      ) : videoPreviewUrl ? (
                        <video
                          key="original-video"
                          controls
                          playsInline
                          src={videoPreviewUrl}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-slate-500 flex flex-col items-center p-6 text-center">
                          <Film className="w-12 h-12 mb-2 text-slate-600" />
                          <p className="text-white font-medium">{videoFile.name}</p>
                        </div>
                      )}

                      {/* Processing Overlay with Required Status Progression */}
                      {isVideoAnalyzing && (
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center z-20">
                          <Loader2 className="w-12 h-12 animate-spin text-brand-500 mb-4" />
                          <p className="font-bold text-xl tracking-tight text-white">{videoStatus}</p>
                          <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                            Inferencing every frame with YOLO, baking visible bounding boxes, and generating browser-compatible output...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Results & Real Video Event Timeline Panel */}
                  <div className="w-full lg:w-96 flex flex-col justify-start space-y-3 overflow-y-auto">
                    {!videoResult && !isVideoAnalyzing && (
                      <div className="bg-slate-50 dark:bg-slate-950/70 p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                          Ready to process <span className="font-semibold text-slate-900 dark:text-white">{videoFile.name}</span> ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                        <motion.button
                          onClick={initiateVideoAnalyze}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl py-3 font-medium transition-all shadow-lg shadow-brand-600/20 flex items-center justify-center cursor-pointer mb-2.5"
                        >
                          <Film className="w-4 h-4 mr-2" />
                          Process & Annotate Video
                        </motion.button>
                        <motion.button
                          onClick={() => { setVideoFile(null); setVideoPreviewUrl(null); }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs cursor-pointer inline-block"
                        >
                          Select a different video
                        </motion.button>
                      </div>
                    )}

                    {videoResult && (
                      <>
                        {/* Summary Stats */}
                        <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2.5 flex items-center justify-between">
                            <span>Analysis Summary</span>
                            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              H.264 Ready
                            </span>
                          </h3>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-800">
                              <span className="text-slate-600 dark:text-slate-400">Total Video Duration</span>
                              <span className="font-mono text-slate-900 dark:text-white">{videoResult.duration_seconds}s</span>
                            </div>
                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-800">
                              <span className="text-slate-600 dark:text-slate-400">Frames Inferred</span>
                              <span className="font-mono text-slate-900 dark:text-white">{videoResult.total_frames_processed} of {videoResult.total_frames}</span>
                            </div>
                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-800">
                              <span className="text-sky-600 dark:text-sky-400 font-medium">Max Fans Detected</span>
                              <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">{videoResult.max_fans_detected}</span>
                            </div>
                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-800">
                              <span className="text-amber-600 dark:text-amber-400 font-medium">Max Lights Detected</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{videoResult.max_lights_detected}</span>
                            </div>
                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-800">
                              <span className="text-slate-600 dark:text-slate-400">Classroom Occupants (Max)</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{videoResult.max_people_detected}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 dark:text-slate-400">Wastage Frames</span>
                              <span className={`font-semibold ${videoResult.energy_wastage_frames > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {videoResult.energy_wastage_frames}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Real Video Event Timeline */}
                        <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex-1">
                          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                            Real Video Event Timeline
                          </h3>

                          {videoResult.events_timeline && videoResult.events_timeline.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {videoResult.events_timeline.map((ev, i) => (
                                <div key={i} className="flex items-start gap-2.5 text-xs py-1.5 border-b border-slate-200/80 dark:border-slate-900 last:border-0">
                                  <span className="font-mono text-brand-600 dark:text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded text-[11px] font-semibold shrink-0">
                                    {ev.timestamp}
                                  </span>
                                  <span className="text-slate-700 dark:text-slate-300 leading-tight">
                                    {ev.description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 py-2">No significant state changes recorded in video frames.</p>
                          )}
                        </div>

                        {/* Smart Recommendation */}
                        {videoResult.smart_recommendation && (
                          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
                            <span className="font-semibold block mb-0.5">Recommendation:</span>
                            <span>{videoResult.smart_recommendation}</span>
                          </div>
                        )}

                        <motion.button
                          onClick={() => { setVideoFile(null); setVideoResult(null); setVideoPreviewUrl(null); }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-xl py-2.5 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Analyze Another Video
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pre-Analysis Configuration Modal */}
      <AnimatePresence>
        {showMediaPromptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-slate-900 dark:text-white"
            >
              <button
                onClick={() => setShowMediaPromptModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  {mediaPromptType === 'video' ? <Film className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Poppins',sans-serif]">
                    {mediaPromptType === 'video' ? 'Process Recorded Video' : 'Analyze Classroom Image'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assign classroom and alert mobile recipient for this media
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider">
                    Classroom / Room Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mediaRoom}
                      onChange={(e) => handleMediaRoomChange(e.target.value)}
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
                            setMediaRoom(d.classroom);
                            setMediaPhone(d.phone);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                            mediaRoom.toLowerCase() === d.classroom.toLowerCase()
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
                    Recipient Mobile Number (Alerts)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={mediaPhone}
                      onChange={(e) => setMediaPhone(e.target.value)}
                      placeholder="+919XXXXXXXXX"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    If this recording reveals unattended fans or lights, this recipient will receive an alert SMS.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <motion.button
                    type="button"
                    onClick={() => setShowMediaPromptModal(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleConfirmMediaAnalyze}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {mediaPromptType === 'video' ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    <span>{mediaPromptType === 'video' ? 'Process Video' : 'Run Detection'}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
