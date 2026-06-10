import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { motion } from 'framer-motion';
import type { UserRole } from '../../types';

interface DashboardLayoutProps {
  role: UserRole;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function DashboardLayout({ role, title, subtitle, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar role={role} />
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <Topbar title={title} subtitle={subtitle} />
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 p-5 sm:p-6 space-y-5"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
