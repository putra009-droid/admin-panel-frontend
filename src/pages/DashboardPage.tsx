// src/pages/DashboardPage.tsx
import { useAuth } from '../context/AuthContext'; // Pastikan path ini benar
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card'; // Impor Card
// import { useState } from 'react'; // Dihapus jika dashboardMessage tidak dipakai

function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // const [dashboardMessage, setDashboardMessage] = useState<string | null>(null); // Dihapus

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
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {/* Jika Anda ingin menampilkan Alert di dashboard di masa mendatang:
        1. Impor Alert lagi: import Alert from '../components/ui/Alert';
        2. Tambahkan state: const [dashboardMessage, setDashboardMessage] = useState<string | null>(null);
                               const [messageType, setMessageType] = useState<'success'|'error'|'info'>('info');
        3. Tambahkan logika untuk setDashboardMessage dan setMessageType.
        4. Aktifkan kode Alert di bawah ini:
        {dashboardMessage && (
          <Alert 
            type={messageType}
            title={messageType.charAt(0).toUpperCase() + messageType.slice(1)}
            onClose={() => setDashboardMessage(null)}
          >
            {dashboardMessage}
          </Alert>
        )}
      */}

      <Card titleClassName="bg-slate-50 !py-5" bodyClassName="!p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
              Selamat Datang!
            </h1>
            {user && (
              <p className="mt-1 text-sm text-slate-600">
                Anda login sebagai: <span className="font-semibold text-sky-700">{user.name}</span> ({user.email}) - Role: <span className="font-semibold text-sky-700">{user.role}</span>
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
        <p className="text-slate-700 mt-4">
          Ini adalah halaman admin utama Anda. Dari sini Anda dapat mengelola berbagai aspek aplikasi kepegawaian.
        </p>
      </Card>
      
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-5 px-1">Menu Navigasi Utama</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminMenuItems.map((item) => (
            <Link key={item.to} to={item.to} className="block group">
              <Card 
                title={item.label}
                className="h-full transition-all duration-300 ease-in-out group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:border-sky-500 border-2 border-transparent"
                titleClassName="group-hover:text-sky-700 !py-3 !px-4 text-base"
                bodyClassName="!pt-2 !pb-4 !px-4"
              >
                <p className="text-xs text-slate-500">{item.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;