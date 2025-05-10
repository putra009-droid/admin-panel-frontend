// src/pages/UserManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import UserForm from '../components/UserForm';
import { Link } from 'react-router-dom'; // Pastikan Link sudah diimpor

// Tipe data untuk User
interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  baseSalary: string | null;
  createdAt: string;
  updatedAt: string;
}

// Tipe data untuk form
interface UserFormData {
    id?: string;
    name: string;
    email: string;
    password?: string;
    role: string;
    baseSalary: string | null;
}

const AVAILABLE_ROLES = ['ADMIN', 'USER', 'YAYASAN'];

function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) {
        setError('Token autentikasi tidak tersedia.');
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        let errorMsg = `Gagal mengambil data user. Status: ${response.status}`;
        try { const errorData = await response.json(); errorMsg = errorData.message || errorData.error || errorMsg; }
        catch (parseError) { console.warn("Could not parse error response body as JSON. Error:", parseError); }
        throw new Error(errorMsg);
      }
      const data: UserData[] = await response.json();
      setUsers(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
    setError(null);
  };

  const handleEditUser = (userToEdit: UserData) => {
    const initialFormData: UserFormData = {
        id: userToEdit.id,
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        baseSalary: userToEdit.baseSalary,
    };
    setEditingUser(initialFormData);
    setShowForm(true);
    setError(null);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}" (ID: ${userId})?`)) {
      setError(null);
      const token = accessToken;
      if (!token) { setError('Token tidak ditemukan.'); return; }
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          let errorMsg = `Gagal menghapus user. Status: ${response.status}`;
          try { const errorData = await response.json(); errorMsg = errorData.message || errorData.error || errorMsg; }
          catch (parseError) { console.warn("Could not parse delete error response body as JSON. Error:", parseError); }
          throw new Error(errorMsg);
        }
        alert(`Pengguna "${userName}" berhasil dihapus.`);
        fetchUsers();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.';
        setError(`Gagal menghapus: ${errorMessage}`);
      }
    }
  };

  const handleResetPassword = (userId: string) => {
    alert(`Fungsi Reset password untuk pengguna ID: ${userId} belum diimplementasikan.`);
  };

  const handleFormSubmit = async (formData: UserFormData) => {
    setIsSubmitting(true);
    setError(null);
    const token = accessToken;
    if (!token) {
        setError('Token autentikasi tidak ditemukan.');
        setIsSubmitting(false);
        throw new Error('Token autentikasi tidak ditemukan.');
    }
    const isEditMode = !!formData.id;
    const url = isEditMode ? `/api/admin/users/${formData.id}` : '/api/admin/users';
    const method = isEditMode ? 'PUT' : 'POST';
    interface ApiUserPayload {
      name: string;
      email: string;
      role: string;
      baseSalary: number | null;
      password?: string;
    }
    const apiRequestBody: ApiUserPayload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      baseSalary: formData.baseSalary !== null ? Number(formData.baseSalary) : null,
    };
    if (!isEditMode) {
      if (formData.password) {
        apiRequestBody.password = formData.password;
      } else {
        setError('Password wajib diisi untuk pengguna baru.');
        setIsSubmitting(false);
        throw new Error('Password wajib diisi.');
      }
    }
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(apiRequestBody),
      });
      if (!response.ok) {
        let errorMsg = `Gagal ${isEditMode ? 'memperbarui' : 'menambah'} user. Status: ${response.status}`;
        try { const errorData = await response.json(); errorMsg = errorData.message || errorData.error || errorMsg; }
        catch (parseError) { console.warn("Could not parse form submit error response body as JSON. Error:", parseError); }
        throw new Error(errorMsg);
      }
      alert(`Pengguna berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      setShowForm(false);
      fetchUsers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.';
      setError(`Gagal submit: ${errorMessage}`);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setError(null);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Manajemen Pengguna</h2>
      {error && !showForm && <p style={styles.errorText}>Error: {error}</p>}
      <div style={styles.actionBar}>
          <p>Total Pengguna: {users.length}</p>
          <button onClick={handleAddUser} style={styles.addButton} disabled={isLoading || showForm}>
            + Tambah Pengguna Baru
          </button>
      </div>
      {isLoading ? (
        <div>Memuat daftar pengguna...</div>
      ) : (
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeader}>No</th>
              <th style={styles.tableHeader}>Nama</th>
              <th style={styles.tableHeader}>Email</th>
              <th style={styles.tableHeader}>Role</th>
              <th style={styles.tableHeader}>Gaji Pokok</th>
              <th style={styles.tableHeader}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6} style={styles.tableCellCenter}>Tidak ada data pengguna.</td></tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} style={styles.tableRow}>
                  <td style={styles.tableCellCenter}>{index + 1}</td>
                  <td style={styles.tableCell}>{user.name}</td>
                  <td style={styles.tableCell}>{user.email}</td>
                  <td style={styles.tableCell}>{user.role}</td>
                  <td style={styles.tableCellRight}>
                    {user.baseSalary ? `Rp ${parseInt(user.baseSalary, 10).toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td style={styles.tableCellCenter}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}> {/* // <--- Wrapper untuk tombol */}
                        <div>
                            <button onClick={() => handleEditUser(user)} style={{ ...styles.actionButton, ...styles.editButton, width: '100px', marginBottom: '3px' }} disabled={showForm}>Edit</button>
                            <button onClick={() => handleDeleteUser(user.id, user.name)} style={{ ...styles.actionButton, ...styles.deleteButton, width: '100px', marginBottom: '3px' }} disabled={showForm}>Hapus</button>
                        </div>
                        <div>
                            <button onClick={() => handleResetPassword(user.id)} style={{ ...styles.actionButton, ...styles.resetButton, width: '100px', marginBottom: '3px' }} disabled={showForm}>Reset Pass</button>
                             {/* --- TOMBOL BARU UNTUK KELOLA TUNJANGAN --- */}
                            <Link to={`/users/${user.id}/allowances`} style={{ ...styles.actionButton, ...styles.manageButton, width: '100px', marginBottom: '3px', boxSizing: 'border-box' }} className={showForm ? 'disabled-link' : ''}>
                                Tunjangan
                            </Link>
                        </div>
                        <div>
                            {/* --- TOMBOL BARU UNTUK KELOLA POTONGAN --- */}
                            <Link to={`/users/${user.id}/deductions`} style={{ ...styles.actionButton, ...styles.manageDeductionButton, width: '100px', boxSizing: 'border-box' }} className={showForm ? 'disabled-link' : ''}>
                                Potongan
                            </Link>
                        </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      {showForm && (
        <UserForm
          initialData={editingUser}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          isLoading={isSubmitting}
          availableRoles={AVAILABLE_ROLES}
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
  actionButton: { textDecoration: 'none', marginRight: '5px', padding: '4px 8px', fontSize: '12px', border: 'none', borderRadius: '3px', cursor: 'pointer', color: 'white', display: 'inline-block', lineHeight: 'normal', verticalAlign: 'middle' },
  editButton: { backgroundColor: '#007bff' },
  deleteButton: { backgroundColor: '#dc3545' },
  resetButton: { backgroundColor: '#ffc107', color: '#212529' },
  manageButton: { backgroundColor: '#17a2b8' }, // Warna untuk kelola tunjangan
  manageDeductionButton: { backgroundColor: '#6f42c1' }, // Warna baru untuk kelola potongan
  errorText: { color: '#721c24', border: '1px solid #f5c6cb', padding: '10px', borderRadius: '4px', backgroundColor: '#f8d7da', marginBottom: '15px' },
};

export default UserManagementPage;
