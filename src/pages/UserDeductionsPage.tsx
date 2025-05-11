// src/pages/UserDeductionsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserDeductionForm from '../components/UserDeductionForm';
import type { DeductionCalculationType } from '../types/deductionTypes';
import { DeductionCalculationTypeValue } from '../types/deductionTypes'; // Untuk logika di handleFormSubmit

// Ambil API_BASE_URL dari environment variable Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Tipe data untuk UserDeduction yang diterima dari API
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

// Tipe data untuk Tipe Potongan (untuk dropdown di form)
interface DeductionTypeOption {
  id: string;
  name: string;
  calculationType: DeductionCalculationType;
}

// Tipe data untuk data yang dikirim ke/dari UserDeductionForm
interface UserDeductionFormData {
    id?: string;
    deductionTypeId: string;
    assignedAmount?: string | null;
    assignedPercentage?: string | null;
}

// Tipe untuk respons error umum dari API
interface ApiErrorResponse {
  message?: string;
  error?: string;
}

// Tipe untuk respons API GET /api/admin/users/:userId/deductions
// Sekarang kita harapkan array UserDeduction langsung
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
    if (!accessToken || !API_BASE_URL) return;
    console.log('UserDeductionsPage: Fetching available deduction types...');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/deduction-types`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as ApiErrorResponse;
        throw new Error(errData.message || errData.error || `Gagal mengambil tipe potongan. Status: ${response.status}`);
      }
      // Asumsi API mengembalikan array objek DeductionType dengan id, name, calculationType
      const dataFromApi: Array<{id: string, name: string, calculationType: DeductionCalculationType}> = await response.json();
      setAvailableDeductionTypes((dataFromApi || []).map(dt => ({
        id: dt.id,
        name: dt.name,
        calculationType: dt.calculationType,
      })));
      console.log('UserDeductionsPage: Available deduction types fetched:', dataFromApi);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil tipe potongan.';
      setError(prev => prev ? `${prev}\n${errorMessage}` : errorMessage);
    }
  }, [accessToken, API_BASE_URL]);

  const fetchUserDeductions = useCallback(async () => {
    if (!accessToken || !userId || !API_BASE_URL) {
      setError('Parameter tidak lengkap atau token/URL API tidak tersedia.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    console.log(`UserDeductionsPage: Fetching deductions for user ID: ${userId} from ${API_BASE_URL}/admin/users/${userId}/deductions`);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/deductions`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as ApiErrorResponse;
        throw new Error(errData.message || errData.error || `Gagal mengambil potongan pengguna. Status: ${response.status}`);
      }
      
      // **PERBAIKAN PARSING RESPONS: Harapkan array langsung**
      const responseData = await response.json() as UserDeductionsApiResponse; // Tipe sekarang UserDeduction[]
      if (Array.isArray(responseData)) {
        setUserDeductions(responseData);
        console.log('UserDeductionsPage: User deductions fetched (direct array):', responseData);
      } else {
        // Ini seharusnya tidak terjadi jika API mengembalikan array
        console.warn('UserDeductionsPage: Expected an array for user deductions, but received:', responseData);
        setUserDeductions([]); // Default ke array kosong jika format tidak sesuai
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
    if (userId && accessToken) {
      fetchUserName();
      fetchAvailableDeductionTypes();
      fetchUserDeductions();
    }
  }, [userId, accessToken, fetchUserName, fetchAvailableDeductionTypes, fetchUserDeductions]);

  const handleAdd = () => {
    if (availableDeductionTypes.length === 0) {
        alert("Tidak ada tipe potongan yang tersedia. Tambahkan dulu di 'Kelola Tipe Potongan'.");
        return;
    }
    setEditingData(null);
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (item: UserDeduction) => {
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
          const errData = await response.json().catch(() => ({})) as ApiErrorResponse;
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
        } else {
            bodyToSubmit.assignedAmount = null;
            bodyToSubmit.assignedPercentage = null;
        }
    } else {
        console.error("Tipe potongan yang dipilih tidak ditemukan.");
        setError("Tipe potongan yang dipilih tidak valid.");
        setIsSubmitting(false);
        throw new Error("Tipe potongan yang dipilih tidak valid.");
    }

    console.log(`Submitting user deduction data (${method}) to ${url}:`, bodyToSubmit);

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
    return <div style={styles.container}>User ID tidak ditemukan di URL.</div>;
  }
  if (isLoading && !showForm) {
    return <div style={styles.container}>Memuat data potongan untuk pengguna...</div>;
  }
  if (error && !showForm) {
    return <div style={styles.container}><p style={styles.errorText}>Error: {error}</p></div>;
  }

  return (
    <div style={styles.container}>
      <Link to="/users" style={styles.backLink}>
        ← Kembali ke Manajemen Pengguna
      </Link>
      <h2 style={styles.title}>Kelola Potongan untuk: {userName || 'Memuat...'}</h2>
      
      <div style={styles.actionBar}>
        <p>Total Potongan Ditetapkan: {userDeductions.length}</p>
        <button onClick={handleAdd} style={styles.addButton} disabled={showForm || isLoading}>
          + Tambah Potongan Baru
        </button>
      </div>

      {isLoading && !showForm && <p>Memuat data...</p>}
      {!isLoading && (
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeader}>Nama Potongan</th>
              <th style={styles.tableHeader}>Tipe Kalkulasi</th>
              <th style={styles.tableHeader}>Jumlah (Rp)</th>
              <th style={styles.tableHeader}>Persentase (%)</th>
              <th style={styles.tableHeader}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {userDeductions.length === 0 ? (
              <tr><td colSpan={5} style={styles.tableCellCenter}>Tidak ada potongan yang ditetapkan untuk pengguna ini.</td></tr>
            ) : (
              userDeductions.map((ud, index) => (
                <tr key={ud.id} style={{...styles.tableRow, backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'}}>
                  <td style={styles.tableCell}>{ud.deductionType?.name || 'Tipe Dihapus'}</td>
                  <td style={styles.tableCell}>{ud.deductionType?.calculationType.replace(/_/g, ' ') || '-'}</td>
                  <td style={styles.tableCellRight}>{ud.assignedAmount ? parseFloat(ud.assignedAmount).toLocaleString('id-ID') : '-'}</td>
                  <td style={styles.tableCellRight}>{ud.assignedPercentage ? `${parseFloat(ud.assignedPercentage)}%` : '-'}</td>
                  <td style={styles.tableCellCenter}>
                    <button onClick={() => handleEdit(ud)} style={{ ...styles.actionButton, ...styles.editButton }} disabled={showForm}>Edit</button>
                    <button onClick={() => handleDelete(ud.id, ud.deductionType?.name || 'Potongan Ini')} style={{ ...styles.actionButton, ...styles.deleteButton }} disabled={showForm}>Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {showForm && userId && (
        <UserDeductionForm
          initialData={editingData}
          availableDeductionTypes={availableDeductionTypes}
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

export default UserDeductionsPage;
