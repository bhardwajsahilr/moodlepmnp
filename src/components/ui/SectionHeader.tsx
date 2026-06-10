import React from 'react';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  helper?: string;
  color?: string;
  dividerColor?: string;
}

export function SectionHeader({ icon, title, helper, color = 'bg-primary-50', dividerColor = 'bg-primary-500' }: SectionHeaderProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`${color} w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {helper && <p className="text-xs text-gray-400">{helper}</p>}
        </div>
      </div>
      <div className={`h-px ${dividerColor} opacity-20 rounded-full`} />
    </div>
  );
}
