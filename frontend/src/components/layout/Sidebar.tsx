import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  FlaskConical,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';
import { motion } from 'framer-motion';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { activeCount } = useAlerts();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Live Monitoring', path: '/live', icon: Video },
    { name: 'Media Analysis', path: '/analysis', icon: FlaskConical },
    { name: 'Alerts & Incidents', path: '/alerts', icon: AlertTriangle, badge: activeCount },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 bg-gradient-to-b from-[#001938] via-[#00214D] to-[#001633] border-r border-[#00316E]/70 flex flex-col h-screen text-slate-200 z-30 select-none shadow-2xl"
    >
      {/* Brand Header (Smart-ClassRoom Logo style) */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#00316E]/70 bg-[#001633]/60">
        {!collapsed ? (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00316E] to-[#0084FF] flex items-center justify-center shadow-md shadow-[#0084FF]/20 shrink-0 border border-[#0084FF]/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-tight leading-none font-['Poppins',sans-serif]">
                Smart-<span className="text-[#0084FF]">ClassRoom</span>
              </span>
              <span className="text-[10px] text-sky-200/70 font-mono tracking-wider uppercase mt-1">
                AI Vision Platform
              </span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-tr from-[#00316E] to-[#0084FF] flex items-center justify-center shadow-md shadow-[#0084FF]/20 border border-[#0084FF]/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
        )}

        <button
          onClick={onToggle}
          className="w-7 h-7 rounded-lg bg-[#002b5c] border border-[#004599] text-sky-200 hover:text-white hover:bg-[#003875] flex items-center justify-center transition-all cursor-pointer shadow-sm"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-sky-300/60 font-['Poppins',sans-serif]">
          {!collapsed ? 'CAMPUS OPERATIONS' : '•••'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? 'justify-center' : 'justify-start px-3.5'} py-2.5 rounded-xl transition-all duration-150 group relative text-xs font-semibold ${
                  isActive
                    ? 'bg-[#0084FF]/20 text-white border border-[#0084FF]/50 shadow-sm shadow-[#0084FF]/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#00316E]/40 border border-transparent'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#0084FF]' : 'text-sky-300/70 group-hover:text-white'
                    }`}
                  />

                  {!collapsed && (
                    <span className="ml-3 truncate font-['Source_Sans_3',sans-serif]">{item.name}</span>
                  )}

                  {item.badge !== undefined && item.badge > 0 && (
                    <div
                      className={`${
                        collapsed ? 'absolute top-1.5 right-1.5' : 'ml-auto'
                      } bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px] h-[18px] shadow-sm shadow-rose-500/40`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}

                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#0084FF] rounded-r-full shadow-sm shadow-[#0084FF]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Edge Engine Pill */}
      <div className="p-3 border-t border-[#00316E]/70 bg-[#001633]/80">
        {!collapsed ? (
          <div className="bg-[#00244d] border border-[#003d7a] rounded-xl p-2.5 flex items-center space-x-2.5 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="overflow-hidden">
              <div className="text-[11px] font-bold text-white truncate font-['Poppins',sans-serif]">YOLOv8 Vision Active</div>
              <div className="text-[10px] text-sky-200/70 font-mono truncate">Smart-Class Hub v2.6</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Smart-Class Vision Engine Active">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </motion.aside>
  );
};
