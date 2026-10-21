import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useClassroom } from '../../context/ClassroomContext';
import { useAlerts } from '../../context/AlertContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  Video,
  Edit2,
  Check,
  X,
  Phone,
  Send,
  Building,
  LogOut,
  Menu,
  Sun,
  Moon,
  Film,
  Trash2,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { user, updatePhone, logout } = useAuth();
  const {
    classroomName,
    setClassroomName,
    activePhone,
    setActivePhone,
    directory,
    updateClassroomPhone,
    upsertClassroom,
    removeClassroom
  } = useClassroom();
  const { activeCount, fetchAlerts } = useAlerts();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editRoomValue, setEditRoomValue] = useState('');
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [smsProviderInfo, setSmsProviderInfo] = useState<any>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Directory editing states
  const [editingRoomKey, setEditingRoomKey] = useState<string | null>(null);
  const [editingPhoneValue, setEditingPhoneValue] = useState('');
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPhone, setNewRoomPhone] = useState(activePhone || '+919975004101');
  const [newRoomSource, setNewRoomSource] = useState<'live' | 'uploaded'>('live');

  const { theme, toggleTheme } = useTheme();

  // Dynamic Scroll Detection for Glassmorphism elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api.sms.getStatus().then((res) => setSmsProviderInfo(res.data)).catch(() => {});
  }, []);

  const handleEditRoomStart = () => {
    setEditRoomValue(classroomName || 'A101');
    setIsEditingRoom(true);
  };

  const handleSaveRoom = () => {
    if (editRoomValue.trim()) {
      setClassroomName(editRoomValue.trim());
    }
    setIsEditingRoom(false);
  };

  const handleOpenSMSModal = () => {
    setPhoneInput(activePhone || user?.phone || '+919975004101');
    setTestResult(null);
    setEditingRoomKey(null);
    setShowAddRoomForm(false);
    setShowSMSModal(true);
    api.sms.getStatus().then((res) => setSmsProviderInfo(res.data)).catch(() => {});
  };

  const handleStartEditDirectoryPhone = (room: string, currentPhone: string) => {
    setEditingRoomKey(room);
    setEditingPhoneValue(currentPhone);
  };

  const handleSaveDirectoryPhone = (room: string) => {
    if (!editingPhoneValue.trim()) {
      showToast('Please enter a valid phone number', 'warning');
      return;
    }
    updateClassroomPhone(room, editingPhoneValue.trim());
    setEditingRoomKey(null);
    showToast(`Updated alert number for ${room}`, 'success');
  };

  const handleSelectActiveRoom = (room: string, phone: string) => {
    setClassroomName(room);
    setActivePhone(phone);
    showToast(`Active room set to ${room} (${phone})`, 'info');
  };

  const handleAddNewClassroomLink = async () => {
    if (!newRoomName.trim()) {
      showToast('Please enter a classroom name', 'warning');
      return;
    }
    if (!newRoomPhone.trim()) {
      showToast('Please enter a mobile number', 'warning');
      return;
    }
    await upsertClassroom(newRoomName.trim(), newRoomPhone.trim(), newRoomSource);
    setNewRoomName('');
    setShowAddRoomForm(false);
    showToast(`Classroom ${newRoomName} linked with ${newRoomPhone}`, 'success');
  };

  const handleSavePhone = async () => {
    if (!phoneInput.trim()) {
      showToast('Please enter a valid phone number', 'warning');
      return;
    }
    setActivePhone(phoneInput.trim());
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

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Live Monitoring', path: '/live' },
    { name: 'Media Analysis', path: '/analysis' },
    { name: 'Alerts & Incidents', path: '/alerts', badge: activeCount },
    { name: 'Analytics', path: '/analytics' },
  ];

  return (
    <>
      {/* 
        Sticky Glassmorphic Header:
        Always visible when scrolling down, with frosted glass blur and specular highlights
      */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ease-in-out ${
          scrolled
            ? 'bg-white/75 dark:bg-[#070D1F]/80 backdrop-blur-2xl border-b border-white/70 dark:border-slate-800/80 shadow-[0_12px_35px_-8px_rgba(0,0,0,0.15)] py-2.5'
            : 'bg-white/60 dark:bg-[#070D1F]/60 backdrop-blur-xl border-b border-white/50 dark:border-slate-800/50 shadow-sm py-4'
        }`}
        style={{
          WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(190%)' : 'blur(16px) saturate(160%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* 1. Left: Brand Logo (Advapay style - clean modern lowercase typography) */}
          <Link to="/" className="flex items-center space-x-2 shrink-0 group">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#0f172a] dark:text-white font-['Poppins',sans-serif] transition-colors">
              IdleAlert
            </span>
            <span className="w-2 h-2 rounded-full bg-[#3742fa] group-hover:scale-125 transition-transform" />
          </Link>

          {/* 2. Center: Glassmorphic Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 p-1 rounded-full bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-inner">
            {navLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'text-white font-semibold bg-[#273087] dark:bg-[#3742fa] shadow-md shadow-[#273087]/25 dark:shadow-[#3742fa]/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <span>{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white leading-none shadow-sm">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* 3. Right: Classroom Selector, SMS Pill, Theme Toggle & Primary Action Pill Button */}
          <div className="hidden md:flex items-center space-x-2.5">
            {/* Classroom Selector Glass Pill */}
            <div className="flex items-center bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 shadow-sm">
              <Building className="w-3.5 h-3.5 text-[#3742fa] mr-1.5 shrink-0" />
              {isEditingRoom ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    value={editRoomValue}
                    onChange={(e) => setEditRoomValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRoom()}
                    className="bg-white dark:bg-slate-800 border border-[#3742fa] rounded-md px-1.5 py-0.5 text-xs text-slate-900 dark:text-white w-24 outline-none font-medium"
                    autoFocus
                  />
                  <button onClick={handleSaveRoom} className="text-emerald-600 hover:text-emerald-700">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setIsEditingRoom(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEditRoomStart}
                  className="flex items-center space-x-1 font-medium hover:text-[#3742fa] transition-colors"
                  title="Click to change classroom"
                >
                  <span className="truncate max-w-[110px]">{classroomName || 'Main Lab'}</span>
                  <Edit2 className="w-3 h-3 text-slate-400 ml-1" />
                </button>
              )}
            </div>

            {/* SMS Mobile Number Glass Pill */}
            <button
              onClick={handleOpenSMSModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/80 hover:bg-white/90 dark:hover:bg-slate-850 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all shadow-sm cursor-pointer"
              title="Classroom Alert Directory & Numbers"
            >
              <Phone className="w-3.5 h-3.5 text-[#3742fa]" />
              <span className="font-mono text-[11px] font-semibold">{activePhone || user?.phone || '+919975004101'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold leading-none">
                {directory.length}
              </span>
            </button>

            {/* Theme Toggle Button (Light/Dark Mode Switcher) */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/70 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-amber-400 shadow-sm transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </motion.button>

            {/* Primary Action Button: Pill-shaped deep indigo/blue (Advapay Contact Us style) */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/live')}
              className="px-5 py-2 rounded-full bg-[#273087] dark:bg-[#3742fa] hover:bg-[#1e256b] dark:hover:bg-[#2e37e5] text-white text-xs font-semibold tracking-wide transition-all shadow-md shadow-[#273087]/25 flex items-center space-x-2 cursor-pointer group"
            >
              <Video className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Launch Live</span>
            </motion.button>

            {/* User Profile / Logout */}
            <div className="flex items-center space-x-1 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#273087] dark:bg-[#3742fa] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/70 dark:bg-slate-900 text-slate-700 dark:text-amber-400"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800 backdrop-blur-md"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-white/80 dark:border-slate-800 px-6 py-4 space-y-3 shadow-xl"
            >
              <div className="space-y-1">
                {navLinks.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#273087] dark:bg-[#3742fa] text-white font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <span>{item.name}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenSMSModal();
                  }}
                  className="w-full py-2 px-4 rounded-xl bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center justify-between border border-slate-200/80 dark:border-slate-700 shadow-sm"
                >
                  <span className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-[#3742fa]" />
                    <span>SMS Alert Number:</span>
                  </span>
                  <span className="font-mono">{user?.phone || '+919975004101'}</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/live');
                  }}
                  className="w-full py-2.5 rounded-full bg-[#273087] dark:bg-[#3742fa] text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-md shadow-[#273087]/25"
                >
                  <Video className="w-4 h-4" />
                  <span>Launch Live Surveillance</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Classroom Alert Directory & SMS Configuration Modal */}
      <AnimatePresence>
        {showSMSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowSMSModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Poppins',sans-serif]">
                    Classroom Alert Directory
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Linked mobile numbers receiving energy alerts for each classroom
                  </p>
                </div>
              </div>

              {/* Active Classroom Callout */}
              <div className="mb-5 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-slate-700 dark:text-slate-300">Active Classroom:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{classroomName || 'A101'}</span>
                </div>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-slate-500 dark:text-slate-400">SMS Alert to:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{activePhone || '+919975004101'}</span>
                </div>
              </div>

              {/* Directory List Table */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Configured Classrooms ({directory.length})
                  </span>
                  <button
                    onClick={() => setShowAddRoomForm(!showAddRoomForm)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddRoomForm ? 'Cancel' : 'Link New Classroom'}</span>
                  </button>
                </div>

                {/* Add New Classroom Inline Card */}
                <AnimatePresence>
                  {showAddRoomForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Add Classroom & Recipient Mobile
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          placeholder="Class ID (e.g. B204, Lab 102)"
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          value={newRoomPhone}
                          onChange={(e) => setNewRoomPhone(e.target.value)}
                          placeholder="Mobile Number (+91...)"
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">Type:</span>
                          <button
                            type="button"
                            onClick={() => setNewRoomSource('live')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              newRoomSource === 'live'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                          >
                            Live Feed
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewRoomSource('uploaded')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              newRoomSource === 'uploaded'
                                ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/40'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                          >
                            Uploaded Media
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddNewClassroomLink}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                          + Save Link
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Directory Items List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {directory.map((item) => {
                    const isActive = classroomName.toLowerCase() === item.classroom.toLowerCase();
                    const isEditing = editingRoomKey === item.classroom;

                    return (
                      <div
                        key={item.classroom}
                        className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          isActive
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                            : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Left: Room & Source Badge */}
                        <div className="flex items-center space-x-2.5">
                          <Building className="w-4 h-4 text-indigo-500 shrink-0" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {item.classroom}
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-600 text-white">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5">
                              {item.source === 'live' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Live Feed Class
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                                  <Film className="w-2.5 h-2.5" />
                                  Uploaded Video Class
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Phone Number with Inline Edit & Actions */}
                        <div className="flex items-center space-x-2 self-end sm:self-auto">
                          {isEditing ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={editingPhoneValue}
                                onChange={(e) => setEditingPhoneValue(e.target.value)}
                                className="bg-white dark:bg-slate-900 border border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white font-mono w-32 outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveDirectoryPhone(item.classroom)}
                                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                                title="Save phone"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingRoomKey(null)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                {item.phone}
                              </span>
                              <button
                                onClick={() => handleStartEditDirectoryPhone(item.classroom, item.phone)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                title="Edit phone number for this class"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {!isActive && (
                            <button
                              onClick={() => handleSelectActiveRoom(item.classroom, item.phone)}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-indigo-600 hover:text-white dark:bg-slate-700 dark:hover:bg-indigo-600 rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                              title="Set as active monitoring classroom"
                            >
                              Set Active
                            </button>
                          )}

                          {directory.length > 1 && (
                            <button
                              onClick={() => removeClassroom(item.classroom)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Delete classroom entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gateway Status & Real SMS Test Dispatch */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Gateway Service:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {smsProviderInfo?.provider || 'TextBee Gateway'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    SMS alerts will be dispatched directly to the mobile number assigned to the active classroom.
                  </p>
                </div>

                <button
                  onClick={handleTestSMS}
                  disabled={isSendingTest}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full text-xs font-semibold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isSendingTest ? 'Dispatching Test SMS...' : `Test SMS to Active (${activePhone})`}</span>
                </button>

                {testResult && (
                  <div
                    className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                      testResult.sent
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    <div className="font-bold mb-0.5">{testResult.sent ? '✓ SMS Dispatched' : 'Notice'}</div>
                    <div>{testResult.status}</div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowSMSModal(false)}
                  className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close Directory
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
