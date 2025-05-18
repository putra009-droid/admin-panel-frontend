// src/pages/UserManagementPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import UserForm from '../components/UserForm'; // Komponen ini juga perlu di-style dengan Tailwind
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  baseSalary: string | null; // Gaji pokok bisa null
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
    id?: string;
    name: string;
    email: string;
    password?: string; // Password opsional, terutama saat edit
    role: string;
    baseSalary: string | null;
}

// interface ApiErrorResponse { // DEFINISI INI DIHAPUS KARENA TIDAK TERPAKAI
//   message?: string;
//   error?: string;
//   code?: string;
// }

interface UserSuccessResponse {
    message: string;
    user?: UserData; // Bisa jadi ada data user yang dikembalikan saat sukses
}

// Tipe untuk respons API GET /api/admin/users
type UsersApiResponse = UserData[] | { data: UserData[], message?: string, currentPage?: number, totalPages?: number, totalItems?: number };


const AVAILABLE_ROLES = ['ADMIN', 'USER', 'YAYASAN', 'REKTOR', 'PR1', 'PR2', 'EMPLOYEE']; // Anda bisa sesuaikan atau ambil dari API jika dinamis

function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Untuk state loading form
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) {
        setError('Token autentikasi tidak tersedia.');
        setIsLoading(false);
        return;
    }
    if (!API_BASE_URL) {
        setError('Konfigurasi URL API (VITE_API_BASE_URL) tidak ditemukan.');
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    const fetchUrl = `${API_BASE_URL}/admin/users`;

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        let errorMsg = `Gagal mengambil data user. Status: ${response.status}`;
        try {
          const errorData = await response.json(); // Tidak perlu type assertion ke ApiErrorResponse
          errorMsg = errorData.message || errorData.error || errorMsg;
        }
        catch (parseError) { console.warn("Could not parse error response body as JSON. Error:", parseError); }
        throw new Error(errorMsg);
      }
      
      const responseData = await response.json() as UsersApiResponse;
      if (Array.isArray(responseData)) {
        setUsers(responseData);
      } else if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
        setUsers(responseData.data);
      } else {
        setUsers([]); // Default ke array kosong jika struktur tidak dikenal atau tidak ada data
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui saat mengambil data user.';
      setError(errorMessage);
      setUsers([]); // Set users ke array kosong jika ada error
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, API_BASE_URL]); // Menambahkan API_BASE_URL ke dependency array useCallback

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
    setError(null); // Bersihkan error sebelumnya
  };

  const handleEditUser = (userToEdit: UserData) => {
    const initialFormData: UserFormData = {
        id: userToEdit.id,
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        baseSalary: userToEdit.baseSalary, // baseSalary bisa null
    };
    setEditingUser(initialFormData);
    setShowForm(true);
    setError(null); // Bersihkan error sebelumnya
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!API_BASE_URL) { setError('Konfigurasi URL API tidak ditemukan.'); return; }
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}" (ID: ${userId})?`)) {
      setError(null); // Bersihkan error sebelumnya
      const token = accessToken;
      if (!token) { setError('Token tidak ditemukan.'); return; }
      try {
        const deleteUrl = `${API_BASE_URL}/admin/users/${userId}`;
        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          let errorMsg = `Gagal menghapus user. Status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorData.error || errorMsg;
          }
          catch (parseError) { console.warn("Could not parse delete error response body. Error:", parseError); }
          throw new Error(errorMsg);
        }
        const result: { message: string } = await response.json();
        alert(result.message || `Pengguna "${userName}" berhasil dihapus.`);
        fetchUsers(); // Refresh data
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus user.';
        setError(`Gagal menghapus: ${errorMessage}`);
      }
    }
  };

  const handleResetPassword = (userId: string) => {
    // TODO: Implementasi logika reset password.
    // Biasanya ini melibatkan panggilan API untuk mengirim email reset atau generate password baru.
    alert(`Fungsi Reset password untuk pengguna ID: ${userId} belum diimplementasikan.`);
  };

  const handleFormSubmit = async (formData: UserFormData) => {
    if (!API_BASE_URL) {
        setError('Konfigurasi URL API tidak ditemukan.');
        setIsSubmitting(false);
        throw new Error('Konfigurasi URL API tidak ditemukan.'); // Lempar error agar form bisa menangani
    }
    setIsSubmitting(true);
    setError(null); // Bersihkan error sebelum submit
    const token = accessToken;
    if (!token) {
        setError('Token autentikasi tidak ditemukan.');
        setIsSubmitting(false);
        throw new Error('Token autentikasi tidak ditemukan.');
    }
    const isEditMode = !!formData.id;
    const url = isEditMode ? `${API_BASE_URL}/admin/users/${formData.id}` : `${API_BASE_URL}/admin/users`;
    const method = isEditMode ? 'PUT' : 'POST';
    
    // Persiapkan body request, hanya kirim password jika mode tambah dan password diisi
    const apiRequestBody = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      baseSalary: formData.baseSalary !== null && formData.baseSalary.trim() !== '' ? Number(formData.baseSalary) : null,
      ...( !isEditMode && formData.password && { password: formData.password } )
    };

    if (!isEditMode && !formData.password) {
        setError('Password wajib diisi untuk pengguna baru.');
        setIsSubmitting(false);
        throw new Error('Password wajib diisi.');
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(apiRequestBody),
      });
      if (!response.ok) {
        let errorMsg = `Gagal ${isEditMode ? 'memperbarui' : 'menambah'} user. Status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || errorMsg;
        }
        catch (parseError) { console.warn("Could not parse form submit error response body. Error:", parseError); }
        throw new Error(errorMsg);
      }
      const result = await response.json() as UserSuccessResponse;
      alert(result.message || `Pengguna berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      setShowForm(false); // Tutup form setelah sukses
      fetchUsers(); // Refresh data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal submit form.';
      setError(`Gagal submit: ${errorMessage}`); // Set error agar bisa ditampilkan di form jika perlu
      throw err; // Lempar error agar UserForm bisa menangkapnya juga
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setError(null); // Bersihkan error saat form ditutup
  };

  // Tampilan loading awal saat mengambil data pengguna
  if (isLoading && !showForm && users.length === 0) {
    return <div className="p-6 text-center text-slate-600 text-lg">Memuat daftar pengguna...</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Manajemen Pengguna</h1>
        <button
          onClick={handleAddUser}
          className="mt-3 sm:mt-0 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-sm disabled:opacity-60"
          disabled={isLoading || showForm} // Disable tombol jika sedang loading data utama atau form terbuka
        >
          + Tambah Pengguna Baru
        </button>
      </div>

      {/* Tampilkan error utama (jika ada dan form tidak sedang ditampilkan) */}
      {error && !showForm && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">Terjadi Kesalahan</p>
          <p>{error}</p>
        </div>
      )}

      {showForm ? (
        // Area Form
        <div className="bg-white p-6 rounded-xl shadow-2xl">
          <h2 className="text-xl font-semibold text-slate-700 mb-5">
            {editingUser ? 'Edit Data Pengguna' : 'Form Tambah Pengguna Baru'}
          </h2>
          <UserForm // Komponen UserForm juga perlu di-style menggunakan Tailwind
            initialData={editingUser}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            isLoading={isSubmitting} // State loading untuk proses submit form
            availableRoles={AVAILABLE_ROLES}
            // Anda bisa menambahkan prop untuk menampilkan error submit dari halaman ini ke dalam form jika diperlukan
            // submissionError={error} 
          />
        </div>
      ) : (
        // Area Tabel
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <h3 className="text-lg font-semibold text-slate-700 mb-2 sm:mb-0">Daftar Pengguna Terdaftar</h3>
            <span className="text-sm text-slate-500">Total Pengguna: {users.length}</span>
          </div>
          {/* Tampilkan loading data tabel jika proses fetch sedang berjalan */}
          {isLoading && users.length === 0 && <p className="p-10 text-center text-slate-500">Sedang memuat data pengguna...</p>}
          
          {!isLoading && users.length === 0 ? (
            <p className="p-10 text-center text-slate-500">Tidak ada data pengguna yang ditemukan.</p>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-center">No</th>
                    <th scope="col" className="px-6 py-3">Nama</th>
                    <th scope="col" className="px-6 py-3">Email</th>
                    <th scope="col" className="px-6 py-3">Role</th>
                    <th scope="col" className="px-6 py-3 text-right">Gaji Pokok</th>
                    <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4 text-center text-slate-500">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="capitalize bg-slate-200 text-slate-700 text-xs font-semibold mr-2 px-2.5 py-1 rounded-full">
                            {user.role.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {user.baseSalary ? `Rp ${parseInt(user.baseSalary, 10).toLocaleString('id-ID')}` : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
                            <button
                                onClick={() => handleEditUser(user)}
                                className="font-medium text-sky-600 hover:text-sky-800 text-xs py-1.5 px-3 rounded-md bg-sky-100 hover:bg-sky-200 transition-colors w-full sm:w-auto disabled:opacity-50"
                                disabled={showForm} // Disable jika form sedang aktif
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="font-medium text-red-600 hover:text-red-800 text-xs py-1.5 px-3 rounded-md bg-red-100 hover:bg-red-200 transition-colors w-full sm:w-auto disabled:opacity-50"
                                disabled={showForm}
                            >
                                Hapus
                            </button>
                            <button
                                onClick={() => handleResetPassword(user.id)}
                                className="font-medium text-amber-600 hover:text-amber-800 text-xs py-1.5 px-3 rounded-md bg-amber-100 hover:bg-amber-200 transition-colors w-full sm:w-auto disabled:opacity-50"
                                disabled={showForm}
                            >
                                Reset Pass
                            </button>
                            <Link
                                to={`/users/${user.id}/allowances`}
                                className={`font-medium text-green-600 hover:text-green-800 text-xs py-1.5 px-3 rounded-md bg-green-100 hover:bg-green-200 transition-colors text-center w-full sm:w-auto ${showForm ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                Tunjangan
                            </Link>
                            <Link
                                to={`/users/${user.id}/deductions`}
                                className={`font-medium text-purple-600 hover:text-purple-800 text-xs py-1.5 px-3 rounded-md bg-purple-100 hover:bg-purple-200 transition-colors text-center w-full sm:w-auto ${showForm ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                Potongan
                            </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserManagementPage;