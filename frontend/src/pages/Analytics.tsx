import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AnalyticsData } from '../types';
import {
  BarChart3,
  Users,
  Zap,
  CheckCircle,
  ShieldAlert,
  Clock,
  Activity,
  Video,
  TrendingUp,
  Layers
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.analytics.get();
        setData(res.data);
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!data?.has_data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 max-w-lg w-full shadow-xl dark:shadow-2xl"
        >
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5 text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Analytics Data Available Yet</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Start Live Monitoring or analyze classroom footage to generate historical metrics. All data is populated from live AI inference.
          </p>
          <Link
            to="/live"
            className="inline-flex items-center gap-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Launch Live Monitoring</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
              Telemetry Records
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Historical Computer Vision Metrics</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Surveillance Analytics
          </h1>
          <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Historical occupancy curves, energy anomaly frequencies, and completed camera runs.
          </p>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl self-start md:self-auto shadow-sm"
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Real-time Telemetry Synced</span>
        </motion.div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          whileHover={{ y: -3, scale: 1.01 }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-default"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Sessions</span>
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono">{data.total_monitoring_sessions}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Live surveillance runs</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ y: -3, scale: 1.01 }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-default"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Incidents</span>
            <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono">{data.alert_counts.total}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Energy anomalies logged</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          whileHover={{ y: -3, scale: 1.01 }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-default"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Incidents</span>
            <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono">{data.alert_counts.active}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Pending resolution</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ y: -3, scale: 1.01 }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-default"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Resolved</span>
            <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{data.alert_counts.resolved}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Successfully conserved</span>
        </motion.div>
      </div>

      {/* Real Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
        >
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
            <span>Occupancy Over Time (Recent Logs)</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.occupancy_over_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px', color: '#f8fafc' }}
                />
                <Line type="monotone" dataKey="people_count" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} name="Persons" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Energy Wastage Incidents Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
        >
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
            <span>Energy Alerts Timeline</span>
            <Zap className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.energy_alerts_over_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px', color: '#f8fafc' }}
                />
                <Bar dataKey="people_count" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Wastage Frames" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Completed Sessions Table */}
      {data.sessions_summary && data.sessions_summary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
        >
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Completed Monitoring Sessions</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="pb-3">Classroom</th>
                  <th className="pb-3">Start Time</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Avg Occupancy</th>
                  <th className="pb-3">Max Occupants</th>
                  <th className="pb-3">Wastage Events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {data.sessions_summary.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{s.classroom_name}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 font-mono">{s.start_time}</td>
                    <td className="py-3 font-mono">{s.duration_seconds}s</td>
                    <td className="py-3">{s.avg_occupancy} persons</td>
                    <td className="py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{s.max_people}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${s.energy_wastage_events > 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'text-slate-500 dark:text-slate-400'}`}>
                        {s.energy_wastage_events}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
