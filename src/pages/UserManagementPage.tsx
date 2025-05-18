// src/pages/UserManagementPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import UserForm from '../components/UserForm'; // Komponen ini juga perlu di-style dengan Tailwind
import { Link } from 'react-router-dom';
import TableWrapper from '../components/ui/TableWrapper';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UserData { id: string; name: string; email: string; role: string; baseSalary: string | null; createdAt: string; updatedAt: string; }
interface UserFormData { id?: string; name: string; email: string; password?: string; role: string; baseSalary: string | null; }
interface UserSuccessResponse { message: string; user?: UserData; }
type UsersApiResponse = UserData[] | { data: UserData[], message?: string, currentPage?: number, totalPages?: number, totalItems?: number };

const AVAILABLE_ROLES = ['ADMIN', 'USER', 'YAYASAN', 'REKTOR', 'PR1', 'PR2', 'EMPLOYEE'];

function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { accessToken } = useAuth();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!accessToken || !API_BASE_URL) { setError('Token atau URL API tidak tersedia.'); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Gagal mengambil data pengguna. Status: ${response.status}`);
      }
      const responseData = await response.json() as UsersApiResponse;
      if (Array.isArray(responseData)) { setUsers(responseData); }
      else if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) { setUsers(responseData.data); }
      else { setUsers([]); }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage); setUsers([]);
    } finally { setIsLoading(false); }
  }, [accessToken, API_BASE_URL]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAddUser = () => { setEditingUser(null); setShowForm(true); setError(null); setSuccessMessage(null); };
  const handleEditUser = (userToEdit: UserData) => { setEditingUser({ id: userToEdit.id, name: userToEdit.name, email: userToEdit.email, role: userToEdit.role, baseSalary: userToEdit.baseSalary }); setShowForm(true); setError(null); setSuccessMessage(null); };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!API_BASE_URL) { setError('Konfigurasi URL API tidak ditemukan.'); return; }
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}" (ID: ${userId})?`)) {
      setError(null); setSuccessMessage(null);
      if (!accessToken) { setError('Token tidak ditemukan.'); return; }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `Gagal menghapus pengguna. Status: ${response.status}`);
        }
        const result: { message: string } = await response.json();
        setSuccessMessage(result.message || `Pengguna "${userName}" berhasil dihapus.`);
        fetchUsers();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus pengguna.';
        setError(`Gagal menghapus: ${errorMessage}`);
      }
    }
  };

  const handleResetPassword = (userId: string) => { alert(`Fungsi Reset password untuk pengguna ID: ${userId} belum diimplementasikan.`); };

  const handleFormSubmit = async (formData: UserFormData) => {
    if (!API_BASE_URL) { setError('Konfigurasi URL API tidak ditemukan.'); setIsSubmitting(false); throw new Error('Konfigurasi URL API tidak ditemukan.'); }
    setIsSubmitting(true); setError(null); setSuccessMessage(null);
    if (!accessToken) { setError('Token autentikasi tidak ditemukan.'); setIsSubmitting(false); throw new Error('Token autentikasi tidak ditemukan.'); }
    const isEditMode = !!formData.id;
    const url = isEditMode ? `${API_BASE_URL}/admin/users/${formData.id}` : `${API_BASE_URL}/admin/users`;
    const method = isEditMode ? 'PUT' : 'POST';
    const apiRequestBody = { name: formData.name, email: formData.email, role: formData.role, baseSalary: formData.baseSalary !== null && formData.baseSalary.trim() !== '' ? Number(formData.baseSalary) : null, ...(!isEditMode && formData.password && { password: formData.password }) };
    if (!isEditMode && !formData.password) { setError('Password wajib diisi untuk pengguna baru.'); setIsSubmitting(false); throw new Error('Password wajib diisi.'); }
    try {
      const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }, body: JSON.stringify(apiRequestBody) });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Gagal ${isEditMode ? 'memperbarui' : 'menambah'} pengguna. Status: ${response.status}`);
      }
      const result = await response.json() as UserSuccessResponse;
      setSuccessMessage(result.message || `Pengguna berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      setShowForm(false); fetchUsers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal submit form.';
      setError(`Gagal submit: ${errorMessage}`); throw err;
    } finally { setIsSubmitting(false); }
  };

  const handleCancelForm = () => { setShowForm(false); setEditingUser(null); setError(null); setSuccessMessage(null); };

  if (isLoading && !showForm && users.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6">Manajemen Pengguna</h1>
        <TableWrapper isLoading={true} loadingMessage="Memuat daftar pengguna..."><div></div></TableWrapper>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Manajemen Pengguna</h1>

      {error && !showForm && (
        <Alert type="error" title="Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && !showForm && (
        <Alert type="success" title="Sukses" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {showForm ? (
        <Card title={editingUser ? 'Edit Data Pengguna' : 'Form Tambah Pengguna Baru'} className="max-w-2xl mx-auto">
          {error && (
             <Alert type="error" title="Gagal Submit" className="mb-4" onClose={() => setError(null)}>
                {error}
             </Alert>
          )}
          <UserForm
            initialData={editingUser}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
            availableRoles={AVAILABLE_ROLES}
          />
        </Card>
      ) : (
        <TableWrapper
          isLoading={isLoading}
          isEmpty={!isLoading && users.length === 0}
          emptyMessage="Tidak ada data pengguna."
          headerContent={
            <button
              onClick={handleAddUser}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-sm disabled:opacity-50"
              disabled={isLoading}
            >
              + Tambah Pengguna Baru
            </button>
          }
        >
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
                            className="font-medium text-sky-600 hover:text-sky-800 text-xs py-1.5 px-3 rounded-md bg-sky-100 hover:bg-sky-200 transition-colors w-full sm:w-auto"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="font-medium text-red-600 hover:text-red-800 text-xs py-1.5 px-3 rounded-md bg-red-100 hover:bg-red-200 transition-colors w-full sm:w-auto"
                        >
                            Hapus
                        </button>
                        <button
                            onClick={() => handleResetPassword(user.id)}
                            className="font-medium text-amber-600 hover:text-amber-800 text-xs py-1.5 px-3 rounded-md bg-amber-100 hover:bg-amber-200 transition-colors w-full sm:w-auto"
                        >
                            Reset Pass
                        </button>
                        <Link
                            to={`/users/${user.id}/allowances`}
                            className="font-medium text-green-600 hover:text-green-800 text-xs py-1.5 px-3 rounded-md bg-green-100 hover:bg-green-200 transition-colors text-center w-full sm:w-auto"
                        >
                            Tunjangan
                        </Link>
                        <Link
                            to={`/users/${user.id}/deductions`}
                            className="font-medium text-purple-600 hover:text-purple-800 text-xs py-1.5 px-3 rounded-md bg-purple-100 hover:bg-purple-200 transition-colors text-center w-full sm:w-auto"
                        >
                            Potongan
                        </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      )}
    </div>
  );
}

export default UserManagementPage;