// src/pages/AllowanceTypesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AllowanceTypeForm from '../components/AllowanceTypeForm'; // Pastikan path ini benar

// Tipe data untuk Tipe Tunjangan dari API
interface AllowanceType {
  id: string;
  name: string;
  description: string | null;
  isFixed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Tipe data untuk form (cocokkan dengan AllowanceTypeForm)
interface AllowanceTypeFormData {
    id?: string;
    name: string;
    description?: string | null;
    isFixed: boolean;
}

function AllowanceTypesPage() {
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<AllowanceTypeFormData | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchAllowanceTypes = useCallback(async () => {
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

  if (isLoading && !showForm) return <div style={styles.container}>Memuat tipe tunjangan...</div>;
  if (error && !showForm) return <div style={styles.container}><p style={styles.errorText}>Error: {error}</p></div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Manajemen Tipe Tunjangan</h2>
      <div style={styles.actionBar}>
        <p>Total Tipe: {allowanceTypes.length}</p>
        <button onClick={handleAdd} style={styles.addButton} disabled={showForm || isLoading}>
          + Tambah Tipe Tunjangan
        </button>
      </div>

      {isLoading && !showForm && <p>Memuat data...</p>}
      {!isLoading && (
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeader}>Nama</th>
              <th style={styles.tableHeader}>Deskripsi</th>
              <th style={styles.tableHeader}>Tetap?</th>
              <th style={styles.tableHeader}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {allowanceTypes.length === 0 ? (
              <tr><td colSpan={4} style={styles.tableCellCenter}>Tidak ada data.</td></tr>
            ) : (
              allowanceTypes.map((item) => (
                <tr key={item.id} style={{...styles.tableRow, backgroundColor: allowanceTypes.indexOf(item) % 2 === 0 ? '#f9f9f9' : 'white'}}>
                  <td style={styles.tableCell}>{item.name}</td>
                  <td style={styles.tableCell}>{item.description || '-'}</td>
                  <td style={styles.tableCellCenter}>{item.isFixed ? 'Ya' : 'Tidak'}</td>
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
        <AllowanceTypeForm
          initialData={editingData}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}

// Styling
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', fontFamily: 'sans-serif' },
  title: { marginBottom: '20px', color: '#333' },
  actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  addButton: { padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px', border: '1px solid #dee2e6' },
  tableHead: { backgroundColor: '#f8f9fa' },
  tableHeader: { padding: '10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' },
  tableRow: { /* Styling dasar untuk baris */ },
  tableCell: { padding: '10px', border: '1px solid #dee2e6', verticalAlign: 'middle' },
  tableCellCenter: { padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', verticalAlign: 'middle' },
  actionButton: { marginRight: '5px', padding: '4px 8px', fontSize: '12px', border: 'none', borderRadius: '3px', cursor: 'pointer', color: 'white' },
  editButton: { backgroundColor: '#007bff' },
  deleteButton: { backgroundColor: '#dc3545' },
  errorText: { color: '#721c24', border: '1px solid #f5c6cb', padding: '10px', borderRadius: '4px', backgroundColor: '#f8d7da', marginBottom: '15px' },
};

export default AllowanceTypesPage;
