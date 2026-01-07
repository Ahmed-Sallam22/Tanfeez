import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** عناصر اختيارية تظهر داخل الحقل */
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  className,
  placeholder,
  id,
  leftElement,
  rightElement,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // أضف padding تلقائي عند وجود عناصر داخلية
  const paddingX = cn(
    leftElement ? 'pl-10' : '',
    rightElement ? 'pr-10' : ''
  );

  return (
    <div className="space-y-3">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-[#282828]"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftElement && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            {leftElement}
          </span>
        )}

        <input
          id={inputId}
          placeholder={placeholder}
          className={cn(
            'block w-full rounded-md border border-gray-300 px-3 py-4 text-sm placeholder-gray-400 focus:border-[#4E8476] focus:outline-none focus:ring-1 focus:ring-[#4E8476]',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            paddingX,
            className
          )}
          {...props}
        />

        {rightElement && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </span>
        )}
      </div>

      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
