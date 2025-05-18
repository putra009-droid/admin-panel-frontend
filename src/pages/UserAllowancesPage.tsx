// src/pages/UserAllowancesPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserAllowanceForm from '../components/UserAllowanceForm'; // Komponen ini juga perlu di-style
import TableWrapper from '../components/ui/TableWrapper';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UserAllowance {
  id: string;
  userId: string;
  allowanceTypeId: string;
  amount: string;
  allowanceType: {
    id: string;
    name: string;
    isFixed: boolean;
    description?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface AllowanceTypeOption {
  id: string;
  name: string;
  isFixed: boolean;
}

interface UserAllowanceFormData {
    id?: string;
    allowanceTypeId: string;
    amount: string;
}

// Tipe untuk respons API GET /api/admin/users/:userId/allowances
// Bisa jadi array UserAllowance langsung, atau objek dengan properti 'data'
type UserAllowancesApiResponse = UserAllowance[] | { data?: UserAllowance[], message?: string };


function UserAllowancesPage() {
  const { userId } = useParams<{ userId: string }>();
  const { accessToken } = useAuth();

  const [userName, setUserName] = useState<string>('');
  const [userAllowances, setUserAllowances] = useState<UserAllowance[]>([]);
  const [availableAllowanceTypes, setAvailableAllowanceTypes] = useState<AllowanceTypeOption[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<UserAllowanceFormData | null>(null);

  const fetchUserName = useCallback(async () => {
    if (!accessToken || !userId || !API_BASE_URL) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('Gagal mengambil data pengguna.'); // Lebih baik throw Error object
      const userData = await response.json(); // TypeScript akan mencoba infer type, atau Anda bisa beri tipe spesifik
      setUserName(userData.name || `User ID: ${userId}`);
    } catch (err: unknown) { // Menggunakan unknown
      console.error("Gagal mengambil nama pengguna:", err);
      setUserName(`User ID: ${userId}`);
    }
  }, [accessToken, userId, API_BASE_URL]);

  const fetchAvailableAllowanceTypes = useCallback(async () => {
    if (!accessToken || !API_BASE_URL) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/allowance-types`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Gagal mengambil tipe tunjangan. Status: ${response.status}`);
      }
      const dataFromApi: AllowanceTypeOption[] = await response.json(); // Asumsikan API mengembalikan array yang sesuai
      setAvailableAllowanceTypes(dataFromApi || []);
    } catch (err: unknown) { // Menggunakan unknown
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil tipe tunjangan.';
      setError(prev => prev ? `${prev}\n${errorMessage}` : errorMessage);
    }
  }, [accessToken, API_BASE_URL]);

  const fetchUserAllowances = useCallback(async () => {
    if (!accessToken || !userId || !API_BASE_URL) {
      setError('Parameter tidak lengkap atau token/URL API tidak tersedia.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/allowances`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Gagal mengambil tunjangan pengguna. Status: ${response.status}`);
      }
      const responseData = await response.json() as UserAllowancesApiResponse;
      if (Array.isArray(responseData)) {
        setUserAllowances(responseData);
      } else if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
        setUserAllowances(responseData.data);
      } else if (responseData && typeof responseData === 'object' && !('data' in responseData) && Object.keys(responseData).length === 0) {
        setUserAllowances([]);
      }
      else {
        setUserAllowances([]);
      }
    } catch (err: unknown) { // Menggunakan unknown
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil tunjangan pengguna.';
      setError(errorMessage);
      setUserAllowances([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId, API_BASE_URL]);

  useEffect(() => {
    if (userId && accessToken) {
      fetchUserName();
      fetchAvailableAllowanceTypes();
      fetchUserAllowances();
    }
  }, [userId, accessToken, fetchUserName, fetchAvailableAllowanceTypes, fetchUserAllowances]);

  const handleAdd = () => {
    if (availableAllowanceTypes.length === 0) {
        alert("Tidak ada tipe tunjangan yang tersedia. Tambahkan dulu di 'Kelola Tipe Tunjangan'.");
        return;
    }
    setEditingData(null); setShowForm(true); setError(null); setSuccessMessage(null);
  };

  const handleEdit = (item: UserAllowance) => {
    setEditingData({ id: item.id, allowanceTypeId: item.allowanceTypeId, amount: String(item.amount) });
    setShowForm(true); setError(null); setSuccessMessage(null);
  };

  const handleDelete = async (userAllowanceId: string, allowanceName: string) => {
    if (!API_BASE_URL) { setError('URL API tidak ditemukan.'); return; }
    if (window.confirm(`Yakin ingin menghapus tunjangan "${allowanceName}" untuk pengguna ini?`)) {
      setError(null); setSuccessMessage(null);
      if (!accessToken || !userId) { setError('Token atau User ID tidak ditemukan.'); return; }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/allowances/${userAllowanceId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || `Gagal menghapus tunjangan. Status: ${response.status}`);
        }
        setSuccessMessage(`Tunjangan "${allowanceName}" berhasil dihapus.`);
        fetchUserAllowances();
      } catch (err: unknown) { // Menggunakan unknown
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        setError(`Gagal menghapus: ${errorMessage}`);
      }
    }
  };

  const handleFormSubmit = async (formData: UserAllowanceFormData) => {
    if (!API_BASE_URL) { setError('URL API tidak ditemukan.'); setIsSubmitting(false); throw new Error('URL API tidak ditemukan.'); }
    setIsSubmitting(true); setError(null); setSuccessMessage(null);
    if (!accessToken || !userId) { setError('Token atau User ID tidak ditemukan.'); setIsSubmitting(false); throw new Error('Token atau User ID tidak ditemukan.'); }
    const isEditMode = !!formData.id;
    const url = isEditMode ? `${API_BASE_URL}/admin/users/${userId}/allowances/${formData.id}` : `${API_BASE_URL}/admin/users/${userId}/allowances`;
    const method = isEditMode ? 'PUT' : 'POST';
    const bodyToSubmit = { allowanceTypeId: formData.allowanceTypeId, amount: formData.amount };
    try {
      const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }, body: JSON.stringify(bodyToSubmit) });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Gagal submit. Status: ${response.status}`);
      }
      setSuccessMessage(`Tunjangan pengguna berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      setShowForm(false);
      fetchUserAllowances();
    } catch (err: unknown) { // Menggunakan unknown
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(`Gagal submit: ${errorMessage}`);
      throw err; // Re-throw agar form bisa menangani jika perlu
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => { setShowForm(false); setEditingData(null); setError(null); setSuccessMessage(null); };
  
  // --- JSX Tidak Berubah dari Versi Sebelumnya yang Menggunakan Komponen UI ---
  if (!userId) return <div className="p-6"><Alert type="error">User ID tidak ditemukan di URL.</Alert></div>;
  if (isLoading && !showForm && userAllowances.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <Link to="/users" className="text-sky-600 hover:text-sky-800 hover:underline text-sm font-medium flex items-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Kembali
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6">Kelola Tunjangan: <span className="text-sky-700">{userName || 'Memuat...'}</span></h1>
        <TableWrapper isLoading={true} loadingMessage="Memuat data tunjangan..."><div></div></TableWrapper>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="mb-2">
        <Link to="/users" className="text-sky-600 hover:text-sky-800 hover:underline text-sm font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Kembali ke Manajemen Pengguna
        </Link>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
        Kelola Tunjangan: <span className="text-sky-700">{userName || 'Memuat...'}</span>
      </h1>

      {error && !showForm && ( <Alert type="error" title="Error" onClose={() => setError(null)}>{error}</Alert> )}
      {successMessage && !showForm && ( <Alert type="success" title="Sukses" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert> )}
      {availableAllowanceTypes.length === 0 && !showForm && !isLoading && ( <Alert type="warning" title="Informasi">Tidak ada tipe tunjangan yang tersedia. Silakan tambahkan terlebih dahulu.</Alert> )}

      {showForm && userId ? (
        <Card title={editingData ? 'Edit Tunjangan Pengguna' : 'Tambah Tunjangan Baru'} className="max-w-2xl mx-auto">
          {error && ( <Alert type="error" title="Gagal Submit" className="mb-4" onClose={() => setError(null)}>{error}</Alert> )}
          <UserAllowanceForm
            initialData={editingData}
            availableAllowanceTypes={availableAllowanceTypes}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        </Card>
      ) : (
        <TableWrapper
          isLoading={isLoading}
          isEmpty={!isLoading && userAllowances.length === 0}
          emptyMessage="Tidak ada tunjangan yang ditetapkan untuk pengguna ini."
          headerContent={
            <button
              onClick={handleAdd}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-sm disabled:opacity-50"
              disabled={isLoading || availableAllowanceTypes.length === 0}
            >
              + Tambah Tunjangan
            </button>
          }
        >
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-3">Nama Tunjangan</th>
                <th scope="col" className="px-6 py-3">Deskripsi Tipe</th>
                <th scope="col" className="px-6 py-3 text-right">Jumlah</th>
                <th scope="col" className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {userAllowances.map((ua) => (
                <tr key={ua.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{ua.allowanceType?.name || 'Tipe Dihapus'}</td>
                  <td className="px-6 py-4 text-xs">{ua.allowanceType?.description || '-'}</td>
                  <td className="px-6 py-4 text-right font-semibold whitespace-nowrap">
                    {parseFloat(ua.amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button onClick={() => handleEdit(ua)} className="font-medium text-sky-600 hover:text-sky-800 hover:underline mr-3 text-xs py-1 px-2 rounded bg-sky-100 hover:bg-sky-200 transition-colors">Edit</button>
                    <button onClick={() => handleDelete(ua.id, ua.allowanceType?.name || 'Tunjangan Ini')} className="font-medium text-red-600 hover:text-red-800 hover:underline text-xs py-1 px-2 rounded bg-red-100 hover:bg-red-200 transition-colors">Hapus</button>
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

export default UserAllowancesPage;