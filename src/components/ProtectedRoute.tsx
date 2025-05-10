// src/components/ProtectedRoute.tsx
// 'import React from 'react';' Dihapus karena React tidak digunakan secara eksplisit selain untuk JSX
import type { ReactNode } from 'react'; // Impor tipe ReactNode secara terpisah
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Impor hook useAuth

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; 
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memeriksa status autentikasi...</div>;
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to /login.');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user?.role) {
    if (!allowedRoles.includes(user.role)) {
       console.log(`ProtectedRoute: Role '${user.role}' is not in allowed roles [${allowedRoles.join(', ')}]. Redirecting.`);
       return <Navigate to="/dashboard" replace />; // Atau ke halaman /unauthorized
    }
  }

  console.log('ProtectedRoute: Access granted.');
  return <>{children}</>; // Menggunakan Fragment jika children adalah satu elemen JSX
};

export default ProtectedRoute;
