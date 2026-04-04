import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'soft' | 'outline';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        'rounded-3xl p-8 transition-all duration-300',
        {
          'bg-white shadow-premium': variant === 'default',
          'bg-app-soft shadow-soft': variant === 'soft',
          'bg-transparent border border-neutral/10 shadow-none': variant === 'outline',
        },
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-xl font-bold font-sans text-tertiary', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}
