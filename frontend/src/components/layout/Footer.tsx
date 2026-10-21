import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Video, FlaskConical, AlertTriangle, BarChart2, Cpu, Zap, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full relative z-10 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#070D1F]/80 backdrop-blur-2xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-200/60 dark:border-slate-800/60">
          {/* Col 1 & 2: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2 shrink-0 group">
              <span className="text-2xl font-bold tracking-tight text-[#0f172a] dark:text-white font-['Poppins',sans-serif]">
                IdleAlert
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#3742fa] group-hover:scale-125 transition-transform" />
            </Link>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              AI-driven Edge Vision & Automated Cellular Telecommunications platform designed to eradicate institutional energy waste across modern smart campuses.
            </p>

            <div className="flex items-center space-x-3 pt-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Edge Vision Engine Operational</span>
              </div>
            </div>
          </div>

          {/* Col 3: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-['Poppins',sans-serif]">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/" className="hover:text-[#3742fa] dark:hover:text-[#5352ed] transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/live" className="hover:text-[#3742fa] dark:hover:text-[#5352ed] transition-colors">
                  Live Surveillance
                </Link>
              </li>
              <li>
                <Link to="/analysis" className="hover:text-[#3742fa] dark:hover:text-[#5352ed] transition-colors">
                  Recorded Media Analysis
                </Link>
              </li>
              <li>
                <Link to="/alerts" className="hover:text-[#3742fa] dark:hover:text-[#5352ed] transition-colors">
                  Incidents & Dispatch
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-[#3742fa] dark:hover:text-[#5352ed] transition-colors">
                  Energy Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Tech Stack */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-['Poppins',sans-serif]">
              Technology Stack
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
              <li className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#3742fa]" />
                <span>YOLOv8 Edge Neural Net</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>FastAPI Python Engine</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span>TextBee Cellular SMS Gateway</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                <span>PyTorch / TorchScript</span>
              </li>
            </ul>
          </div>

          {/* Col 5: Project Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-['Poppins',sans-serif]">
              Capstone 26
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Engineered as an automated IoT energy audit and real-time vision surveillance ecosystem for academic classrooms and laboratories.
            </p>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <div>Classroom: Main Lab 201</div>
              <div>Telemetry: 24 FPS Live</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Credits */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 IdleAlert Project (Capstone 26). All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="font-mono text-[11px]">Build v2.4.0-edge</span>
            <span>•</span>
            <span>AI Energy Conservation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
