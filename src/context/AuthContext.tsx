// src/context/AuthContext.tsx
// 'React' dari impor default tidak digunakan secara eksplisit, jadi kita hapus dari impor utama.
// Hook seperti createContext, useState, useContext, useEffect sudah cukup.
import { createContext, useState, useContext, useEffect } from 'react'; 
import type { ReactNode } from 'react'; // Impor ReactNode sebagai tipe

// Tipe data untuk user (sesuaikan jika perlu, cocokkan dengan data yg dikirim API login)
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log("AuthProvider: Initializing auth state...");
    try {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
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
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
      console.log("AuthProvider: Initialization complete.");
    }
  }, []);

  const login = (userData: User, tokens: { accessToken: string; refreshToken: string }) => {
    console.log(`AuthProvider: Logging in user: ${userData.email}`);
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setAccessToken(tokens.accessToken);
    setUser(userData);
    setIsAuthenticated(true);
    console.log('AuthProvider: User logged in, auth state updated.');
  };

  const logout = () => {
    console.log(`AuthProvider: Logging out user: ${user?.email}`);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log('AuthProvider: User logged out, auth state cleared.');
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    accessToken,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!isLoading ? children : <div>Loading Application Auth...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
