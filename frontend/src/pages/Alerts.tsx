import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  Building,
  Filter,
  Check,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Alerts: React.FC = () => {
  const { alerts, acknowledgeAlert, resolveAlert } = useAlerts();
  const [filter, setFilter] = useState<'All' | 'Active' | 'Acknowledged' | 'Resolved'>('All');

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'All') return true;
    return alert.status === filter;
  });

  const activeCount = alerts.filter(a => a.status === 'Active').length;
  const criticalCount = alerts.filter(a => a.severity === 'Critical').length;
  const warningCount = alerts.filter(a => a.severity === 'Warning').length;
  const resolvedCount = alerts.filter(a => a.status === 'Resolved').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-400 font-mono">
              Incident Management
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Automated Cellular Dispatch</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-['Poppins',sans-serif]">
            Energy Wastage Incidents
          </h1>
          <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time logs of unattended electrical equipment and automated SMS notifications.
          </p>
        </div>

        {/* Telemetry Chips */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <motion.div whileHover={{ y: -2, scale: 1.02 }} className="bg-white/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-3 py-1.5 flex items-center space-x-2 shadow-sm transition-shadow hover:shadow-md cursor-default">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Active:</span>
            <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">{activeCount}</span>
          </motion.div>
          <motion.div whileHover={{ y: -2, scale: 1.02 }} className="bg-white/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-3 py-1.5 flex items-center space-x-2 shadow-sm transition-shadow hover:shadow-md cursor-default">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Critical:</span>
            <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">{criticalCount}</span>
          </motion.div>
          <motion.div whileHover={{ y: -2, scale: 1.02 }} className="bg-white/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-3 py-1.5 flex items-center space-x-2 shadow-sm transition-shadow hover:shadow-md cursor-default">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Warning:</span>
            <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">{warningCount}</span>
          </motion.div>
          <motion.div whileHover={{ y: -2, scale: 1.02 }} className="bg-white/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-3 py-1.5 flex items-center space-x-2 shadow-sm transition-shadow hover:shadow-md cursor-default">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Resolved:</span>
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">{resolvedCount}</span>
          </motion.div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center bg-white/80 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-1 rounded-xl shadow-sm">
          {(['All', 'Active', 'Acknowledged', 'Resolved'] as const).map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setFilter(tab)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-[#273087] dark:bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Showing {filteredAlerts.length} incident{filteredAlerts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Incident Cards Feed */}
      {filteredAlerts.length === 0 ? (
        <div className="py-20 text-center bg-white/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {filter === 'All' ? 'No Energy Incidents Recorded' : `No ${filter} Incidents`}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            All equipment usage matches occupancy requirements. When unoccupied rooms leave fans or lights ON, alerts will stream here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          <AnimatePresence>
            {filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className={`bg-white/90 dark:bg-slate-900/90 border rounded-2xl p-5 transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                  alert.severity === 'Critical'
                    ? 'border-rose-200 dark:border-rose-500/30 hover:border-rose-300 dark:hover:border-rose-500/50'
                    : 'border-amber-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50'
                }`}
              >
                {/* Left: Incident Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                        alert.severity === 'Critical'
                          ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                          : 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                      }`}
                    >
                      {alert.severity}
                    </span>

                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-950 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                      <Building className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                      <span>{alert.classroom_name}</span>
                    </div>

                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Just now'}
                      </span>
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase font-mono ${
                        alert.status === 'Active'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : alert.status === 'Acknowledged'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {alert.condition}
                  </h3>

                  {alert.recommended_action && (
                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 inline-block">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Recommended Action:</span>{' '}
                      {alert.recommended_action}
                    </div>
                  )}

                  {/* SMS Dispatch State */}
                  <div className="pt-1">
                    <div className="inline-flex items-center space-x-2 text-xs px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400">Cellular Alert:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        {alert.sms_sent ? `Delivered to ${alert.sms_recipient}` : (alert.sms_status || 'Dispatched')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200/80 dark:border-slate-800">
                  {alert.status === 'Active' && (
                    <div className="flex gap-2 w-full md:w-auto">
                      <motion.button
                        onClick={() => acknowledgeAlert(alert.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 md:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Acknowledge
                      </motion.button>
                      <motion.button
                        onClick={() => resolveAlert(alert.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 md:flex-none px-4 py-2 bg-[#273087] dark:bg-indigo-600 hover:bg-[#1e256b] dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1 cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </motion.button>
                    </div>
                  )}

                  {alert.status === 'Acknowledged' && (
                    <motion.button
                      onClick={() => resolveAlert(alert.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full md:w-auto px-5 py-2 bg-[#273087] dark:bg-indigo-600 hover:bg-[#1e256b] dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1 cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </motion.button>
                  )}

                  {alert.status === 'Resolved' && (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold font-mono">
                      <Check className="w-3.5 h-3.5" />
                      <span>Resolved Incident</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
