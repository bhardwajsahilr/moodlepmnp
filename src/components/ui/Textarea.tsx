import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export function Textarea({ label, helper, error, className = '', id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-gray-600">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={3}
        className={`w-full px-3 py-2.5 rounded-lg border text-sm bg-white transition-colors duration-150 resize-y
          ${error
            ? 'border-red-300 bg-red-50/30 focus:ring-red-200 focus:border-red-400'
            : 'border-gray-200 focus:ring-secondary/30 focus:border-secondary'
          }
          focus:outline-none focus:ring-2
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && helper && <p className="text-xs text-gray-400">{helper}</p>}
    </div>
  );
}
