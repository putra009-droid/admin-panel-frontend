// src/pages/UserManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import UserForm from '../components/UserForm'; // Pastikan path ini benar
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  baseSalary: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
    id?: string;
    name: string;
    email: string;
    password?: string;
    role: string;
    baseSalary: string | null;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  code?: string;
}

interface UserSuccessResponse {
    message: string;
    user?: UserData; // Untuk tambah/edit
    // data?: UserData; // Jika API tambah/edit membungkus dalam 'data'
}

// Tipe untuk respons API GET /api/admin/users
// Asumsi API bisa mengembalikan array UserData langsung, atau objek dengan properti 'data'
type UsersApiResponse = UserData[] | { data: UserData[], message?: string, currentPage?: number, totalPages?: number, totalItems?: number };


const AVAILABLE_ROLES = ['ADMIN', 'USER', 'YAYASAN', 'REKTOR', 'PR1', 'PR2', 'EMPLOYEE'];

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
        console.error('UserManagementPage: Token tidak ditemukan dari context.');
        return;
    }
    if (!API_BASE_URL) {
        const errMsg = 'UserManagementPage: Konfigurasi URL API (VITE_API_BASE_URL) tidak ditemukan.';
        console.error(errMsg);
        setError(errMsg);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    const fetchUrl = `${API_BASE_URL}/admin/users`;
    console.log(`UserManagementPage: Fetching users from ${fetchUrl}`);

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        let errorMsg = `Gagal mengambil data user. Status: ${response.status}`;
        try { 
          const errorData = await response.json() as ApiErrorResponse; 
          errorMsg = errorData.message || errorData.error || errorMsg; 
        }
        catch (parseError) { console.warn("Could not parse error response body as JSON. Error:", parseError); }
        throw new Error(errorMsg);
      }
      
      // **PERBAIKAN PARSING RESPONS**
      const responseData = await response.json() as UsersApiResponse;
      if (Array.isArray(responseData)) {
        // Jika API mengembalikan array pengguna secara langsung
        setUsers(responseData);
        console.log('UserManagementPage: Users fetched successfully (direct array):', responseData);
      } else if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
        // Jika API mengembalikan objek dengan properti 'data' yang berisi array pengguna
        setUsers(responseData.data);
        console.log('UserManagementPage: Users fetched successfully (from data property):', responseData.data);
      } else {
        // Jika struktur tidak dikenal atau data tidak ada
        console.warn('UserManagementPage: Received unknown data structure from API or no user data.', responseData);
        setUsers([]);
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui saat mengambil data user.';
      setError(errorMessage);
      setUsers([]);
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
    if (!API_BASE_URL) { setError('Konfigurasi URL API tidak ditemukan.'); return; }
    if (window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}" (ID: ${userId})?`)) {
      setError(null);
      const token = accessToken;
      if (!token) { setError('Token tidak ditemukan.'); return; }
      try {
        const deleteUrl = `${API_BASE_URL}/admin/users/${userId}`;
        console.log(`UserManagementPage: Deleting user from ${deleteUrl}`);
        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          let errorMsg = `Gagal menghapus user. Status: ${response.status}`;
          try { 
            const errorData = await response.json() as ApiErrorResponse; 
            errorMsg = errorData.message || errorData.error || errorMsg; 
          }
          catch (parseError) { console.warn("Could not parse delete error response body. Error:", parseError); }
          throw new Error(errorMsg);
        }
        const result: { message: string } = await response.json();
        alert(result.message || `Pengguna "${userName}" berhasil dihapus.`);
        fetchUsers();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus user.';
        setError(`Gagal menghapus: ${errorMessage}`);
      }
    }
  };

  const handleResetPassword = (userId: string) => {
    alert(`Fungsi Reset password untuk pengguna ID: ${userId} belum diimplementasikan.`);
  };

  const handleFormSubmit = async (formData: UserFormData) => {
    if (!API_BASE_URL) { 
        setError('Konfigurasi URL API tidak ditemukan.'); 
        setIsSubmitting(false); 
        throw new Error('Konfigurasi URL API tidak ditemukan.');
    }
    setIsSubmitting(true);
    setError(null);
    const token = accessToken;
    if (!token) {
        setError('Token autentikasi tidak ditemukan.');
        setIsSubmitting(false);
        throw new Error('Token autentikasi tidak ditemukan.');
    }
    const isEditMode = !!formData.id;
    const url = isEditMode ? `${API_BASE_URL}/admin/users/${formData.id}` : `${API_BASE_URL}/admin/users`;
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
      baseSalary: formData.baseSalary !== null && formData.baseSalary.trim() !== '' ? Number(formData.baseSalary) : null,
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
    console.log(`Submitting user data (${method}) to ${url}:`, apiRequestBody);
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
        try { 
          const errorData = await response.json() as ApiErrorResponse; 
          errorMsg = errorData.message || errorData.error || errorMsg; 
        }
        catch (parseError) { console.warn("Could not parse form submit error response body. Error:", parseError); }
        throw new Error(errorMsg);
      }
      const result = await response.json() as UserSuccessResponse; 
      alert(result.message || `Pengguna berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      setShowForm(false);
      fetchUsers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal submit form.';
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
        <div style={{overflowX: 'auto'}}>
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
                    <tr key={user.id} style={{...styles.tableRow, backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'}}>
                    <td style={styles.tableCellCenter}>{index + 1}</td>
                    <td style={styles.tableCell}>{user.name}</td>
                    <td style={styles.tableCell}>{user.email}</td>
                    <td style={styles.tableCell}>{user.role}</td>
                    <td style={styles.tableCellRight}>
                        {user.baseSalary ? `Rp ${parseInt(user.baseSalary, 10).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td style={styles.tableCellCenter}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <div style={{display: 'flex', gap: '4px'}}>
                                <button onClick={() => handleEditUser(user)} style={{ ...styles.actionButton, ...styles.editButton }} disabled={showForm}>Edit</button>
                                <button onClick={() => handleDeleteUser(user.id, user.name)} style={{ ...styles.actionButton, ...styles.deleteButton }} disabled={showForm}>Hapus</button>
                                <button onClick={() => handleResetPassword(user.id)} style={{ ...styles.actionButton, ...styles.resetButton }} disabled={showForm}>Reset Pass</button>
                            </div>
                            <div style={{display: 'flex', gap: '4px', marginTop: '4px'}}>
                                <Link to={`/users/${user.id}/allowances`} style={{ ...styles.actionButton, ...styles.manageButton }} className={showForm ? 'disabled-link' : ''}>
                                    Tunjangan
                                </Link>
                                <Link to={`/users/${user.id}/deductions`} style={{ ...styles.actionButton, ...styles.manageDeductionButton }} className={showForm ? 'disabled-link' : ''}>
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
        </div>
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
  tableRow: { /* Styling dasar untuk baris */ },
  tableCell: { padding: '10px', border: '1px solid #dee2e6', verticalAlign: 'middle' },
  tableCellCenter: { padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', verticalAlign: 'middle' },
  tableCellRight: { padding: '10px', border: '1px solid #dee2e6', textAlign: 'right', verticalAlign: 'middle' },
  actionButton: { textDecoration: 'none', minWidth: '80px', marginRight: '5px', padding: '5px 10px', fontSize: '12px', border: 'none', borderRadius: '3px', cursor: 'pointer', color: 'white', display: 'inline-block', lineHeight: 'normal', verticalAlign: 'middle', textAlign: 'center' },
  editButton: { backgroundColor: '#007bff' },
  deleteButton: { backgroundColor: '#dc3545' },
  resetButton: { backgroundColor: '#ffc107', color: '#212529' },
  manageButton: { backgroundColor: '#17a2b8' }, 
  manageDeductionButton: { backgroundColor: '#6f42c1' },
  errorText: { color: '#721c24', border: '1px solid #f5c6cb', padding: '10px', borderRadius: '4px', backgroundColor: '#f8d7da', marginBottom: '15px' },
};

export default UserManagementPage;
