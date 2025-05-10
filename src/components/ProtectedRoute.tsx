// src/components/ProtectedRoute.tsx
import React from 'react'; // Import React sebagai value (diperlukan untuk JSX)
import type { ReactNode } from 'react'; // <-- Impor tipe ReactNode secara terpisah
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Impor hook useAuth

interface ProtectedRouteProps {
  children: ReactNode; // <-- Penggunaan tipe ReactNode
  allowedRoles?: string[]; // Prop opsional untuk cek role
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Tampilkan loading jika status autentikasi belum selesai dicek
  if (isLoading) {
    return <div>Loading authentication status...</div>; // Ganti dengan spinner jika mau
  }

  // Jika tidak terautentikasi, redirect ke halaman login
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to /login.');
    // `replace` digunakan agar halaman login tidak masuk history browser
    return <Navigate to="/login" replace />;
  }

  // (Opsional) Cek role jika 'allowedRoles' diberikan dan diperlukan
  if (allowedRoles && allowedRoles.length > 0 && user?.role) {
    if (!allowedRoles.includes(user.role)) {
       console.log(`ProtectedRoute: Role '${user.role}' is not in allowed roles [${allowedRoles.join(', ')}]. Redirecting.`);
       // Redirect ke halaman 'unauthorized' atau dashboard default
       // Anda mungkin perlu membuat halaman /unauthorized nanti
       // Untuk sekarang, kita bisa arahkan ke dashboard saja atau tampilkan pesan
       return <div>Error: Anda tidak memiliki izin yang cukup.</div>; // Contoh pesan error
       // return <Navigate to="/unauthorized" replace />; // Jika sudah ada halaman unauthorized
    }
  }

  // Jika semua pengecekan lolos, tampilkan halaman children yang diproteksi
  console.log('ProtectedRoute: Access granted.');
  return <>{children}</>; // Gunakan fragment <></> untuk membungkus children jika perlu
};

export default ProtectedRoute;