// src/components/LoginPage.tsx
import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Ambil URL API dari environment variable Vite
// Vercel akan mengisi nilai ini dari Environment Variables yang Anda setel di dashboard Vercel
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validasi apakah API_BASE_URL sudah ada
    if (!API_BASE_URL) {
        const errMsg = "Konfigurasi VITE_API_BASE_URL tidak ditemukan. Cek pengaturan Environment Variable di Vercel.";
        console.error(errMsg);
        setError(errMsg);
        setIsLoading(false);
        return;
    }

    const loginUrl = `${API_BASE_URL}/login`; // Bentuk URL lengkap
    console.log(`Mencoba login dengan email: ${email}`);
    console.log(`Memanggil API endpoint: ${loginUrl}`);

    try {
      const response = await fetch(loginUrl, { // Gunakan URL lengkap
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json(); // Ini akan error jika responsnya HTML
      if (!response.ok) {
        throw new Error(data.error || data.message || `Gagal login. Status: ${response.status}`);
      }

      console.log('Login Berhasil! Respons:', data);
      setError(null);
      if (data.accessToken && data.refreshToken && data.user) {
        login(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
        navigate('/dashboard');
      } else {
        throw new Error('Respons login tidak lengkap dari server.');
      }
    } catch (err: unknown) {
       console.error('Login Gagal:', err);
       const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.';
       setError(`Login Gagal: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Admin Panel Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.inputGroup}>
          <label htmlFor="email" style={styles.label}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="password" style={styles.label}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            style={styles.input}
          />
        </div>
        {error && <p style={styles.errorText}>{error}</p>}
        <button type="submit" disabled={isLoading} style={styles.button}>
          {isLoading ? 'Memproses...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

// Styling (tetap sama)
const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: '400px', margin: '60px auto', padding: '30px', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', fontFamily: 'sans-serif'},
  title: { textAlign: 'center', marginBottom: '25px', color: '#333' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold' },
  input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', border: 'none', borderRadius: '4px', backgroundColor: '#007bff', color: 'white', fontSize: '16px', cursor: 'pointer', opacity: 1 },
  errorText: { color: 'red', fontSize: '14px', marginTop: '-10px', marginBottom: '15px' },
};

export default LoginPage;
