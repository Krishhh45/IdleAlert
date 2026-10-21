import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClassroom } from '../../context/ClassroomContext';
import { useAlerts } from '../../context/AlertContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import {
  LogOut,
  Cpu,
  AlertTriangle,
  Edit2,
  Check,
  X,
  Phone,
  Send,
  Building,
  GraduationCap,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Topbar: React.FC = () => {
  const { user, updatePhone, logout } = useAuth();
  const { classroomName, setClassroomName } = useClassroom();
  const { activeCount, fetchAlerts } = useAlerts();
  const { showToast } = useToast();

  const [modelInfo, setModelInfo] = useState<string>('Smart-Class YOLOv8 Engine');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  // SMS Number & Settings Modal State
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [smsProviderInfo, setSmsProviderInfo] = useState<any>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const [modelRes, smsRes] = await Promise.all([
          api.modelInfo(),
          api.sms.getStatus()
        ]);
        const data = modelRes.data;
        if (data.has_custom_model) {
          setModelInfo(`Classroom Model (${data.available_classes?.length || 5} targets)`);
        } else {
          setModelInfo('Classroom Model (Fan + Light + Person)');
        }
        setSmsProviderInfo(smsRes.data);
      } catch (err) {
        setModelInfo('Smart-Class YOLOv8');
      }
    };
    fetchInfo();
  }, []);

  const handleEditStart = () => {
    setEditValue(classroomName || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue.trim()) {
      setClassroomName(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleOpenSMSModal = () => {
    setPhoneInput(user?.phone || '');
    setTestResult(null);
    setShowSMSModal(true);
    api.sms.getStatus().then(res => setSmsProviderInfo(res.data)).catch(() => {});
  };

  const handleSavePhone = async () => {
    if (!phoneInput.trim()) {
      showToast('Please enter a valid phone number', 'warning');
      return;
    }
    const res = await updatePhone(phoneInput.trim());
    if (res.success) {
      showToast(res.message, 'success');
      fetchAlerts();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleTestSMS = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await api.sms.test(phoneInput.trim() || user?.phone);
      setTestResult(res.data);
      if (res.data.sent) {
        showToast(res.data.status, 'success');
      } else {
        showToast(res.data.status, 'warning');
      }
    } catch (e: any) {
      setTestResult({ sent: false, status: 'SMS failed to send', error: e.message });
      showToast('SMS request failed', 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <>
      <header className="bg-[#001938]/95 backdrop-blur-xl border-b border-[#00316E]/70 h-16 flex items-center justify-between px-6 sticky top-0 z-20 shrink-0 shadow-md">
        {/* Left: Modern Classroom Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-[#00244d] border border-[#003d7a] rounded-xl px-3.5 py-1.5 shadow-inner">
            <Building className="w-3.5 h-3.5 text-[#0084FF] mr-2 shrink-0" />
            <span className="text-[11px] font-bold text-sky-200 uppercase tracking-wider mr-2 hidden sm:inline font-['Poppins',sans-serif]">
              Classroom:
            </span>

            {isEditing ? (
              <div className="flex items-center space-x-1.5">
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className="bg-[#001633] border border-[#0084FF] rounded-lg text-white px-2 py-0.5 outline-none text-xs w-36 font-semibold"
                  placeholder="e.g. Lab 201"
                />
                <button
                  onClick={handleSave}
                  className="p-1 text-emerald-400 hover:bg-[#00316E] rounded cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-slate-400 hover:bg-[#00316E] rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleEditStart}
                className="flex items-center space-x-1.5 text-xs text-white font-bold hover:text-[#0084FF] transition-colors group cursor-pointer font-['Source_Sans_3',sans-serif]"
                title="Click to change classroom"
              >
                <span className="truncate max-w-[160px]">{classroomName || 'Main Classroom'}</span>
                <Edit2 className="w-3 h-3 text-sky-400 group-hover:text-white transition-colors" />
              </button>
            )}
          </div>
        </div>

        {/* Center: AI Engine Status Badge */}
        <div className="hidden md:flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 bg-[#00244d] border border-[#003d7a] px-3.5 py-1.5 rounded-full shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Cpu className="w-3.5 h-3.5 text-[#0084FF]" />
            <span className="text-xs font-semibold text-slate-200 tracking-tight font-['Source_Sans_3',sans-serif]">{modelInfo}</span>
          </div>

          {activeCount > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{activeCount} incident{activeCount > 1 ? 's' : ''}</span>
            </motion.div>
          )}
        </div>

        {/* Right: Phone Configuration + User Profile + Logout */}
        <div className="flex items-center space-x-3">
          {/* SMS Alert Number Pill */}
          <button
            onClick={handleOpenSMSModal}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#00244d] hover:bg-[#002d61] border border-[#003d7a] text-xs font-semibold text-sky-200 transition-all cursor-pointer shadow-sm group"
            title="Configure SMS recipient phone number"
          >
            <div className="w-2 h-2 rounded-full bg-[#0084FF] group-hover:scale-125 transition-transform" />
            <Phone className="w-3.5 h-3.5 text-sky-400 group-hover:text-white transition-colors" />
            <span className="font-mono text-xs">{user?.phone || '+919975004101'}</span>
          </button>

          {/* User Profile Chip */}
          <div className="flex items-center space-x-2.5 pl-2 border-l border-[#00316E]/70">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00316E] to-[#0084FF] border border-[#0084FF]/40 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight truncate max-w-[110px] font-['Poppins',sans-serif]">
                {user?.full_name || user?.username || 'Admin'}
              </span>
              <span className="text-[10px] text-sky-300/80 uppercase font-mono tracking-wider">
                Operator
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-8 h-8 rounded-xl bg-[#00244d] hover:bg-rose-500/20 hover:text-rose-400 border border-[#003d7a] text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* SMS Configuration Modal */}
      <AnimatePresence>
        {showSMSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#001D40] border border-[#003d7a] rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowSMSModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#002d61] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#0084FF]/20 border border-[#0084FF]/40 text-[#0084FF] flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Poppins',sans-serif]">SMS Alert Number</h3>
                  <p className="text-xs text-slate-300">Recipient mobile number for automated energy alerts</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-sky-200 block mb-1.5 uppercase tracking-wider font-['Poppins',sans-serif]">
                    Alert Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+919XXXXXXXXX"
                      className="flex-1 bg-[#001633] border border-[#003d7a] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#0084FF] transition-colors"
                    />
                    <button
                      onClick={handleSavePhone}
                      className="px-4 py-2.5 bg-[#0084FF] hover:bg-[#0070db] text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-[#0084FF]/20"
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format: +91XXXXXXXXXX or 10-digit mobile number.
                  </p>
                </div>

                {/* SMS Provider Diagnostics Display */}
                <div className="bg-[#001633] p-3.5 rounded-xl border border-[#003d7a] text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-300 font-medium">Dispatch Gateway:</span>
                    <span className="font-bold text-emerald-400">
                      {smsProviderInfo?.provider || 'Smart-Class SMS Gateway (Active)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Automated SMS alerts are online. When an unoccupied energy-wastage incident occurs, the system immediately delivers the cellular alert to this mobile number.
                  </p>
                </div>

                {/* Dispatch Test */}
                <button
                  onClick={handleTestSMS}
                  disabled={isSendingTest}
                  className="w-full py-2.5 bg-[#00244d] hover:bg-[#002d61] text-sky-200 border border-[#003d7a] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-[#0084FF]" />
                  <span>{isSendingTest ? 'Dispatching Test SMS...' : 'Test Real SMS Dispatch'}</span>
                </button>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      testResult.sent
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div className="font-bold mb-0.5">
                      {testResult.sent ? '✓ SMS Dispatched' : 'Notice'}
                    </div>
                    <div>{testResult.status}</div>
                    {testResult.message_id && (
                      <div className="font-mono text-[10px] opacity-80 mt-1">
                        Tracking ID: {testResult.message_id}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-[#00316E]/70 flex justify-end">
                <button
                  onClick={() => setShowSMSModal(false)}
                  className="px-4 py-2 bg-[#00244d] hover:bg-[#002d61] text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
