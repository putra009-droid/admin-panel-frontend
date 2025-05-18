// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

// Konteks Autentikasi
import { useAuth } from './context/AuthContext'; // Pastikan path ini benar

// Komponen Layout dan Proteksi
import ProtectedRoute from './components/ProtectedRoute'; // Pastikan path ini benar
import AdminLayout from './components/layouts/AdminLayout'; // Path yang seharusnya sudah benar sekarang

// Halaman-Halaman Aplikasi
import LoginPage from './components/LoginPage'; // Asumsi LoginPage ada di components
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import AllowanceTypesPage from './pages/AllowanceTypesPage';
import DeductionTypesPage from './pages/DeductionTypesPage';
import UserAllowancesPage from './pages/UserAllowancesPage';
import UserDeductionsPage from './pages/UserDeductionsPage';
import LeaveRequestApprovalPage from './pages/LeaveRequestApprovalPage';
import AttendanceControlPage from './pages/AttendanceControlPage';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-700 p-5">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-600 mb-8"></div>
        <h1 className="text-3xl font-semibold mb-3">Memuat Aplikasi Admin...</h1>
        <p className="text-slate-500 text-lg">Mohon tunggu sebentar, kami sedang menyiapkan semuanya.</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/allowance-types" element={<AllowanceTypesPage />} />
        <Route path="/deduction-types" element={<DeductionTypesPage />} />
        <Route path="/users/:userId/allowances" element={<UserAllowancesPage />} />
        <Route path="/users/:userId/deductions" element={<UserDeductionsPage />} />
        <Route
          path="/leave-requests-approval"
          element={
            <ProtectedRoute allowedRoles={['YAYASAN', 'SUPER_ADMIN']}>
              <LeaveRequestApprovalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendances-control"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'YAYASAN']}>
              <AttendanceControlPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="*"
        element={
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-700 p-5 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-red-500 mb-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h1 className="text-5xl font-bold text-red-600 mb-4">404</h1>
            <h2 className="text-3xl font-semibold mb-4">Halaman Tidak Ditemukan</h2>
            <p className="text-slate-500 text-lg mb-8">
              Maaf, halaman yang Anda minta tidak dapat ditemukan. Mungkin URL salah ketik atau halaman telah dipindahkan.
            </p>
            <a
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="px-8 py-3 bg-sky-600 text-white text-lg font-semibold rounded-lg hover:bg-sky-700 transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
            >
              Kembali ke {isAuthenticated ? "Dashboard" : "Halaman Login"}
            </a>
          </div>
        }
      />
    </Routes>
  );
}

export default App;