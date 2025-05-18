// src/pages/DashboardPage.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext'; // Pastikan path ini benar
import { useNavigate, Link } from 'react-router-dom';

// Contoh Komponen Card Statistik Sederhana (bisa dipindah ke file terpisah jika sering digunakan)
interface StatCardProps {
  title: string;
  description?: string;
  linkTo: string; // Link wajib untuk kartu navigasi ini
  bgColorClass?: string; // Contoh: 'bg-sky-100'
  textColorClass?: string; // Contoh: 'text-sky-700'
  borderColorClass?: string; // Contoh: 'border-sky-500'
  icon?: React.ReactNode; // Opsional jika ingin menambahkan ikon
}

const NavStatCard: React.FC<StatCardProps> = ({
  title,
  description,
  linkTo,
  bgColorClass = 'bg-white hover:bg-slate-50',
  textColorClass = 'text-slate-700',
  borderColorClass = 'border-transparent hover:border-sky-500',
  icon
}) => {
  return (
    <Link
      to={linkTo}
      className={`block p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.03] border-2 ${borderColorClass} ${bgColorClass}`}
    >
      <div className="flex items-center mb-3">
        {icon && <div className={`mr-3 text-2xl ${textColorClass}`}>{icon}</div>}
        <h3 className={`text-xl font-semibold ${textColorClass}`}>{title}</h3>
      </div>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </Link>
  );
};


function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminMenuItems = [
    { to: "/users", label: "Kelola Pengguna", description: "Tambah, edit, dan hapus data pengguna." },
    { to: "/allowance-types", label: "Tipe Tunjangan", description: "Atur berbagai jenis tunjangan karyawan." },
    { to: "/deduction-types", label: "Tipe Potongan", description: "Definisikan tipe-tipe potongan gaji." },
    { to: "/leave-requests-approval", label: "Approval Izin", description: "Proses pengajuan izin dan cuti karyawan." },
    { to: "/attendances-control", label: "Kontrol Absensi", description: "Monitor dan kelola data kehadiran." },
    // Tambahkan item lain di sini jika perlu
  ];

  return (
    // Padding utama halaman, diatur di AdminLayout > main, tapi bisa ditambahkan di sini jika perlu
    <div className="p-1 sm:p-2 md:p-4">
      <div className="bg-white shadow-xl rounded-xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Selamat Datang di Dashboard!
            </h1>
            {user && (
              <p className="mt-1 text-sm text-slate-600">
                : <span className="font-semibold text-sky-700">{user.name}</span> ({user.email}) - Role: <span className="font-semibold text-sky-700">{user.role}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 sm:mt-0 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
          >
            Logout
          </button>
        </div>
        <p className="text-slate-700">
          
        </p>
      </div>
      
      {/* Grid untuk Kartu Navigasi */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-700 mb-5 px-1">Menu Navigasi Utama</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminMenuItems.map((item) => (
            <NavStatCard
              key={item.to}
              title={item.label}
              description={item.description}
              linkTo={item.to}
              // Anda bisa menambahkan ikon atau warna berbeda per kartu jika mau
              // icon={<PenggunaIkon />}
              // bgColorClass="bg-sky-50 hover:bg-sky-100"
              // textColorClass="text-sky-700"
              // borderColorClass="border-sky-300 hover:border-sky-600"
            />
          ))}
        </div>
      </div>

      {/* Anda bisa menambahkan bagian lain di sini, misalnya: */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Aktivitas Terbaru</h2>
          <p className="text-slate-500">Konten aktivitas...</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Statistik Cepat</h2>
          <p className="text-slate-500">Konten statistik...</p>
        </div>
      </div> */}
    </div>
  );
}

export default DashboardPage;