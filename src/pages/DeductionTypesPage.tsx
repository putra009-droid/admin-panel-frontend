// src/pages/DeductionTypesPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import DeductionTypeForm from '../components/DeductionTypeForm'; // Komponen ini juga perlu di-style dengan Tailwind
import type { DeductionCalculationType } from '../types/deductionTypes';

interface DeductionType {
  id: string;
  name: string;
  description: string | null;
  calculationType: DeductionCalculationType;
  ruleAmount: string | null;
  rulePercentage: string | null;
  isMandatory: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface DeductionTypeFormData {
    id?: string;
    name: string;
    description?: string | null;
    calculationType: DeductionCalculationType;
    ruleAmount?: string | null;
    rulePercentage?: string | null;
    isMandatory: boolean;
}

function DeductionTypesPage() {
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<DeductionTypeFormData | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchDeductionTypes = useCallback(async () => {
    // ... (logika fetch Anda tidak berubah)
    if (!accessToken) {
      setError('Token autentikasi tidak tersedia.');
      setIsLoading(false);
      return;
    }
    if (!API_BASE_URL) {
        setError('Konfigurasi URL API tidak ditemukan.');
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/deduction-types`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal mengambil data tipe potongan. Status: ${response.status}`);
      }
      const data: DeductionType[] = await response.json();
      setDeductionTypes(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, API_BASE_URL]);

  useEffect(() => {
    fetchDeductionTypes();
  }, [fetchDeductionTypes]);

  const handleAdd = () => {
    setEditingData(null);
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (item: DeductionType) => {
    // ... (logika Anda tidak berubah)
    const formData: DeductionTypeFormData = {
        id: item.id,
        name: item.name,
        description: item.description,
        calculationType: item.calculationType,
        ruleAmount: item.ruleAmount !== null ? String(item.ruleAmount) : null,
        rulePercentage: item.rulePercentage !== null ? String(item.rulePercentage) : null,
        isMandatory: item.isMandatory,
    };
    setEditingData(formData);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (id: string, name: string) => {
    // ... (logika Anda tidak berubah)
     if (!API_BASE_URL) {
        setError('Konfigurasi URL API tidak ditemukan.');
        return;
    }
    if (window.confirm(`Yakin ingin menghapus tipe potongan "${name}" (ID: ${id})?`)) {
      setError(null);
      if (!accessToken) { setError('Token tidak ditemukan.'); return; }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/deduction-types/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Gagal menghapus tipe potongan. Status: ${response.status}`);
        }
        alert(`Tipe potongan "${name}" berhasil dihapus.`);
        fetchDeductionTypes();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus.';
        setError(`Gagal menghapus: ${errorMessage}`);
      }
    }
  };

  const handleFormSubmit = async (formData: DeductionTypeFormData) => {
    // ... (logika Anda tidak berubah)
    if (!API_BASE_URL) {
        setError('Konfigurasi URL API tidak ditemukan.');
        setIsSubmitting(false);
        throw new Error('Konfigurasi URL API tidak ditemukan.');
    }
    setIsSubmitting(true);
    setError(null);
    if (!accessToken) {
      setError('Token tidak ditemukan.');
      setIsSubmitting(false);
      throw new Error('Token tidak ditemukan.');
    }

    const isEditMode = !!formData.id;
    const url = isEditMode ? `${API_BASE_URL}/admin/deduction-types/${formData.id}` : `${API_BASE_URL}/admin/deduction-types`;
    const method = isEditMode ? 'PUT' : 'POST';

    const bodyToSubmit = {
        name: formData.name,
        description: formData.description?.trim() === '' ? null : formData.description,
        calculationType: formData.calculationType,
        ruleAmount: formData.ruleAmount, // Biarkan backend menangani konversi ke Decimal jika perlu
        rulePercentage: formData.rulePercentage, // Sama
        isMandatory: formData.isMandatory,
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
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal ${isEditMode ? 'memperbarui' : 'menambah'} tipe potongan. Status: ${response.status}`);
      }
      alert(`Tipe potongan berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      setShowForm(false);
      fetchDeductionTypes();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat submit.';
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
  
  if (isLoading && !showForm) {
    return <div className="p-6 text-center text-slate-600">Memuat tipe potongan...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Manajemen Tipe Potongan</h1>
        <button
          onClick={handleAdd}
          className="mt-3 sm:mt-0 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-sm disabled:opacity-50"
          disabled={showForm || isLoading}
        >
          + Tambah Tipe Potongan
        </button>
      </div>

      {error && !showForm && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {showForm ? (
        <div className="bg-white p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            {editingData ? 'Edit Tipe Potongan' : 'Tambah Tipe Potongan Baru'}
          </h2>
          <DeductionTypeForm // Komponen ini juga perlu di-style dengan Tailwind
            initialData={editingData}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-700">Daftar Tipe Potongan</h3>
            <span className="text-sm text-slate-500">Total: {deductionTypes.length}</span>
          </div>
          {isLoading ? (
            <p className="p-6 text-center text-slate-500">Memuat data...</p>
          ) : deductionTypes.length === 0 ? (
            <p className="p-6 text-center text-slate-500">Tidak ada data tipe potongan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-3">Nama</th>
                    <th scope="col" className="px-6 py-3">Tipe Kalkulasi</th>
                    <th scope="col" className="px-6 py-3 text-right">Jumlah Aturan (Rp)</th>
                    <th scope="col" className="px-6 py-3 text-right">Persen Aturan (%)</th>
                    <th scope="col" className="px-6 py-3 text-center">Wajib?</th>
                    <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {deductionTypes.map((item) => (
                    <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{(item.calculationType || '').replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {item.ruleAmount !== null && item.ruleAmount !== undefined ? parseFloat(item.ruleAmount).toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {item.rulePercentage !== null && item.rulePercentage !== undefined ? `${parseFloat(item.rulePercentage)}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isMandatory ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.isMandatory ? 'Ya' : 'Tidak'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(item)}
                          className="font-medium text-sky-600 hover:text-sky-800 hover:underline mr-3 text-xs py-1 px-2 rounded bg-sky-100 hover:bg-sky-200 transition-colors"
                          disabled={showForm}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
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

export default DeductionTypesPage;