// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Impor komponen halaman Anda
import LoginPage from './components/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import AllowanceTypesPage from './pages/AllowanceTypesPage';
import DeductionTypesPage from './pages/DeductionTypesPage';
import UserAllowancesPage from './pages/UserAllowancesPage';
import UserDeductionsPage from './pages/UserDeductionsPage';
import LeaveRequestApprovalPage from './pages/LeaveRequestApprovalPage';
import AttendanceControlPage from './pages/AttendanceControlPage'; // <-- Impor halaman baru

// Impor komponen untuk proteksi rute dan context autentikasi
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
     return <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif', fontSize: '18px' }}>Memuat Aplikasi Admin...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={ <ProtectedRoute> <DashboardPage /> </ProtectedRoute> } />
      <Route path="/users" element={ <ProtectedRoute> <UserManagementPage /> </ProtectedRoute> } />
      <Route path="/allowance-types" element={ <ProtectedRoute> <AllowanceTypesPage /> </ProtectedRoute> } />
      <Route path="/deduction-types" element={ <ProtectedRoute> <DeductionTypesPage /> </ProtectedRoute> } />
      
      <Route
        path="/users/:userId/allowances" 
        element={ <ProtectedRoute> <UserAllowancesPage /> </ProtectedRoute> }
      />
      <Route
        path="/users/:userId/deductions"
        element={ <ProtectedRoute> <UserDeductionsPage /> </ProtectedRoute> }
      />
      <Route
        path="/leave-requests-approval"
        element={
          <ProtectedRoute allowedRoles={['YAYASAN', 'SUPER_ADMIN']}> 
            <LeaveRequestApprovalPage />
          </ProtectedRoute>
        }
      />

      {/* RUTE BARU UNTUK KONTROL ABSENSI (Diproteksi) */}
      <Route
        path="/attendances-control" // <-- Path URL baru, misal /attendances-control
        element={
          // Sesuaikan allowedRoles jika perlu, misalnya hanya SUPER_ADMIN dan ADMIN
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'YAYASAN']}> 
            <AttendanceControlPage />
          </ProtectedRoute>
        }
      />
      
      {/* TODO: Tambahkan rute untuk halaman admin lain di sini nanti
        Contoh:
        <Route
          path="/payroll-runs"
          element={
            <ProtectedRoute>
              <PayrollRunsPage /> // Buat komponen ini nanti
            </ProtectedRoute>
          }
        />
      */}

      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>404 - Halaman Tidak Ditemukan</div>} />
    </Routes>
  );
}

export default App;
