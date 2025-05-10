// src/pages/DashboardPage.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext'; // Impor hook untuk autentikasi
import { useNavigate, Link } from 'react-router-dom'; // Impor Link untuk navigasi

function DashboardPage() {
  const { user, logout } = useAuth(); // Ambil data user dan fungsi logout dari context
  const navigate = useNavigate(); // Hook untuk melakukan navigasi programatik

  // Fungsi untuk menangani logout
  const handleLogout = () => {
    logout(); // Panggil fungsi logout dari AuthContext
    navigate('/login'); // Arahkan pengguna kembali ke halaman login
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Selamat Datang di Dashboard Admin!</h1>
      {/* Tampilkan informasi pengguna jika ada */}
      {user && (
        <p>
          Anda login sebagai: <strong>{user.name}</strong> ({user.email}) - Role: <strong>{user.role}</strong>
        </p>
      )}
      <p>Ini adalah halaman admin utama Anda. Dari sini Anda dapat mengelola berbagai aspek aplikasi.</p>
      
      <hr style={{ margin: '20px 0' }} /> {/* Garis pemisah */}

      {/* Menu Navigasi Admin */}
      <h3>Menu Navigasi</h3>
      <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
        <li style={{ marginBottom: '10px' }}>
          <Link to="/users" style={styles.navLink}>
            Kelola Pengguna
          </Link>
        </li>
        <li style={{ marginBottom: '10px' }}>
          <Link to="/allowance-types" style={styles.navLink}>
            Kelola Tipe Tunjangan
          </Link>
        </li>
        <li style={{ marginBottom: '10px' }}>
          <Link to="/deduction-types" style={styles.navLink}>
            Kelola Tipe Potongan
          </Link>
        </li>
        <li style={{ marginBottom: '10px' }}>
          <Link to="/leave-requests-approval" style={styles.navLink}>
            Approval Pengajuan Izin
          </Link>
        </li>
        <li style={{ marginBottom: '10px' }}>
          <Link to="/attendances-control" style={styles.navLink}>
            Kontrol Absensi Karyawan
          </Link>
        </li>
        {/* TODO: Tambahkan link ke halaman admin lain di sini nanti
          Contoh:
          <li style={{ marginBottom: '10px' }}>
            <Link to="/payroll-runs" style={styles.navLink}>Kelola Penggajian</Link>
          </li>
        */}
      </ul>
      
      <hr style={{ margin: '20px 0' }} /> {/* Garis pemisah */}

      {/* Tombol Logout */}
      <button 
        onClick={handleLogout} 
        style={styles.logoutButton}
      >
        Logout
      </button>
    </div>
  );
}

// Contoh styling inline (bisa dipindah ke file CSS atau pakai library UI)
const styles: { [key: string]: React.CSSProperties } = {
  navLink: {
    textDecoration: 'none',
    color: '#007bff',
    padding: '8px 12px',
    border: '1px solid #007bff',
    borderRadius: '4px',
    display: 'inline-block',
    transition: 'background-color 0.2s, color 0.2s',
  },
  // navLinkHover: { // Untuk hover, lebih baik pakai CSS class atau library
  //   backgroundColor: '#007bff',
  //   color: 'white',
  // },
  logoutButton: {
    padding: '10px 18px',
    cursor: 'pointer',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '15px',
  }
};

export default DashboardPage;
