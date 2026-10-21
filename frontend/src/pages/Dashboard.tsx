import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClassroom } from '../context/ClassroomContext';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { api } from '../services/api';
import {
  Users,
  Fan,
  Lightbulb,
  Video,
  FlaskConical,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Eye,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Smartphone,
  Leaf,
  Layers,
  Sparkles,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const { classroomName } = useClassroom();
  const { user } = useAuth();
  const { alerts, activeCount } = useAlerts();

  const [modelInfo, setModelInfo] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRealTime, setCurrentRealTime] = useState<Date>(new Date());

  // Real-time ticking clock (updates every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentRealTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatRealTime = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return timestamp;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return timestamp;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [modelRes, analyticsRes] = await Promise.all([
          api.modelInfo(),
          api.analytics.get(),
        ]);
        setModelInfo(modelRes.data);
        setAnalyticsData(analyticsRes.data);
      } catch (e) {
        console.error('Error fetching dashboard state', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const recentAlerts = alerts.slice(0, 4);

  const totalOccupants = analyticsData?.detection_summary?.people || 0;
  const totalFans = analyticsData?.detection_summary?.fans || 0;
  const totalLights = analyticsData?.detection_summary?.lights || 0;

  const kpis = [
    {
      title: 'Occupancy',
      value: totalOccupants,
      sub: totalOccupants > 0 ? 'Occupied' : 'Unoccupied',
      subColor: 'text-emerald-600',
      icon: Users,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Fans',
      value: totalFans,
      sub: totalFans > 0 ? `${totalFans} Active` : 'All Inactive',
      subColor: 'text-[#3742fa]',
      icon: Fan,
      iconBg: 'bg-indigo-50 text-[#3742fa]',
    },
    {
      title: 'Lights',
      value: totalLights,
      sub: totalLights > 0 ? `${totalLights} Active` : 'All Inactive',
      subColor: 'text-amber-600',
      icon: Lightbulb,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Energy',
      value: activeCount > 0 ? 'Warning' : 'Normal',
      sub: activeCount > 0 ? 'Wastage Detected' : 'Optimized',
      subColor: activeCount > 0 ? 'text-amber-600' : 'text-emerald-600',
      icon: Zap,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Vision Engine',
      value: 'Active',
      sub: 'YOLOv8 Edge',
      subColor: 'text-slate-500',
      icon: ShieldCheck,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Incidents',
      value: activeCount,
      sub: activeCount > 0 ? 'Action Required' : '0 Unresolved',
      subColor: activeCount > 0 ? 'text-rose-600' : 'text-slate-500',
      icon: AlertTriangle,
      iconBg: activeCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400',
      alertPulse: activeCount > 0,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* 1. Advapay Style Hero Header Section with Cascade Animations */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: -15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-[#3742fa] animate-pulse" />
          <span>YOLOv8 Edge Vision Active</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="text-slate-500 dark:text-slate-400 font-normal">{classroomName || 'Main Lab 201'}</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <div className="flex items-center space-x-1 text-[#3742fa] font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentRealTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </motion.div>

        {/* Big Display Heading (Advapay style) */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0f172a] dark:text-white font-['Poppins',sans-serif] leading-tight"
        >
          IdleAlert: AI Vision for Smart Classrooms
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed"
        >
          Real-time human occupancy telemetry, fan/light computer vision analysis, and automated cellular energy conservation alerts.
        </motion.p>

        {/* Central Action Pills */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/live"
              className="px-6 py-3 rounded-full bg-[#273087] dark:bg-[#3742fa] hover:bg-[#1e256b] dark:hover:bg-[#2e37e5] text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-[#273087]/25 dark:shadow-[#3742fa]/25 flex items-center space-x-2 group"
            >
              <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Launch Live Surveillance</span>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/analysis"
              className="px-6 py-3 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center space-x-2"
            >
              <FlaskConical className="w-4 h-4 text-[#3742fa]" />
              <span>Analyze Video / Image</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* 2. Scroll-Triggered Staggered KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 hover:border-[#3742fa]/50 dark:hover:border-[#3742fa]/60 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-[#3742fa]/10 transition-all cursor-default group"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">{kpi.title}</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${kpi.iconBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white group-hover:text-[#273087] dark:group-hover:text-[#3742fa] transition-colors">
                {kpi.value}
              </div>
              <div className={`text-[11px] font-semibold mt-1 ${kpi.subColor}`}>{kpi.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Advapay Style Floating Tablet / Surveillance Frame Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Floating Surveillance Preview Frame with Scroll Animation */}
        <motion.div
          initial={{ opacity: 0, y: 45, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 dark:shadow-black/40 flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#3742fa]/10 dark:bg-[#3742fa]/20 text-[#3742fa] flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Poppins',sans-serif]">
                    Live Classroom Surveillance
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Continuous webcam video inference with HUD bounding boxes</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <Clock className="w-3.5 h-3.5 text-[#3742fa]" />
                  <span>{currentRealTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[#3742fa] border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
                  24 FPS AI
                </span>
              </div>
            </div>

            {/* Tablet Mockup Viewport */}
            <div className="w-full aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-[#0e162f] to-[#151e3f] opacity-90" />

              <div className="relative z-10 text-center px-6">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 text-white shadow-inner"
                >
                  <Video className="w-8 h-8 text-[#5352ed]" />
                </motion.div>
                <h3 className="text-base font-bold text-white mb-1 font-['Poppins',sans-serif]">
                  AI Camera Ready for Live Stream
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed mb-6 font-['Source_Sans_3',sans-serif]">
                  Connect your laptop webcam or classroom CCTV camera to monitor real-time occupant counts and prevent unattended equipment energy wastage.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      to="/live"
                      className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#273087] dark:bg-[#3742fa] hover:bg-[#1e256b] dark:hover:bg-[#2e37e5] text-white rounded-full text-xs font-bold shadow-lg shadow-[#273087]/30 dark:shadow-[#3742fa]/30 transition-all cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Launch Live Surveillance</span>
                    </Link>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      to="/analysis"
                      className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold border border-white/20 backdrop-blur-md transition-all cursor-pointer"
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-sky-300" />
                      <span>Analyze Recorded Media</span>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block mb-0.5">Model Weights</span>
              <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">YOLOv8n Active</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block mb-0.5">Energy Logic</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">5 Rules Active</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block mb-0.5">Cellular SMS</span>
              <span className="text-xs font-bold text-[#3742fa] dark:text-[#5352ed] font-mono">Gateway Ready</span>
            </div>
          </div>
        </motion.div>

        {/* Right 5 Columns: Incident Stream & Alerts with Scroll Stagger */}
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 dark:shadow-black/40 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Poppins',sans-serif]">
                    Incident Logs & Alerts
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Energy wastage triggers & dispatch logs</p>
                </div>
              </div>

              <Link
                to="/alerts"
                className="text-xs text-[#273087] dark:text-[#5352ed] hover:text-[#3742fa] flex items-center space-x-1 font-bold group"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Alert List */}
            {alerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-14 px-4 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-white font-['Poppins',sans-serif]">
                  All Classrooms Normal
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Zero active energy wastage incidents detected. Equipment usage is fully optimized.
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {recentAlerts.map((alert, i) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                    className="p-4 bg-slate-50/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl hover:border-[#3742fa]/40 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            alert.severity === 'Critical'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">
                          {alert.classroom_name}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatRealTime(alert.created_at)}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {alert.condition}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                        {alert.recommended_action}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] shrink-0 font-bold">
                        SMS: {alert.sms_sent ? 'Sent' : 'Queued'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/alerts"
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
            >
              <span>Manage & Acknowledge All ({alerts.length}) Incidents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* 4. About The Project: Modern Advapay-style Bento Showcase */}
      <section className="pt-6 pb-4 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#3742fa]/10 text-[#3742fa] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Project Overview & Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0f172a] dark:text-white font-['Poppins',sans-serif]">
            About The IdleAlert Project
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Every year, academic institutions waste thousands of kilowatt-hours due to unattended fans and lighting operating in vacant classrooms. This platform bridges edge computer vision, automated rule inference, and cellular telecommunications to autonomously stop campus power wastage.
          </p>
        </div>

        {/* 3 Core Pillars Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <motion.div
            whileHover={{ y: -6 }}
            className="p-6 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-black/40 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#3742fa] flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Poppins',sans-serif]">
              Edge YOLOv8 Intelligence
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Custom neural models run inference on live classroom video feeds, predicting human occupancy, ceiling fan states, and fluorescent lamps in real time with sub-50ms latency.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">YOLOv8 Nano</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">24+ FPS</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">Daylight Rejection</span>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            whileHover={{ y: -6 }}
            className="p-6 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-black/40 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Poppins',sans-serif]">
              Automated Conservation Logic
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              A state-machine continuously evaluates occupancy. If room occupancy drops to zero while appliances remain running, an energy incident is logged and dispatched instantly.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">Zero-Occupancy Logic</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">~35% Conservation</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">Audit Trail</span>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            whileHover={{ y: -6 }}
            className="p-6 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-black/40 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Poppins',sans-serif]">
              Instant Cellular SMS Alerts
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Direct cloud telephony integration delivers SMS notifications directly to staff mobile devices via TextBee, with custom classroom IDs and action guidance.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">TextBee Gateway</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">&lt; 3s Delivery</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">No App Required</span>
            </div>
          </motion.div>
        </div>

        {/* How It Works Pipeline */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#3742fa]/10 text-[#3742fa] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Poppins',sans-serif]">
                How The Pipeline Operates
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">From live camera photon capture to automated cellular notification</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-bold font-mono text-[#3742fa]">01. INGESTION</span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Video Stream</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Captures 720p/1080p surveillance video feeds from classroom webcams or IP cameras.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-bold font-mono text-[#3742fa]">02. DETECTION</span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Spatial Vision</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                YOLOv8 predicts bounding boxes for persons, active ceiling fans, and fluorescent lamps.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-bold font-mono text-amber-500">03. EVALUATION</span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Logic Engine</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Determines if occupancy is zero. If fans or lights remain powered, triggers an incident.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-bold font-mono text-emerald-500">04. DISPATCH</span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">SMS Notification</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Dispatches real cellular SMS through TextBee directly to the lab administrator's mobile.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
