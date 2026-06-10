import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, helper, error, leftIcon, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-gray-600">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</div>
        )}
        <input
          id={inputId}
          className={`w-full px-3 py-2.5 rounded-lg border text-sm bg-white transition-colors duration-150
            ${leftIcon ? 'pl-9' : ''}
            ${error
              ? 'border-red-300 bg-red-50/30 focus:ring-red-200 focus:border-red-400'
              : 'border-gray-200 focus:ring-secondary/30 focus:border-secondary'
            }
            focus:outline-none focus:ring-2
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && helper && <p className="text-xs text-gray-400">{helper}</p>}
    </div>
  );
}
