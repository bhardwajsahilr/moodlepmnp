import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, Settings, BarChart2,
  LogOut, ChevronRight, Menu, X, GraduationCap, BookMarked,
  ClipboardList, User, Link2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/admin/participants', label: 'Participants', icon: <Users className="w-4 h-4" /> },
  { to: '/admin/training-registration', label: 'Training Registration', icon: <ClipboardList className="w-4 h-4" /> },
  { to: '/admin/trainings', label: 'Trainings', icon: <BookOpen className="w-4 h-4" /> },
  { to: '/admin/course-mapping', label: 'Course Mapping', icon: <Link2 className="w-4 h-4" /> },
  { to: '/admin/moodle-settings', label: 'Moodle Settings', icon: <Settings className="w-4 h-4" /> },
  { to: '/admin/reports', label: 'Reports', icon: <BarChart2 className="w-4 h-4" /> },
];

const managerNav: NavItem[] = [
  { to: '/manager', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/manager/training-registration', label: 'Training Registration', icon: <ClipboardList className="w-4 h-4" /> },
  { to: '/manager/trainings', label: 'Trainings', icon: <BookOpen className="w-4 h-4" /> },
  { to: '/manager/participants', label: 'Participants', icon: <Users className="w-4 h-4" /> },
  { to: '/manager/reports', label: 'Reports', icon: <BarChart2 className="w-4 h-4" /> },
];

const participantNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/dashboard/trainings', label: 'My Trainings', icon: <BookMarked className="w-4 h-4" /> },
  { to: '/dashboard/courses', label: 'My Moodle Courses', icon: <GraduationCap className="w-4 h-4" /> },
  { to: '/dashboard/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
        <GraduationCap className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-900 leading-tight">PMNP</p>
        <p className="text-[10px] text-gray-400 truncate">Capacity Building Portal</p>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  navItems: NavItem[];
  onClose?: () => void;
}

function SidebarContent({ navItems, onClose }: SidebarContentProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      <Logo />
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin' || item.to === '/manager' || item.to === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
                isActive
                  ? 'bg-primary-50 text-primary font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-primary' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-primary/50" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{user?.full_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'U'}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user?.full_name || user?.email}</p>
            <p className="text-[10px] text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

interface SidebarProps {
  role: 'admin' | 'training_manager' | 'participant';
}

export function Sidebar({ role }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = role === 'admin' ? adminNav : role === 'training_manager' ? managerNav : participantNav;

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-lg shadow-md border border-gray-100"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50 lg:hidden"
            >
              <button
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100"
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
              <SidebarContent navItems={navItems} onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 fixed top-0 left-0 bottom-0">
        <SidebarContent navItems={navItems} />
      </aside>
    </>
  );
}
