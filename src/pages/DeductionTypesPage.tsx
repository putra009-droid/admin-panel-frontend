// src/pages/DeductionTypesPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import DeductionTypeForm from '../components/DeductionTypeForm'; // Anda perlu menata ulang komponen ini juga
import type { DeductionCalculationType } from '../types/deductionTypes';
import TableWrapper from '../components/ui/TableWrapper';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';

interface DeductionType { id: string; name: string; description: string | null; calculationType: DeductionCalculationType; ruleAmount: string | null; rulePercentage: string | null; isMandatory: boolean; }
interface DeductionTypeFormData { id?: string; name: string; description?: string | null; calculationType: DeductionCalculationType; ruleAmount?: string | null; rulePercentage?: string | null; isMandatory: boolean; }

function DeductionTypesPage() {
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { accessToken } = useAuth();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<DeductionTypeFormData | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchDeductionTypes = useCallback(async () => {
    if (!accessToken || !API_BASE_URL) { setError('Token atau URL API tidak tersedia.'); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/deduction-types`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal mengambil data tipe potongan. Status: ${response.status}`);
      }
      const data: DeductionType[] = await response.json();
      setDeductionTypes(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data.';
      setError(errorMessage);
    } finally { setIsLoading(false); }
  }, [accessToken, API_BASE_URL]);

  useEffect(() => { fetchDeductionTypes(); }, [fetchDeductionTypes]);

  const handleAdd = () => { setEditingData(null); setShowForm(true); setError(null); setSuccessMessage(null); };
  const handleEdit = (item: DeductionType) => { setEditingData({ id: item.id, name: item.name, description: item.description, calculationType: item.calculationType, ruleAmount: item.ruleAmount !== null ? String(item.ruleAmount) : null, rulePercentage: item.rulePercentage !== null ? String(item.rulePercentage) : null, isMandatory: item.isMandatory }); setShowForm(true); setError(null); setSuccessMessage(null); };

  const handleDelete = async (id: string, name: string) => {
    if (!API_BASE_URL) { setError('Konfigurasi URL API tidak ditemukan.'); return; }
    if (window.confirm(`Yakin ingin menghapus tipe potongan "${name}" (ID: ${id})?`)) {
      setError(null); setSuccessMessage(null);
      if (!accessToken) { setError('Token tidak ditemukan.'); return; }
      try {
        const response = await fetch(`${API_BASE_URL}/admin/deduction-types/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Gagal menghapus tipe potongan. Status: ${response.status}`);
        }
        setSuccessMessage(`Tipe potongan "${name}" berhasil dihapus.`);
        fetchDeductionTypes();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus.';
        setError(`Gagal menghapus: ${errorMessage}`);
      }
    }
  };

  const handleFormSubmit = async (formData: DeductionTypeFormData) => {
    if (!API_BASE_URL) { setError('Konfigurasi URL API tidak ditemukan.'); setIsSubmitting(false); throw new Error('Konfigurasi URL API tidak ditemukan.'); }
    setIsSubmitting(true); setError(null); setSuccessMessage(null);
    if (!accessToken) { setError('Token tidak ditemukan.'); setIsSubmitting(false); throw new Error('Token tidak ditemukan.'); }
    const isEditMode = !!formData.id;
    const url = isEditMode ? `${API_BASE_URL}/admin/deduction-types/${formData.id}` : `${API_BASE_URL}/admin/deduction-types`;
    const method = isEditMode ? 'PUT' : 'POST';
    const bodyToSubmit = { name: formData.name, description: formData.description?.trim() === '' ? null : formData.description, calculationType: formData.calculationType, ruleAmount: formData.ruleAmount, rulePercentage: formData.rulePercentage, isMandatory: formData.isMandatory };
    try {
      const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }, body: JSON.stringify(bodyToSubmit) });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal ${isEditMode ? 'memperbarui' : 'menambah'} tipe potongan. Status: ${response.status}`);
      }
      setSuccessMessage(`Tipe potongan berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      setShowForm(false);
      fetchDeductionTypes();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat submit.';
      setError(`Gagal submit: ${errorMessage}`);
      throw err;
    } finally { setIsSubmitting(false); }
  };

  const handleCancelForm = () => { setShowForm(false); setEditingData(null); setError(null); setSuccessMessage(null); };

  if (isLoading && !showForm && deductionTypes.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6">Manajemen Tipe Potongan</h1>
        <TableWrapper isLoading={true} loadingMessage="Memuat tipe potongan..."><div></div></TableWrapper>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Manajemen Tipe Potongan</h1>

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
        <Card title={editingData ? 'Edit Tipe Potongan' : 'Tambah Tipe Potongan Baru'} className="max-w-2xl mx-auto">
          {error && (
             <Alert type="error" title="Gagal Submit" className="mb-4" onClose={() => setError(null)}>
                {error}
             </Alert>
          )}
          <DeductionTypeForm
            initialData={editingData}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        </Card>
      ) : (
        <TableWrapper
          isLoading={isLoading}
          isEmpty={!isLoading && deductionTypes.length === 0}
          emptyMessage="Tidak ada data tipe potongan."
          headerContent={
            <button
              onClick={handleAdd}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-sm disabled:opacity-50"
              disabled={isLoading}
            >
              + Tambah Tipe Potongan
            </button>
          }
        >
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

export default DeductionTypesPage;