import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { AdminCandidatePage } from '../pages/admin/AdminCandidatePage';
import { JobRequirementsPage as AdminRequirementsPage } from '../pages/hr/JobRequirementsPage';
import { AdminAssignmentsPage } from '../pages/admin/AdminAssignmentsPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { ActivityLogsPage } from '../pages/admin/ActivityLogsPage';
import { SettingsPage } from '../pages/admin/SettingsPage';

// HR Pages
import { HRDashboardPage } from '../pages/hr/HRDashboardPage';
import { CandidateDatabasePage } from '../pages/hr/CandidateDatabasePage';
import { CandidateDetailsPage } from '../pages/hr/CandidateDetailsPage';
import { JobRequirementsPage } from '../pages/hr/JobRequirementsPage';
import { ManagerAssignmentPage } from '../pages/hr/ManagerAssignmentPage';
import { AssignmentHistoryPage } from '../pages/hr/AssignmentHistoryPage';

// Manager Pages
import { ManagerCandidatesPage } from '../pages/manager/ManagerCandidatesPage';
import { CandidateEvaluationPage } from '../pages/manager/CandidateEvaluationPage';
import { EvaluationHistoryPage } from '../pages/manager/EvaluationHistoryPage';

// Shared Pages
import { NotificationsPage } from '../pages/shared/NotificationsPage';
import { NotFoundPage } from '../pages/shared/NotFoundPage';

// Route Guard Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-xs text-slate-400">
        Authenticating TalentFlow Session...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to permitted role dashboard
    if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'HR') return <Navigate to="/hr/dashboard" replace />;
    if (user.role === 'Manager') return <Navigate to="/manager/candidates" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Root index redirector based on authenticated user role
const RootRedirector: React.FC = () => {
  const { user, token, loading } = useAuth();

  if (loading) return null;
  if (!token || !user) return <Navigate to="/login" replace />;

  if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'HR') return <Navigate to="/hr/dashboard" replace />;
  if (user.role === 'Manager') return <Navigate to="/manager/candidates" replace />;

  return <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirector />} />

      {/* Protected Dashboard Layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/candidates"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminCandidatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requirements"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminRequirementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assignments"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminAssignmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activity-logs"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ActivityLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* HR Routes - Exactly 4 Sections */}
        <Route
          path="/hr/dashboard"
          element={
            <ProtectedRoute allowedRoles={['HR', 'Admin']}>
              <HRDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/candidates"
          element={
            <ProtectedRoute allowedRoles={['HR', 'Admin']}>
              <CandidateDatabasePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/candidates/:id"
          element={
            <ProtectedRoute allowedRoles={['HR', 'Admin']}>
              <CandidateDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/assignment"
          element={
            <ProtectedRoute allowedRoles={['HR', 'Admin']}>
              <ManagerAssignmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/assignment-history"
          element={
            <ProtectedRoute allowedRoles={['HR', 'Admin']}>
              <AssignmentHistoryPage />
            </ProtectedRoute>
          }
        />

        {/* HR Route Redirects for Legacy / Alternative URLs */}
        <Route path="/hr/assign" element={<Navigate to="/hr/assignment" replace />} />
        <Route path="/hr/assignments" element={<Navigate to="/hr/assignment-history" replace />} />
        <Route path="/hr/upload" element={<Navigate to="/hr/candidates" replace />} />
        <Route path="/hr/upload-history" element={<Navigate to="/hr/candidates" replace />} />
        <Route path="/hr/screening" element={<Navigate to="/hr/candidates" replace />} />
        <Route path="/hr/matching" element={<Navigate to="/hr/candidates" replace />} />
        <Route path="/hr/reports" element={<Navigate to="/hr/dashboard" replace />} />
        <Route
          path="/hr/requirements"
          element={
            <ProtectedRoute allowedRoles={['HR', 'Admin']}>
              <JobRequirementsPage />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes - Exactly 2 Sections */}
        <Route
          path="/manager/candidates"
          element={
            <ProtectedRoute allowedRoles={['Manager']}>
              <ManagerCandidatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/candidates/:candidateId/evaluate"
          element={
            <ProtectedRoute allowedRoles={['Manager']}>
              <CandidateEvaluationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/evaluation-history"
          element={
            <ProtectedRoute allowedRoles={['Manager']}>
              <EvaluationHistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Manager Route Redirects */}
        <Route path="/manager/dashboard" element={<Navigate to="/manager/candidates" replace />} />
        <Route path="/manager/interviews" element={<Navigate to="/manager/candidates" replace />} />
        <Route path="/manager/reports" element={<Navigate to="/manager/evaluation-history" replace />} />

        {/* Shared Notifications */}
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

