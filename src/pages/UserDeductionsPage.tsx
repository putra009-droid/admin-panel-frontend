// src/pages/UserDeductionsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import useParams untuk mengambil userId dari URL
import { useAuth } from '../context/AuthContext';
import UserDeductionForm from '../components/UserDeductionForm'; // Impor form yang sudah kita buat
// Impor TIPE DeductionCalculationType dan NILAI DeductionCalculationTypeValue
import type { DeductionCalculationType } from '../types/deductionTypes';
import { DeductionCalculationTypeValue } from '../types/deductionTypes';

// Tipe data untuk UserDeduction yang diterima dari API
interface UserDeduction {
  id: string; // ID dari UserDeduction
  userId: string;
  deductionTypeId: string;
  // Nilai ini akan spesifik berdasarkan calculationType dari DeductionType terkait
  assignedAmount: string | null; // API mungkin mengembalikan string (hasil serialisasi Decimal)
  assignedPercentage: string | null; // API mungkin mengembalikan string
  deductionType: { // Detail dari DeductionType
    id: string;
    name: string;
    calculationType: DeductionCalculationType; // Ini adalah tipe string literal
    description?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Tipe data untuk Tipe Potongan (untuk dropdown di form)
interface DeductionTypeOption {
  id: string;
  name: string;
  calculationType: DeductionCalculationType; // Ini adalah tipe string literal
}

// Tipe data untuk data yang dikirim ke/dari UserDeductionForm
interface UserDeductionFormData {
    id?: string; // ID UserDeduction (hanya ada saat edit)
    deductionTypeId: string;
    assignedAmount?: string | null;
    assignedPercentage?: string | null;
}

function UserDeductionsPage() {
  const { userId } = useParams<{ userId: string }>(); // Ambil userId dari parameter URL
  const { accessToken } = useAuth();

  const [userName, setUserName] = useState<string>(''); // Untuk menampilkan nama pengguna
  const [userDeductions, setUserDeductions] = useState<UserDeduction[]>([]);
  const [availableDeductionTypes, setAvailableDeductionTypes] = useState<DeductionTypeOption[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading untuk data utama halaman
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Loading untuk submit form
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<UserDeductionFormData | null>(null);

  // Fungsi untuk mengambil nama pengguna
  const fetchUserName = useCallback(async () => {
    if (!accessToken || !userId) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('Gagal mengambil data pengguna.');
      const userData = await response.json();
      setUserName(userData.name || `User ID: ${userId}`);
    } catch (err) {
      console.error("Gagal mengambil nama pengguna:", err);
      setUserName(`User ID: ${userId}`); // Fallback jika gagal
    }
  }, [accessToken, userId]);

  // Fungsi untuk mengambil semua tipe potongan yang tersedia (untuk dropdown form)
  const fetchAvailableDeductionTypes = useCallback(async () => {
    if (!accessToken) return;
    console.log('UserDeductionsPage: Fetching available deduction types...');
    try {
      const response = await fetch('/api/admin/deduction-types', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal mengambil tipe potongan. Status: ${response.status}`);
      }
      // Ambil hanya field yang diperlukan untuk DeductionTypeOption
      const dataFromApi: Array<{id: string, name: string, calculationType: DeductionCalculationType}> = await response.json();
      setAvailableDeductionTypes(dataFromApi.map(dt => ({
        id: dt.id,
        name: dt.name,
        calculationType: dt.calculationType,
      })));
      console.log('UserDeductionsPage: Available deduction types fetched:', dataFromApi);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil tipe potongan.';
      setError(prev => prev ? `${prev}\n${errorMessage}` : errorMessage);
    }
  }, [accessToken]);

  // Fungsi untuk mengambil potongan yang sudah ditetapkan untuk pengguna ini
  const fetchUserDeductions = useCallback(async () => {
    if (!accessToken || !userId) {
      setError('Parameter tidak lengkap atau token tidak tersedia.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    console.log(`UserDeductionsPage: Fetching deductions for user ID: ${userId}`);
    try {
      const response = await fetch(`/api/admin/users/${userId}/deductions`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal mengambil potongan pengguna. Status: ${response.status}`);
      }
      const data: UserDeduction[] = await response.json();
      setUserDeductions(data);
      console.log('UserDeductionsPage: User deductions fetched:', data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId]);

  // Ambil semua data yang diperlukan saat komponen dimuat atau dependensi berubah
  useEffect(() => {
    if (userId && accessToken) {
      fetchUserName();
      fetchAvailableDeductionTypes();
      fetchUserDeductions();
    }
  }, [userId, accessToken, fetchUserName, fetchAvailableDeductionTypes, fetchUserDeductions]);

  const handleAdd = () => {
    if (availableDeductionTypes.length === 0) {
        alert("Tidak ada tipe potongan yang tersedia untuk ditambahkan. Silakan tambahkan tipe potongan terlebih dahulu di menu 'Kelola Tipe Potongan'.");
        return;
    }
    setEditingData(null);
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (item: UserDeduction) => {
    const formData: UserDeductionFormData = {
      id: item.id, // ID dari UserDeduction
      deductionTypeId: item.deductionTypeId,
      assignedAmount: item.assignedAmount !== null ? String(item.assignedAmount) : null,
      assignedPercentage: item.assignedPercentage !== null ? String(item.assignedPercentage) : null,
    };
    setEditingData(formData);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (userDeductionId: string, deductionName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus potongan "${deductionName}" untuk pengguna ini?`)) {
      setError(null);
      if (!accessToken || !userId) { setError('Token atau User ID tidak ditemukan.'); return; }
      try {
        const response = await fetch(`/api/admin/users/${userId}/deductions/${userDeductionId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Gagal menghapus potongan. Status: ${response.status}`);
        }
        alert(`Potongan "${deductionName}" berhasil dihapus.`);
        fetchUserDeductions(); // Refresh data
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        setError(`Gagal menghapus: ${errorMessage}`);
      }
    }
  };

  const handleFormSubmit = async (formData: UserDeductionFormData) => {
    setIsSubmitting(true);
    setError(null);
    if (!accessToken || !userId) {
      setError('Token atau User ID tidak ditemukan.');
      setIsSubmitting(false);
      throw new Error('Token atau User ID tidak ditemukan.');
    }

    const isEditMode = !!formData.id;
    const url = isEditMode 
        ? `/api/admin/users/${userId}/deductions/${formData.id}` 
        : `/api/admin/users/${userId}/deductions`;
    const method = isEditMode ? 'PUT' : 'POST';

    const selectedType = availableDeductionTypes.find(dt => dt.id === formData.deductionTypeId);
    const bodyToSubmit: { deductionTypeId: string; assignedAmount?: string | null; assignedPercentage?: string | null } = {
        deductionTypeId: formData.deductionTypeId,
    };

    if (selectedType) {
        // Gunakan DeductionCalculationTypeValue untuk perbandingan
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
        // Seharusnya tidak terjadi jika form validasi bekerja dengan baik
        console.error("Tipe potongan yang dipilih tidak ditemukan di availableDeductionTypes.");
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
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal submit. Status: ${response.status}`);
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
        &larr; Kembali ke Manajemen Pengguna
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
              userDeductions.map((ud) => (
                <tr key={ud.id} style={styles.tableRow}>
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

// Styling (bisa disamakan atau disesuaikan)
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
