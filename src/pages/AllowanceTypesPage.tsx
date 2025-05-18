// src/pages/AllowanceTypesPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AllowanceTypeForm from '../components/AllowanceTypeForm'; // Anda perlu menata ulang komponen ini juga

interface AllowanceType {
  id: string;
  name: string;
  description: string | null;
  isFixed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AllowanceTypeFormData {
    id?: string;
    name: string;
    description?: string | null;
    isFixed: boolean;
}

function AllowanceTypesPage() {
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Untuk form
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<AllowanceTypeFormData | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchAllowanceTypes = useCallback(async () => {
    // ... (logika fetch data Anda tidak berubah)
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
      const response = await fetch(`${API_BASE_URL}/admin/allowance-types`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal mengambil data. Status: ${response.status}`);
      }
      const data: AllowanceType[] = await response.json();
      setAllowanceTypes(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, API_BASE_URL]);

  useEffect(() => {
    fetchAllowanceTypes();
  }, [fetchAllowanceTypes]);

  const handleAdd = () => {
    setEditingData(null);
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (item: AllowanceType) => {
    const formData: AllowanceTypeFormData = {
        id: item.id,
        name: item.name,
        description: item.description,
        isFixed: item.isFixed,
    };
    setEditingData(formData);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (id: string, name: string) => {
    // ... (logika delete Anda tidak berubah)
    if (!API_BASE_URL) {
        setError('Konfigurasi URL API tidak ditemukan.');
        return;
    }
    if (window.confirm(`Yakin ingin menghapus tipe tunjangan "${name}"?`)) {
      setError(null);
      if (!accessToken) { setError('Token tidak ditemukan.'); return; }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/allowance-types/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Gagal menghapus. Status: ${response.status}`);
        }
        alert(`Tipe tunjangan "${name}" berhasil dihapus.`);
        fetchAllowanceTypes(); // Refresh data
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        setError(`Gagal menghapus: ${errorMessage}`);
      }
    }
  };

  const handleFormSubmit = async (formData: AllowanceTypeFormData) => {
    // ... (logika submit form Anda tidak berubah, tapi pastikan form juga di-style)
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
    const url = isEditMode ? `${API_BASE_URL}/admin/allowance-types/${formData.id}` : `${API_BASE_URL}/admin/allowance-types`;
    const method = isEditMode ? 'PUT' : 'POST';

    const bodyToSubmit = {
        name: formData.name,
        description: formData.description?.trim() === '' ? null : formData.description,
        isFixed: formData.isFixed,
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
        throw new Error(errData.message || `Gagal submit. Status: ${response.status}`);
      }
      alert(`Tipe tunjangan berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      setShowForm(false);
      fetchAllowanceTypes(); // Refresh data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(`Gagal submit: ${errorMessage}`);
      throw err; // Lempar error agar UserForm bisa menangkapnya
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
    return <div className="p-6 text-center text-slate-600">Memuat tipe tunjangan...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Manajemen Tipe Tunjangan</h1>
        <button
          onClick={handleAdd}
          className="mt-3 sm:mt-0 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-sm disabled:opacity-50"
          disabled={showForm || isLoading}
        >
          + Tambah Tipe Tunjangan
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
            {editingData ? 'Edit Tipe Tunjangan' : 'Tambah Tipe Tunjangan Baru'}
          </h2>
          <AllowanceTypeForm // Komponen ini juga perlu di-style dengan Tailwind
            initialData={editingData}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-700">Daftar Tipe Tunjangan</h3>
            <span className="text-sm text-slate-500">Total: {allowanceTypes.length}</span>
          </div>
          {isLoading ? (
             <p className="p-6 text-center text-slate-500">Memuat data...</p>
          ) : allowanceTypes.length === 0 ? (
            <p className="p-6 text-center text-slate-500">Tidak ada data tipe tunjangan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-3">Nama</th>
                    <th scope="col" className="px-6 py-3">Deskripsi</th>
                    <th scope="col" className="px-6 py-3 text-center">Tetap?</th>
                    <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {allowanceTypes.map((item) => (
                    <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{item.name}</td>
                      <td className="px-6 py-4">{item.description || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isFixed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.isFixed ? 'Ya' : 'Tidak'}
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

export default AllowanceTypesPage;