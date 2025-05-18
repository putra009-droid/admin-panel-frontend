// src/pages/UserDeductionsPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserDeductionForm from '../components/UserDeductionForm'; // Komponen ini juga perlu di-style
import type { DeductionCalculationType } from '../types/deductionTypes';
import { DeductionCalculationTypeValue } from '../types/deductionTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UserDeduction {
  id: string;
  userId: string;
  deductionTypeId: string;
  assignedAmount: string | null;
  assignedPercentage: string | null;
  deductionType: {
    id: string;
    name: string;
    calculationType: DeductionCalculationType;
    description?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface DeductionTypeOption {
  id: string;
  name: string;
  calculationType: DeductionCalculationType;
}

interface UserDeductionFormData {
    id?: string;
    deductionTypeId: string;
    assignedAmount?: string | null;
    assignedPercentage?: string | null;
}

type UserDeductionsApiResponse = UserDeduction[];


function UserDeductionsPage() {
  const { userId } = useParams<{ userId: string }>();
  const { accessToken } = useAuth();

  const [userName, setUserName] = useState<string>('');
  const [userDeductions, setUserDeductions] = useState<UserDeduction[]>([]);
  const [availableDeductionTypes, setAvailableDeductionTypes] = useState<DeductionTypeOption[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<UserDeductionFormData | null>(null);

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

  const fetchAvailableDeductionTypes = useCallback(async () => {
    // ... (logika Anda tidak berubah)
    if (!accessToken || !API_BASE_URL) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/deduction-types`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Gagal mengambil tipe potongan. Status: ${response.status}`);
      }
      const dataFromApi: Array<{id: string, name: string, calculationType: DeductionCalculationType}> = await response.json();
      setAvailableDeductionTypes((dataFromApi || []).map(dt => ({
        id: dt.id,
        name: dt.name,
        calculationType: dt.calculationType,
      })));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil tipe potongan.';
      setError(prev => prev ? `${prev}\n${errorMessage}` : errorMessage);
    }
  }, [accessToken, API_BASE_URL]);

  const fetchUserDeductions = useCallback(async () => {
    // ... (logika Anda tidak berubah)
    if (!accessToken || !userId || !API_BASE_URL) {
      setError('Parameter tidak lengkap atau token/URL API tidak tersedia.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/deductions`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Gagal mengambil potongan pengguna. Status: ${response.status}`);
      }
      const responseData = await response.json() as UserDeductionsApiResponse;
      if (Array.isArray(responseData)) {
        setUserDeductions(responseData);
      } else {
        setUserDeductions([]);
        setError('Format data potongan pengguna tidak sesuai dari server.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil potongan pengguna.';
      setError(errorMessage);
      setUserDeductions([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId, API_BASE_URL]);

  useEffect(() => {
    // ... (logika Anda tidak berubah)
    if (userId && accessToken) {
      fetchUserName();
      fetchAvailableDeductionTypes();
      fetchUserDeductions();
    }
  }, [userId, accessToken, fetchUserName, fetchAvailableDeductionTypes, fetchUserDeductions]);

  const handleAdd = () => {
    // ... (logika Anda tidak berubah)
    if (availableDeductionTypes.length === 0) {
        alert("Tidak ada tipe potongan yang tersedia. Tambahkan dulu di 'Kelola Tipe Potongan'.");
        return;
    }
    setEditingData(null);
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (item: UserDeduction) => {
    // ... (logika Anda tidak berubah)
    const formData: UserDeductionFormData = {
      id: item.id,
      deductionTypeId: item.deductionTypeId,
      assignedAmount: item.assignedAmount !== null ? String(item.assignedAmount) : null,
      assignedPercentage: item.assignedPercentage !== null ? String(item.assignedPercentage) : null,
    };
    setEditingData(formData);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (userDeductionId: string, deductionName: string) => {
    // ... (logika Anda tidak berubah)
    if (!API_BASE_URL) { setError('URL API tidak ditemukan.'); return; }
    if (window.confirm(`Yakin ingin menghapus potongan "${deductionName}" untuk pengguna ini?`)) {
      setError(null);
      if (!accessToken || !userId) { setError('Token atau User ID tidak ditemukan.'); return; }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/deductions/${userDeductionId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || `Gagal menghapus potongan. Status: ${response.status}`);
        }
        alert(`Potongan "${deductionName}" berhasil dihapus.`);
        fetchUserDeductions();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        setError(`Gagal menghapus: ${errorMessage}`);
      }
    }
  };

  const handleFormSubmit = async (formData: UserDeductionFormData) => {
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
        ? `${API_BASE_URL}/admin/users/${userId}/deductions/${formData.id}` 
        : `${API_BASE_URL}/admin/users/${userId}/deductions`;
    const method = isEditMode ? 'PUT' : 'POST';

    const selectedType = availableDeductionTypes.find(dt => dt.id === formData.deductionTypeId);
    const bodyToSubmit: { deductionTypeId: string; assignedAmount?: string | null; assignedPercentage?: string | null } = {
        deductionTypeId: formData.deductionTypeId,
    };

    if (selectedType) {
        if (selectedType.calculationType === DeductionCalculationTypeValue.FIXED_USER) {
            bodyToSubmit.assignedAmount = formData.assignedAmount;
            bodyToSubmit.assignedPercentage = null;
        } else if (selectedType.calculationType === DeductionCalculationTypeValue.PERCENTAGE_USER) {
            bodyToSubmit.assignedPercentage = formData.assignedPercentage;
            bodyToSubmit.assignedAmount = null;
        } else { // Untuk FIXED_RULE dan PERCENTAGE_RULE, nilai spesifik pengguna tidak diperlukan
            bodyToSubmit.assignedAmount = null;
            bodyToSubmit.assignedPercentage = null;
        }
    } else {
        setError("Tipe potongan yang dipilih tidak valid.");
        setIsSubmitting(false);
        throw new Error("Tipe potongan yang dipilih tidak valid.");
    }
    
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
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Gagal submit. Status: ${response.status}`);
      }
      alert(`Potongan pengguna berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      setShowForm(false);
      fetchUserDeductions();
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
    return <div className="p-6 text-center text-slate-600">Memuat data potongan untuk pengguna...</div>;
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
          Kelola Potongan: <span className="text-sky-700">{userName || 'Memuat...'}</span>
        </h1>
        <button
          onClick={handleAdd}
          className="mt-3 sm:mt-0 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-sm disabled:opacity-50"
          disabled={showForm || isLoading || availableDeductionTypes.length === 0}
        >
          + Tambah Potongan
        </button>
      </div>

      {availableDeductionTypes.length === 0 && !showForm && !isLoading && (
         <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4" role="alert">
            <p className="font-bold">Informasi</p>
            <p>Tidak ada tipe potongan yang tersedia. Silakan tambahkan tipe potongan terlebih dahulu di halaman "Kelola Tipe Potongan".</p>
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
            {editingData ? 'Edit Potongan Pengguna' : 'Tambah Potongan Baru untuk Pengguna'}
          </h2>
          <UserDeductionForm // Komponen ini juga perlu di-style dengan Tailwind
            initialData={editingData}
            availableDeductionTypes={availableDeductionTypes}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-700">Daftar Potongan Diterima</h3>
            <span className="text-sm text-slate-500">Total: {userDeductions.length}</span>
          </div>
           {isLoading ? (
             <p className="p-6 text-center text-slate-500">Memuat data...</p>
          ) : userDeductions.length === 0 ? (
            <p className="p-6 text-center text-slate-500">Tidak ada potongan yang ditetapkan untuk pengguna ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-3">Nama Potongan</th>
                    <th scope="col" className="px-6 py-3">Tipe Kalkulasi</th>
                    <th scope="col" className="px-6 py-3 text-right">Jumlah (Rp)</th>
                    <th scope="col" className="px-6 py-3 text-right">Persentase (%)</th>
                    <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {userDeductions.map((ud) => (
                    <tr key={ud.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{ud.deductionType?.name || 'Tipe Dihapus/Tidak Valid'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{(ud.deductionType?.calculationType || '').replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4 text-right font-semibold whitespace-nowrap">
                        {ud.assignedAmount ? parseFloat(ud.assignedAmount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold whitespace-nowrap">
                        {ud.assignedPercentage ? `${parseFloat(ud.assignedPercentage)}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(ud)}
                          className="font-medium text-sky-600 hover:text-sky-800 hover:underline mr-3 text-xs py-1 px-2 rounded bg-sky-100 hover:bg-sky-200 transition-colors"
                          disabled={showForm}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(ud.id, ud.deductionType?.name || 'Potongan Ini')}
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

export default UserDeductionsPage;