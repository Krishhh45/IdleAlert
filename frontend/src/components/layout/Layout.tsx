import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FE] dark:bg-[#070D1F] text-slate-800 dark:text-slate-100 flex flex-col relative overflow-x-clip selection:bg-[#3742fa] selection:text-white font-['Source_Sans_3',sans-serif] transition-colors duration-300">
      {/* 
        Ethereal Living Ambient Glow Spheres (Advapay UI Visual Aesthetic)
        Smooth organic floating animations 
      */}
      <motion.div 
        animate={{
          x: [0, 20, -10, 0],
          y: [0, -25, 10, 0],
          scale: [1, 1.06, 0.96, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-24 -left-48 w-[580px] h-[580px] rounded-full bg-[#3742fa]/25 blur-[120px] pointer-events-none -z-0" 
        aria-hidden="true" 
      />

      <motion.div 
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 20, -15, 0],
          scale: [1, 0.94, 1.08, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[40%] -right-36 w-[480px] h-[480px] rounded-full bg-[#4338ca]/20 blur-[130px] pointer-events-none -z-0" 
        aria-hidden="true" 
      />

      <motion.div 
        animate={{
          x: [0, 15, -20, 0],
          y: [0, -15, 20, 0],
          scale: [1, 1.05, 0.98, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-20 left-[25%] w-[420px] h-[420px] rounded-full bg-[#3742fa]/10 blur-[120px] pointer-events-none -z-0" 
        aria-hidden="true" 
      />

      {/* Modern Top Horizontal Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Sleek Glassmorphic Footer */}
      <Footer />
    </div>
  );
};
