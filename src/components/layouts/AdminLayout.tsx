// Di file src/components/layouts/AdminLayout.tsx
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom'; // Baris BARU (Link sudah dihapus)
import { useAuth } from '../../context/AuthContext'; // Pastikan path ini benar
// ... sisa kode

// Komponen Sidebar
const Sidebar: React.FC = () => {
  const menuItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/users", label: "Manajemen Pengguna" },
    { path: "/allowance-types", label: "Jenis Tunjangan" },
    { path: "/deduction-types", label: "Jenis Potongan" },
    // Anda perlu logika tambahan di sini jika ingin menampilkan link berdasarkan peran
    // Untuk saat ini, kita tampilkan semua dan biarkan ProtectedRoute di App.tsx yang menangani akses
    { path: "/leave-requests-approval", label: "Persetujuan Cuti" },
    { path: "/attendances-control", label: "Kontrol Kehadiran" },
  ];

  return (
    <aside className="w-64 bg-slate-800 text-slate-100 p-5 pt-8 hidden md:flex flex-col shadow-xl">
      <div className="text-2xl font-bold mb-10 text-sky-400 tracking-wide text-center">
        Admin Panel
      </div>
      <nav className="flex-grow">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path} className="mb-3">
              <NavLink // Menggunakan NavLink untuk mendapatkan 'isActive' secara otomatis
                to={item.path}
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded-lg hover:bg-slate-700 hover:text-sky-300 transition-colors duration-150 ease-in-out text-sm font-medium ${
                    isActive ? "bg-sky-600 text-white shadow-md" : "text-slate-300"
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <p className="text-xs text-slate-500 text-center">© {new Date().getFullYear()} Admin Panel</p>
      </div>
    </aside>
  );
};

// Komponen Navbar
const Navbar: React.FC = () => {
  const { user, logout } = useAuth(); // Mengambil user dan fungsi logout dari context

  return (
    <header className="bg-white shadow-md py-3 px-6 flex justify-between items-center">
      <button className="md:hidden text-slate-600 hover:text-sky-600 focus:outline-none">
        {/* TODO: Implement mobile menu toggle functionality */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
      
      <div className="text-lg font-semibold text-slate-700 hidden md:block">
        {/* Bisa diisi dengan judul halaman dinamis jika diperlukan */}
      </div>

      {user && ( // Tampilkan hanya jika user terautentikasi
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600 hidden sm:block">
            Halo, <span className="font-medium">{user?.name || 'Pengguna'}</span>! {/* Asumsi user object memiliki property 'name' */}
          </span>
          <button
            onClick={logout} // Panggil fungsi logout dari context
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md text-xs transition-colors shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

// Komponen AdminLayout Utama
const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-slate-50">
          <Outlet /> {/* Konten halaman akan dirender di sini */}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;