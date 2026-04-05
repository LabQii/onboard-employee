'use client';

import React from 'react';
import { Icon } from '@phosphor-icons/react';

interface AdminPageHeaderProps {
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    icon: Icon;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    icon: Icon;
    onClick?: () => void;
  };
  children?: React.ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  primaryAction,
  secondaryAction,
  children
}: AdminPageHeaderProps) {
  return (
    <div className="relative bg-app-soft px-10 pt-10 pb-20 overflow-hidden shrink-0">
      {/* Decorative background element consistent with Dashboard */}
      <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-app-bg rounded-full blur-3xl opacity-50 pointer-events-none" />
      
      <div className="relative z-10 max-w-[1200px] mx-auto w-full flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="max-w-xl text-left">
          <h1 className="text-[2.2rem] font-bold text-tertiary mb-3 tracking-tight">{title}</h1>
          <p className="text-neutral-dark leading-relaxed font-medium text-[15px]">
            {description}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {secondaryAction && (
            <button 
              onClick={secondaryAction.onClick}
              className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-white border border-neutral/20 rounded-xl text-[13.5px] font-bold text-tertiary hover:bg-neutral/5 transition-all shadow-soft"
            >
              <secondaryAction.icon weight="duotone" className="w-5 h-5" />
              {secondaryAction.label}
            </button>
          )}
          
          {primaryAction && (
            <button 
              onClick={primaryAction.onClick}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[13.5px] font-bold shadow-premium hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              <primaryAction.icon weight="duotone" className="w-5 h-5" />
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>

      {children && (
        <div className="max-w-[1200px] mx-auto w-full mt-8 relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
