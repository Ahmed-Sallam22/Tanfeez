import React from 'react';
import { cn } from '../../utils/cn';

export interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {children}
    </div>
  );
}
