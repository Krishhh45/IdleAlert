import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'primary' | 'danger' | 'warning' | 'success' | 'none';
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = 'none',
  onClick,
  hoverable = false
}) => {
  const glowStyles = {
    primary: 'shadow-glow-primary border-primary-500/30',
    danger: 'shadow-glow-danger border-rose-500/30',
    warning: 'shadow-glow-warning border-amber-500/30',
    success: 'shadow-glow-success border-emerald-500/30',
    none: 'border-slate-800/80 shadow-lg shadow-black/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={hoverable ? { y: -2, transition: { duration: 0.15 } } : undefined}
      onClick={onClick}
      className={`bg-slate-900/80 backdrop-blur-md rounded-2xl border p-5 transition-all ${glowStyles[glow]} ${
        hoverable ? 'cursor-pointer hover:border-slate-700' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
};
