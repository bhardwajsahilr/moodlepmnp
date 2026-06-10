import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Shared pages
import { TrainingRegistrationPage } from './pages/shared/TrainingRegistrationPage';
import { TrainingsListPage } from './pages/shared/TrainingsListPage';
import { ReportsPage } from './pages/shared/ReportsPage';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ParticipantsPage } from './pages/admin/ParticipantsPage';
import { AddParticipantPage } from './pages/admin/AddParticipantPage';
import { MoodleSettingsPage } from './pages/admin/MoodleSettingsPage';
import { CourseMappingPage } from './pages/admin/CourseMappingPage';

// Participant pages
import { ParticipantDashboard } from './pages/participant/ParticipantDashboard';
import { ProfilePage } from './pages/participant/ProfilePage';

// Manager pages
import { TrainingManagerDashboard } from './pages/manager/TrainingManagerDashboard';
import { ManagerParticipantsPage } from './pages/manager/ManagerParticipantsPage';
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'training_manager') return <Navigate to="/manager" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/participants" element={<ProtectedRoute allowedRoles={['admin']}><ParticipantsPage role="admin" /></ProtectedRoute>} />
      <Route path="/admin/participants/add" element={<ProtectedRoute allowedRoles={['admin']}><AddParticipantPage role="admin" /></ProtectedRoute>} />
      <Route path="/admin/training-registration" element={<ProtectedRoute allowedRoles={['admin']}><TrainingRegistrationPage role="admin" backTo="/admin/trainings" /></ProtectedRoute>} />
      <Route path="/admin/trainings" element={<ProtectedRoute allowedRoles={['admin']}><TrainingsListPage role="admin" /></ProtectedRoute>} />
      <Route path="/admin/course-mapping" element={<ProtectedRoute allowedRoles={['admin']}><CourseMappingPage /></ProtectedRoute>} />
      <Route path="/admin/moodle-settings" element={<ProtectedRoute allowedRoles={['admin']}><MoodleSettingsPage /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><ReportsPage role="admin" /></ProtectedRoute>} />

      {/* Training Manager */}
      <Route path="/manager" element={<ProtectedRoute allowedRoles={['training_manager']}><TrainingManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/training-registration" element={<ProtectedRoute allowedRoles={['training_manager']}><TrainingRegistrationPage role="training_manager" backTo="/manager/trainings" /></ProtectedRoute>} />
      <Route path="/manager/trainings" element={<ProtectedRoute allowedRoles={['training_manager']}><TrainingsListPage role="training_manager" /></ProtectedRoute>} />
      <Route path="/manager/participants" element={<ProtectedRoute allowedRoles={['training_manager']}><ManagerParticipantsPage /></ProtectedRoute>} />
      <Route path="/manager/participants/add" element={<ProtectedRoute allowedRoles={['training_manager']}><AddParticipantPage role="training_manager" /></ProtectedRoute>} />
      <Route path="/manager/reports" element={<ProtectedRoute allowedRoles={['training_manager']}><ReportsPage role="training_manager" /></ProtectedRoute>} />

      {/* Participant */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['participant']}><ParticipantDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/trainings" element={<ProtectedRoute allowedRoles={['participant']}><ParticipantDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/courses" element={<ProtectedRoute allowedRoles={['participant']}><ParticipantDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/profile" element={<ProtectedRoute allowedRoles={['participant']}><ProfilePage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
