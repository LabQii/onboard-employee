'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, WarningCircle } from '@phosphor-icons/react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error';
  duration?: number;
}

export default function Toast({ message, isVisible, onClose, type = 'success', duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  const isError = type === 'error';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="fixed top-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto sm:min-w-[320px] z-[9999] bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-[#E8EFF4] overflow-hidden"
        >
          <div className="flex items-center gap-4 p-5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isError ? 'bg-red-50' : 'bg-emerald-50'}`}>
              {isError ? (
                <WarningCircle weight="fill" className="w-6 h-6 text-red-500" />
              ) : (
                <CheckCircle weight="fill" className="w-6 h-6 text-emerald-500" />
              )}
            </div>

            <div className="flex-1">
              <p className="text-[14px] font-bold text-[#1E3A5F] tracking-tight leading-tight">
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#9AADB8] hover:text-[#1E3A5F] hover:bg-[#F8FAFC] rounded-lg transition-all"
            >
              <X weight="bold" className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className={`absolute bottom-0 left-0 h-1 w-full ${isError ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: 0 }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className={`h-full ${isError ? 'bg-red-500' : 'bg-emerald-500'}`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
