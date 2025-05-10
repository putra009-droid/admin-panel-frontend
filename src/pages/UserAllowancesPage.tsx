// src/pages/UserAllowancesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserAllowanceForm from '../components/UserAllowanceForm'; // Pastikan path ini benar

// Ambil API_BASE_URL dari environment variable Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Tipe data untuk UserAllowance yang diterima dari API
interface UserAllowance {
  id: string;
  userId: string;
  allowanceTypeId: string;
  amount: string; // API mengembalikan string (hasil serialisasi Decimal)
  allowanceType: {
    id: string;
    name: string;
    isFixed: boolean;
    description?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Tipe data untuk Tipe Tunjangan (untuk dropdown di form)
interface AllowanceTypeOption {
  id: string;
  name: string;
  isFixed: boolean;
}

// Tipe data untuk data yang dikirim ke/dari UserAllowanceForm
interface UserAllowanceFormData {
    id?: string;
    allowanceTypeId: string;
    amount: string;
}

// Tipe untuk respons error umum dari API
interface ApiErrorResponse {
  message?: string;
  error?: string;
}


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
    if (!accessToken || !API_BASE_URL) return;
    console.log('UserAllowancesPage: Fetching available allowance types...');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/allowance-types`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as ApiErrorResponse;
        throw new Error(errData.message || errData.error || `Gagal mengambil tipe tunjangan. Status: ${response.status}`);
      }
      // Asumsi API mengembalikan array objek AllowanceType dengan id, name, isFixed
      const dataFromApi: AllowanceTypeOption[] = await response.json();
      setAvailableAllowanceTypes(dataFromApi || []);
      console.log('UserAllowancesPage: Available allowance types fetched:', dataFromApi);
    } catch (err: unknown) {
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
    setIsLoading(true);
    setError(null);
    console.log(`UserAllowancesPage: Fetching allowances for user ID: ${userId}`);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/allowances`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as ApiErrorResponse;
        throw new Error(errData.message || errData.error || `Gagal mengambil tunjangan pengguna. Status: ${response.status}`);
      }
      const data: { data: UserAllowance[] } = await response.json(); // Asumsi API membungkus dalam 'data'
      setUserAllowances(data.data || []);
      console.log('UserAllowancesPage: User allowances fetched:', data.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
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
    setEditingData(null);
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (item: UserAllowance) => {
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
        amount: formData.amount, // Form mengirim string, backend akan mengkonversi ke Decimal
    };

    console.log(`Submitting user allowance data (${method}) to ${url}:`, bodyToSubmit);

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
    return <div style={styles.container}>User ID tidak ditemukan di URL.</div>;
  }
  if (isLoading && !showForm) {
    return <div style={styles.container}>Memuat data tunjangan untuk pengguna...</div>;
  }
  if (error && !showForm) {
    return <div style={styles.container}><p style={styles.errorText}>Error: {error}</p></div>;
  }

  return (
    <div style={styles.container}>
      <Link to="/users" style={styles.backLink}>
        &larr; Kembali ke Manajemen Pengguna
      </Link>
      <h2 style={styles.title}>Kelola Tunjangan untuk: {userName || 'Memuat...'}</h2>
      
      <div style={styles.actionBar}>
        <p>Total Tunjangan Ditetapkan: {userAllowances.length}</p>
        <button onClick={handleAdd} style={styles.addButton} disabled={showForm || isLoading}>
          + Tambah Tunjangan Baru
        </button>
      </div>

      {isLoading && !showForm && <p>Memuat data...</p>}
      {!isLoading && (
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeader}>Nama Tunjangan</th>
              <th style={styles.tableHeader}>Deskripsi Tipe</th>
              <th style={styles.tableHeader}>Jumlah (Rp)</th>
              <th style={styles.tableHeader}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {userAllowances.length === 0 ? (
              <tr><td colSpan={4} style={styles.tableCellCenter}>Tidak ada tunjangan yang ditetapkan untuk pengguna ini.</td></tr>
            ) : (
              userAllowances.map((ua, index) => (
                <tr key={ua.id} style={{...styles.tableRow, backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'}}>
                  <td style={styles.tableCell}>{ua.allowanceType?.name || 'Tipe Dihapus'}</td>
                  <td style={styles.tableCell}>{ua.allowanceType?.description || '-'}</td>
                  <td style={styles.tableCellRight}>{parseFloat(ua.amount).toLocaleString('id-ID')}</td>
                  <td style={styles.tableCellCenter}>
                    <button onClick={() => handleEdit(ua)} style={{ ...styles.actionButton, ...styles.editButton }} disabled={showForm}>Edit</button>
                    <button onClick={() => handleDelete(ua.id, ua.allowanceType?.name || 'Tunjangan Ini')} style={{ ...styles.actionButton, ...styles.deleteButton }} disabled={showForm}>Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {showForm && userId && (
        <UserAllowanceForm
          // userId={userId} // Tidak perlu dikirim lagi
          initialData={editingData}
          availableAllowanceTypes={availableAllowanceTypes}
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
  backLink: { marginBottom: '20px', display: 'inline-block', color: '#007bff', textDecoration: 'none' },
  title: { marginBottom: '20px', color: '#333' },
  actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  addButton: { padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px', border: '1px solid #dee2e6' },
  tableHead: { backgroundColor: '#f8f9fa' },
  tableHeader: { padding: '10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' },
  tableRow: {},
  tableCell: { padding: '10px', border: '1px solid #dee2e6', verticalAlign: 'middle' },
  tableCellCenter: { padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', verticalAlign: 'middle' },
  tableCellRight: { padding: '10px', border: '1px solid #dee2e6', textAlign: 'right', verticalAlign: 'middle' },
  actionButton: { marginRight: '5px', padding: '4px 8px', fontSize: '12px', border: 'none', borderRadius: '3px', cursor: 'pointer', color: 'white' },
  editButton: { backgroundColor: '#007bff' },
  deleteButton: { backgroundColor: '#dc3545' },
  errorText: { color: '#721c24', border: '1px solid #f5c6cb', padding: '10px', borderRadius: '4px', backgroundColor: '#f8d7da', marginBottom: '15px' },
};

export default UserAllowancesPage;
