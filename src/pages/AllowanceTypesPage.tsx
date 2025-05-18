// src/pages/AllowanceTypesPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AllowanceTypeForm from '../components/AllowanceTypeForm'; // Anda perlu menata ulang komponen ini juga
import TableWrapper from '../components/ui/TableWrapper';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';

interface AllowanceType { id: string; name: string; description: string | null; isFixed: boolean; }
interface AllowanceTypeFormData { id?: string; name: string; description?: string | null; isFixed: boolean; }

function AllowanceTypesPage() {
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Untuk pesan sukses
  const { accessToken } = useAuth();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<AllowanceTypeFormData | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchAllowanceTypes = useCallback(async () => {
    if (!accessToken || !API_BASE_URL) { setError('Token atau URL API tidak tersedia.'); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/allowance-types`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal mengambil data. Status: ${response.status}`);
      }
      const data: AllowanceType[] = await response.json();
      setAllowanceTypes(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
    } finally { setIsLoading(false); }
  }, [accessToken, API_BASE_URL]);

  useEffect(() => { fetchAllowanceTypes(); }, [fetchAllowanceTypes]);

  const handleAdd = () => { setEditingData(null); setShowForm(true); setError(null); setSuccessMessage(null); };
  const handleEdit = (item: AllowanceType) => { setEditingData({ id: item.id, name: item.name, description: item.description, isFixed: item.isFixed }); setShowForm(true); setError(null); setSuccessMessage(null);};
  
  const handleDelete = async (id: string, name: string) => {
    if (!API_BASE_URL) { setError('Konfigurasi URL API tidak ditemukan.'); return; }
    if (window.confirm(`Yakin ingin menghapus tipe tunjangan "${name}"?`)) {
      setError(null); setSuccessMessage(null);
      if (!accessToken) { setError('Token tidak ditemukan.'); return; }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/allowance-types/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Gagal menghapus. Status: ${response.status}`);
        }
        setSuccessMessage(`Tipe tunjangan "${name}" berhasil dihapus.`);
        fetchAllowanceTypes();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        setError(`Gagal menghapus: ${errorMessage}`);
      }
    }
  };

  const handleFormSubmit = async (formData: AllowanceTypeFormData) => {
    if (!API_BASE_URL) { setError('Konfigurasi URL API tidak ditemukan.'); setIsSubmitting(false); throw new Error('Konfigurasi URL API tidak ditemukan.'); }
    setIsSubmitting(true); setError(null); setSuccessMessage(null);
    if (!accessToken) { setError('Token tidak ditemukan.'); setIsSubmitting(false); throw new Error('Token tidak ditemukan.'); }
    const isEditMode = !!formData.id;
    const url = isEditMode ? `${API_BASE_URL}/admin/allowance-types/${formData.id}` : `${API_BASE_URL}/admin/allowance-types`;
    const method = isEditMode ? 'PUT' : 'POST';
    const bodyToSubmit = { name: formData.name, description: formData.description?.trim() === '' ? null : formData.description, isFixed: formData.isFixed };
    try {
      const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }, body: JSON.stringify(bodyToSubmit) });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal submit. Status: ${response.status}`);
      }
      setSuccessMessage(`Tipe tunjangan berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      setShowForm(false);
      fetchAllowanceTypes();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(`Gagal submit: ${errorMessage}`);
      throw err;
    } finally { setIsSubmitting(false); }
  };

  const handleCancelForm = () => { setShowForm(false); setEditingData(null); setError(null); setSuccessMessage(null); };

  if (isLoading && !showForm && allowanceTypes.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6">Manajemen Tipe Tunjangan</h1>
        <TableWrapper isLoading={true} loadingMessage="Memuat tipe tunjangan..."><div></div></TableWrapper>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Manajemen Tipe Tunjangan</h1>

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
        <Card title={editingData ? 'Edit Tipe Tunjangan' : 'Tambah Tipe Tunjangan Baru'} className="max-w-2xl mx-auto">
          {error && ( // Error spesifik form
             <Alert type="error" title="Gagal Submit" className="mb-4" onClose={() => setError(null)}>
                {error}
             </Alert>
          )}
          <AllowanceTypeForm
            initialData={editingData}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        </Card>
      ) : (
        <TableWrapper
          isLoading={isLoading}
          isEmpty={!isLoading && allowanceTypes.length === 0}
          emptyMessage="Tidak ada data tipe tunjangan."
          headerContent={
            <button
              onClick={handleAdd}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-sm disabled:opacity-50"
              disabled={isLoading}
            >
              + Tambah Tipe Tunjangan
            </button>
          }
        >
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
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="font-medium text-red-600 hover:text-red-800 hover:underline text-xs py-1 px-2 rounded bg-red-100 hover:bg-red-200 transition-colors"
                    >
                      Hapus
                    </button>
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

export default AllowanceTypesPage;