import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { CreateAccountPage } from './pages/CreateAccountPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

import { DashboardPage } from './pages/DashboardPage';
import { SuppliersListPage } from './pages/SuppliersListPage';
import { SupplierDetailsPage } from './pages/SupplierDetailsPage';
import { SupplierFormPage } from './pages/SupplierFormPage';
import { CompliancePage } from './pages/CompliancePage';
import { RiskManagementPage } from './pages/RiskManagementPage';
import { PerformancePage } from './pages/PerformancePage';
import { AuditHistoryPage } from './pages/AuditHistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersManagementPage } from './pages/UsersManagementPage';

import './App.css';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<CreateAccountPage />} />
            <Route path="/create-account" element={<Navigate to="/register" replace />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Enterprise Routes with AppLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/suppliers" element={<SuppliersListPage />} />
              <Route path="/suppliers/new" element={<SupplierFormPage />} />
              <Route path="/suppliers/:id" element={<SupplierDetailsPage />} />
              <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />
              <Route path="/compliance" element={<CompliancePage />} />
              <Route path="/risk" element={<RiskManagementPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/audit" element={<AuditHistoryPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/users" element={<UsersManagementPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
