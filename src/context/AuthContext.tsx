// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react'; // <-- Impor nilai/fungsi
import type { ReactNode } from 'react'; // <-- Impor HANYA TIPE ReactNode secara terpisah

// Tipe data untuk user (sesuaikan jika perlu, cocokkan dengan data yg dikirim API login)
interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Sesuaikan tipe Role dari Prisma jika perlu import enum Role
}

// Tipe data untuk context
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  login: (userData: User, tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  isLoading: boolean; // State loading untuk inisialisasi awal
}

// Buat Context dengan nilai default undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Buat Provider Komponen
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // State isLoading penting agar aplikasi tidak "kedip" saat cek localStorage pertama kali
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // useEffect untuk membaca state dari localStorage saat aplikasi pertama kali dimuat
  useEffect(() => {
    console.log("AuthProvider: Initializing auth state...");
    try {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        // Validasi sederhana (idealnnyaa verifikasi token, tapi untuk awal cukup cek ada)
        const parsedUser: User = JSON.parse(storedUser);
        // Pastikan hasil parse adalah objek dengan properti yg diharapkan
        if (parsedUser && typeof parsedUser === 'object' && parsedUser.id) {
            setUser(parsedUser);
            setAccessToken(storedToken);
            setIsAuthenticated(true);
            console.log('AuthProvider: Auth state initialized from localStorage for user:', parsedUser.email);
        } else {
             console.warn('AuthProvider: Invalid user data found in localStorage. Clearing.');
             localStorage.removeItem('accessToken');
             localStorage.removeItem('refreshToken');
             localStorage.removeItem('user');
        }
      } else {
        console.log('AuthProvider: No valid auth state found in localStorage.');
      }
    } catch (error) {
      console.error("AuthProvider: Error parsing auth data from localStorage", error);
      // Jika error parsing, hapus data yg mungkin korup
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } finally {
      // Tandai loading selesai setelah selesai cek localStorage
      setIsLoading(false);
      console.log("AuthProvider: Initialization complete.");
    }
  }, []); // Array dependency kosong [] memastikan ini hanya berjalan sekali saat komponen mount

  // Fungsi untuk menangani login
  const login = (userData: User, tokens: { accessToken: string; refreshToken: string }) => {
    console.log(`AuthProvider: Logging in user: ${userData.email}`);
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(userData)); // Simpan user data sebagai string
    setAccessToken(tokens.accessToken);
    setUser(userData);
    setIsAuthenticated(true);
    console.log('AuthProvider: User logged in, auth state updated.');
  };

  // Fungsi untuk menangani logout
  const logout = () => {
    console.log(`AuthProvider: Logging out user: ${user?.email}`);
    // TODO: Panggil API /api/logout untuk revoke refresh token di backend jika perlu
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log('AuthProvider: User logged out, auth state cleared.');
  };

  // Nilai yang akan disediakan oleh context
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    accessToken,
    login,
    logout,
    isLoading // Sertakan isLoading dalam value
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* Jangan render children jika state autentikasi masih loading */}
      {/* Ini mencegah halaman terproteksi ditampilkan sesaat sebelum redirect */}
      {!isLoading ? children : <div>Loading Application...</div>}
    </AuthContext.Provider>
  );
};

// Buat custom hook untuk mempermudah penggunaan context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Error ini akan muncul jika useAuth() dipanggil di luar AuthProvider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};