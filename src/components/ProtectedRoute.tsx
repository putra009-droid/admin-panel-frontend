// src/components/ProtectedRoute.tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; 
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // --- TAMBAHKAN CONSOLE LOG DI SINI ---
  console.log('[ProtectedRoute] Checking access...');
  console.log('[ProtectedRoute] isLoading:', isLoading);
  console.log('[ProtectedRoute] isAuthenticated:', isAuthenticated);
  console.log('[ProtectedRoute] User:', user);
  console.log('[ProtectedRoute] User Role:', user?.role);
  console.log('[ProtectedRoute] Allowed Roles:', allowedRoles);
  // --- AKHIR CONSOLE LOG ---

  if (isLoading) {
    console.log('[ProtectedRoute] Still loading auth status.');
    return <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memeriksa status autentikasi...</div>;
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to /login.');
    return <Navigate to="/login" replace />;
  }

  // Cek role jika 'allowedRoles' diberikan dan user memiliki role
  if (allowedRoles && allowedRoles.length > 0 && user?.role) {
    if (!allowedRoles.includes(user.role)) {
       console.warn(`[ProtectedRoute] Role mismatch! User role: '${user.role}', Allowed roles: [${allowedRoles.join(', ')}]. Redirecting to /dashboard (atau halaman unauthorized).`);
       // Pertimbangkan untuk redirect ke halaman "/unauthorized" jika ada,
       // atau tampilkan pesan akses ditolak di halaman saat ini.
       // Untuk sekarang, kita biarkan redirect ke dashboard, tapi ini mungkin perlu disesuaikan.
       return <Navigate to="/dashboard" replace />; 
    }
  }

  console.log('[ProtectedRoute] Access GRANTED.');
  return <>{children}</>;
};

export default ProtectedRoute;
