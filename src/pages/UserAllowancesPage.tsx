// src/pages/UserAllowancesPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserAllowanceForm from '../components/UserAllowanceForm'; // Komponen ini juga perlu di-style

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

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

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

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<UserAllowanceFormData | null>(null);

  const fetchUserName = useCallback(async () => {
    // ... (logika Anda tidak berubah)
    if (!accessToken || !userId || !API_BASE_URL) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('Gagal mengambil data pengguna.');
      const userData = await response.json();
      setUserName(userData.name || `User ID: ${userId}`);
    } catch (err) {
      console.error("Gagal mengambil nama pengguna:", err);
      setUserName(`User ID: ${userId}`);
    }
  }, [accessToken, userId, API_BASE_URL]);

  const fetchAvailableAllowanceTypes = useCallback(async () => {
    // ... (logika Anda tidak berubah)
    if (!accessToken || !API_BASE_URL) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/allowance-types`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as ApiErrorResponse;
        throw new Error(errData.message || errData.error || `Gagal mengambil tipe tunjangan. Status: ${response.status}`);
      }
      const dataFromApi: AllowanceTypeOption[] = await response.json();
      setAvailableAllowanceTypes(dataFromApi || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil tipe tunjangan.';
      setError(prev => prev ? `${prev}\n${errorMessage}` : errorMessage);
    }
  }, [accessToken, API_BASE_URL]);

  const fetchUserAllowances = useCallback(async () => {
    // ... (logika Anda tidak berubah)
    if (!accessToken || !userId || !API_BASE_URL) {
      setError('Parameter tidak lengkap atau token/URL API tidak tersedia.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/allowances`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as ApiErrorResponse;
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil tunjangan pengguna.';
      setError(errorMessage);
      setUserAllowances([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId, API_BASE_URL]);

  useEffect(() => {
    // ... (logika Anda tidak berubah)
    if (userId && accessToken) {
      fetchUserName();
      fetchAvailableAllowanceTypes();
      fetchUserAllowances();
    }
  }, [userId, accessToken, fetchUserName, fetchAvailableAllowanceTypes, fetchUserAllowances]);

  const handleAdd = () => {
    // ... (logika Anda tidak berubah)
     if (availableAllowanceTypes.length === 0) {
        alert("Tidak ada tipe tunjangan yang tersedia. Tambahkan dulu di 'Kelola Tipe Tunjangan'.");
        return;
    }
    setEditingData(null);
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (item: UserAllowance) => {
    // ... (logika Anda tidak berubah)
    const formData: UserAllowanceFormData = {
      id: item.id,
      allowanceTypeId: item.allowanceTypeId,
      amount: String(item.amount),
    };
    setEditingData(formData);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (userAllowanceId: string, allowanceName: string) => {
    // ... (logika Anda tidak berubah)
    if (!API_BASE_URL) { setError('URL API tidak ditemukan.'); return; }
    if (window.confirm(`Yakin ingin menghapus tunjangan "${allowanceName}" untuk pengguna ini?`)) {
      setError(null);
      if (!accessToken || !userId) { setError('Token atau User ID tidak ditemukan.'); return; }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/allowances/${userAllowanceId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({})) as ApiErrorResponse;
          throw new Error(errData.message || errData.error || `Gagal menghapus tunjangan. Status: ${response.status}`);
        }
        alert(`Tunjangan "${allowanceName}" berhasil dihapus.`);
        fetchUserAllowances();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        setError(`Gagal menghapus: ${errorMessage}`);
      }
    }
  };

  const handleFormSubmit = async (formData: UserAllowanceFormData) => {
    // ... (logika Anda tidak berubah)
    if (!API_BASE_URL) { 
        setError('URL API tidak ditemukan.'); 
        setIsSubmitting(false); 
        throw new Error('URL API tidak ditemukan.');
    }
    setIsSubmitting(true);
    setError(null);
    if (!accessToken || !userId) {
      setError('Token atau User ID tidak ditemukan.');
      setIsSubmitting(false);
      throw new Error('Token atau User ID tidak ditemukan.');
    }

    const isEditMode = !!formData.id;
    const url = isEditMode 
        ? `${API_BASE_URL}/admin/users/${userId}/allowances/${formData.id}` 
        : `${API_BASE_URL}/admin/users/${userId}/allowances`;
    const method = isEditMode ? 'PUT' : 'POST';

    const bodyToSubmit = {
        allowanceTypeId: formData.allowanceTypeId,
        amount: formData.amount, // Biarkan backend yang mengonversi ke Decimal
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(bodyToSubmit),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as ApiErrorResponse;
        throw new Error(errData.message || errData.error || `Gagal submit. Status: ${response.status}`);
      }
      alert(`Tunjangan pengguna berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      setShowForm(false);
      fetchUserAllowances();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(`Gagal submit: ${errorMessage}`);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingData(null);
    setError(null);
  };
  
  if (!userId) {
    return (
        <div className="p-6">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg relative" role="alert">
                User ID tidak ditemukan di URL.
            </div>
        </div>
    );
  }

  if (isLoading && !showForm) {
    return <div className="p-6 text-center text-slate-600">Memuat data tunjangan untuk pengguna...</div>;
  }
  
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Link to="/users" className="text-sky-600 hover:text-sky-800 hover:underline text-sm font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Manajemen Pengguna
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Kelola Tunjangan: <span className="text-sky-700">{userName || 'Memuat...'}</span>
        </h1>
        <button
          onClick={handleAdd}
          className="mt-3 sm:mt-0 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-sm disabled:opacity-50"
          disabled={showForm || isLoading || availableAllowanceTypes.length === 0}
        >
          + Tambah Tunjangan
        </button>
      </div>
      
      {availableAllowanceTypes.length === 0 && !showForm && !isLoading && (
         <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4" role="alert">
            <p className="font-bold">Informasi</p>
            <p>Tidak ada tipe tunjangan yang tersedia. Silakan tambahkan tipe tunjangan terlebih dahulu di halaman "Kelola Tipe Tunjangan".</p>
        </div>
      )}

      {error && !showForm && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {showForm && userId ? (
        <div className="bg-white p-6 rounded-xl shadow-xl">
           <h2 className="text-xl font-semibold text-slate-700 mb-4">
            {editingData ? 'Edit Tunjangan Pengguna' : 'Tambah Tunjangan Baru untuk Pengguna'}
          </h2>
          <UserAllowanceForm // Komponen ini juga perlu di-style dengan Tailwind
            initialData={editingData}
            availableAllowanceTypes={availableAllowanceTypes}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-700">Daftar Tunjangan Diterima</h3>
            <span className="text-sm text-slate-500">Total: {userAllowances.length}</span>
          </div>
          {isLoading ? (
             <p className="p-6 text-center text-slate-500">Memuat data...</p>
          ) : userAllowances.length === 0 ? (
            <p className="p-6 text-center text-slate-500">Tidak ada tunjangan yang ditetapkan untuk pengguna ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-3">Nama Tunjangan</th>
                    <th scope="col" className="px-6 py-3">Deskripsi Tipe</th>
                    <th scope="col" className="px-6 py-3 text-right">Jumlah (Rp)</th>
                    <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {userAllowances.map((ua) => (
                    <tr key={ua.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{ua.allowanceType?.name || 'Tipe Dihapus/Tidak Valid'}</td>
                      <td className="px-6 py-4 text-xs">{ua.allowanceType?.description || '-'}</td>
                      <td className="px-6 py-4 text-right font-semibold whitespace-nowrap">
                        {parseFloat(ua.amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(ua)}
                          className="font-medium text-sky-600 hover:text-sky-800 hover:underline mr-3 text-xs py-1 px-2 rounded bg-sky-100 hover:bg-sky-200 transition-colors"
                          disabled={showForm}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(ua.id, ua.allowanceType?.name || 'Tunjangan Ini')}
                          className="font-medium text-red-600 hover:text-red-800 hover:underline text-xs py-1 px-2 rounded bg-red-100 hover:bg-red-200 transition-colors"
                          disabled={showForm}
                        >
                          Hapus
                        </button>
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

export default UserAllowancesPage;