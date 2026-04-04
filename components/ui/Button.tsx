import React from 'react';
import { cn } from '@/lib/utils'; // We'll create this standard util

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-2xl font-bold transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          {
            // Variants
            'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5': variant === 'primary',
            'bg-secondary text-white shadow-lg shadow-secondary/20 hover:-translate-y-0.5': variant === 'secondary',
            'border-2 border-neutral/10 text-tertiary bg-white hover:bg-neutral/5': variant === 'outline',
            'hover:bg-black/5 text-neutral-dark': variant === 'ghost',
            'bg-app-soft text-primary hover:bg-primary/10 shadow-soft': variant === 'soft',
            'bg-[#FFEAC5] text-[#A67B5B] hover:bg-[#FCD8A2] shadow-soft': variant === 'accent',
            // Sizes
            'h-10 px-5 text-[13px]': size === 'sm',
            'h-12 px-8 text-[14px]': size === 'md',
            'h-14 px-10 text-base': size === 'lg',
            // Utilities
            'w-full': fullWidth,
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
