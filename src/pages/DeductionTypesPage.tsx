// src/pages/DeductionTypesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import DeductionTypeForm from '../components/DeductionTypeForm';
// Impor TIPE DeductionCalculationType secara eksplisit
import type { DeductionCalculationType } from '../types/deductionTypes';
// Kita tidak perlu mengimpor DeductionCalculationTypeValue atau AllDeductionCalculationTypes di sini
// karena halaman ini hanya menggunakan DeductionCalculationType sebagai TIPE dalam interface
// dan menerima string dari API yang sudah sesuai dengan tipe string literal tersebut.

// Tipe data untuk Tipe Potongan dari API
interface DeductionType {
  id: string;
  name: string;
  description: string | null;
  calculationType: DeductionCalculationType; // Menggunakan TIPE yang diimpor
  ruleAmount: string | null; // API mengembalikan ini sebagai string atau null
  rulePercentage: string | null; // API mengembalikan ini sebagai string atau null
  isMandatory: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Tipe data untuk data yang dikirim ke form (cocokkan dengan DeductionTypeForm)
// Ini juga menggunakan DeductionCalculationType sebagai TIPE
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

  const fetchDeductionTypes = useCallback(async () => {
    if (!accessToken) {
      setError('Token autentikasi tidak tersedia. Silakan login ulang.');
      setIsLoading(false);
      console.error('DeductionTypesPage: Token tidak ditemukan dari context.');
      return;
    }
    setIsLoading(true);
    setError(null);
    console.log('DeductionTypesPage: Fetching deduction types...');
    try {
      const response = await fetch('/api/admin/deduction-types', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal mengambil data tipe potongan. Status: ${response.status}`);
      }
      const data: DeductionType[] = await response.json();
      setDeductionTypes(data);
      console.log('DeductionTypesPage: Deduction types fetched successfully:', data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchDeductionTypes();
  }, [fetchDeductionTypes]);

  const handleAdd = () => {
    setEditingData(null);
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (item: DeductionType) => {
    const formData: DeductionTypeFormData = {
        id: item.id,
        name: item.name,
        description: item.description,
        calculationType: item.calculationType, // item.calculationType sudah bertipe DeductionCalculationType (string literal)
        ruleAmount: item.ruleAmount !== null ? String(item.ruleAmount) : null,
        rulePercentage: item.rulePercentage !== null ? String(item.rulePercentage) : null,
        isMandatory: item.isMandatory,
    };
    setEditingData(formData);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus tipe potongan "${name}" (ID: ${id})?`)) {
      setError(null);
      if (!accessToken) { setError('Token tidak ditemukan.'); return; }
      try {
        const response = await fetch(`/api/admin/deduction-types/${id}`, {
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
    setIsSubmitting(true);
    setError(null);
    if (!accessToken) {
      setError('Token tidak ditemukan.');
      setIsSubmitting(false);
      throw new Error('Token tidak ditemukan.');
    }

    const isEditMode = !!formData.id;
    const url = isEditMode ? `/api/admin/deduction-types/${formData.id}` : '/api/admin/deduction-types';
    const method = isEditMode ? 'PUT' : 'POST';

    // Data yang dikirim ke backend
    const bodyToSubmit = {
        name: formData.name,
        description: formData.description?.trim() === '' ? null : formData.description,
        calculationType: formData.calculationType, // Ini sudah string literal yang valid
        ruleAmount: formData.ruleAmount, // String atau null
        rulePercentage: formData.rulePercentage, // String atau null
        isMandatory: formData.isMandatory,
    };

    console.log(`Submitting deduction type data (${method}) to ${url}:`, bodyToSubmit);

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
    return <div style={styles.container}>Memuat tipe potongan...</div>;
  }
  if (error && !showForm) {
    return <div style={styles.container}><p style={styles.errorText}>Error: {error}</p></div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Manajemen Tipe Potongan</h2>
      <div style={styles.actionBar}>
        <p>Total Tipe Potongan: {deductionTypes.length}</p>
        <button onClick={handleAdd} style={styles.addButton} disabled={showForm || isLoading}>
          + Tambah Tipe Potongan
        </button>
      </div>

      {isLoading && !showForm && <p>Memuat data...</p>}
      {!isLoading && (
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeader}>Nama</th>
              <th style={styles.tableHeader}>Tipe Kalkulasi</th>
              <th style={styles.tableHeader}>Jumlah Aturan (Rp)</th>
              <th style={styles.tableHeader}>Persen Aturan (%)</th>
              <th style={styles.tableHeader}>Wajib?</th>
              <th style={styles.tableHeader}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {deductionTypes.length === 0 ? (
              <tr><td colSpan={6} style={styles.tableCellCenter}>Tidak ada data tipe potongan.</td></tr>
            ) : (
              deductionTypes.map((item) => (
                <tr key={item.id} style={styles.tableRow}>
                  <td style={styles.tableCell}>{item.name}</td>
                  <td style={styles.tableCell}>{item.calculationType.replace(/_/g, ' ')}</td>
                  <td style={styles.tableCellRight}>{item.ruleAmount !== null ? parseFloat(item.ruleAmount).toLocaleString('id-ID') : '-'}</td>
                  <td style={styles.tableCellRight}>{item.rulePercentage !== null ? `${parseFloat(item.rulePercentage)}%` : '-'}</td>
                  <td style={styles.tableCellCenter}>{item.isMandatory ? 'Ya' : 'Tidak'}</td>
                  <td style={styles.tableCellCenter}>
                    <button onClick={() => handleEdit(item)} style={{ ...styles.actionButton, ...styles.editButton }} disabled={showForm}>Edit</button>
                    <button onClick={() => handleDelete(item.id, item.name)} style={{ ...styles.actionButton, ...styles.deleteButton }} disabled={showForm}>Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <DeductionTypeForm
          initialData={editingData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', fontFamily: 'sans-serif' },
  title: { marginBottom: '20px', color: '#333' },
  actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  addButton: { padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px', border: '1px solid #dee2e6' },
  tableHead: { backgroundColor: '#f8f9fa' },
  tableHeader: { padding: '10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' },
  tableRow: { /* Styling untuk zebra-striping bisa ditambahkan dengan CSS */ },
  tableCell: { padding: '10px', border: '1px solid #dee2e6', verticalAlign: 'middle' },
  tableCellCenter: { padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', verticalAlign: 'middle' },
  tableCellRight: { padding: '10px', border: '1px solid #dee2e6', textAlign: 'right', verticalAlign: 'middle' },
  actionButton: { marginRight: '5px', padding: '4px 8px', fontSize: '12px', border: 'none', borderRadius: '3px', cursor: 'pointer', color: 'white' },
  editButton: { backgroundColor: '#007bff' },
  deleteButton: { backgroundColor: '#dc3545' },
  errorText: { color: '#721c24', border: '1px solid #f5c6cb', padding: '10px', borderRadius: '4px', backgroundColor: '#f8d7da', marginBottom: '15px' },
};

export default DeductionTypesPage;
