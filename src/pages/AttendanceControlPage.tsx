// src/pages/AttendanceControlPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || '';

// Tipe data untuk Absensi yang diterima dari API
interface AttendanceRecord {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  notes: string | null;
  latitudeIn: number | null;    
  longitudeIn: number | null;   
  latitudeOut: number | null;   
  longitudeOut: number | null;  
  createdAt: string;
  selfieInUrl?: string | null;
  selfieOutUrl?: string | null;
  // Field baru untuk informasi perangkat dan Fake GPS
  deviceModel?: string | null;
  deviceOS?: string | null;
  isMockLocation?: boolean | null;
  gpsAccuracy?: number | null; // Akurasi dalam meter
}

// Tipe data untuk User (untuk filter dropdown)
interface UserOption {
  id: string;
  name: string;
}

const ADMIN_SETTABLE_STATUSES = ['IZIN', 'SAKIT', 'CUTI', 'ALPHA', 'LIBUR'];
const ALL_ATTENDANCE_STATUSES = ['HADIR', 'IZIN', 'SAKIT', 'ALPHA', 'CUTI', 'LIBUR', 'SELESAI', 'BELUM', 'TERLAMBAT'];

function AttendanceControlPage() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [limit] = useState<number>(10);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [editingRecord, setEditingRecord] = useState<{id: string, date: string, userId: string, currentStatus: string} | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  const fetchUsersForFilter = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await fetch('/api/admin/users?limit=1000&sort=name&order=asc', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('Gagal mengambil daftar pengguna');
      const data = await response.json();
      setUsers(data.data.map((u: {id: string, name: string}) => ({ id: u.id, name: u.name })));
    } catch (err) {
      console.error("Gagal mengambil daftar pengguna untuk filter:", err);
    }
  }, [accessToken]);

  const fetchAttendances = useCallback(async (pageToFetch = 1) => {
    if (!accessToken) {
      setError('Token autentikasi tidak tersedia.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const queryParams = new URLSearchParams({
      page: String(pageToFetch),
      limit: String(limit),
    });
    if (selectedUserId) queryParams.append('userId', selectedUserId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (selectedStatusFilter) queryParams.append('status', selectedStatusFilter);

    try {
      const response = await fetch(`/api/admin/attendances?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal mengambil data absensi. Status: ${response.status}`);
      }
      const data = await response.json();
      // Pastikan data yang diterima dari API di-parse dengan benar untuk lokasi
      const formattedAttendances = (data.data || []).map((att: any) => ({ // Beri tipe 'any' sementara untuk parsing
        ...att,
        latitudeIn: att.latitudeIn ? parseFloat(String(att.latitudeIn)) : null,
        longitudeIn: att.longitudeIn ? parseFloat(String(att.longitudeIn)) : null,
        latitudeOut: att.latitudeOut ? parseFloat(String(att.latitudeOut)) : null,
        longitudeOut: att.longitudeOut ? parseFloat(String(att.longitudeOut)) : null,
        gpsAccuracy: att.gpsAccuracy ? parseFloat(String(att.gpsAccuracy)) : null,
        isMockLocation: typeof att.isMockLocation === 'boolean' ? att.isMockLocation : null,
      }));
      setAttendances(formattedAttendances);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
      setAttendances([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, selectedUserId, startDate, endDate, selectedStatusFilter, limit]);

  useEffect(() => {
    fetchUsersForFilter();
  }, [fetchUsersForFilter]);
  
  useEffect(() => {
    fetchAttendances(currentPage);
  }, [fetchAttendances, currentPage]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); 
    if (currentPage === 1) {
        fetchAttendances(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };
  
  const openStatusEditModal = (record: AttendanceRecord) => {
    if (!record.clockIn) {
        alert("Data absensi tidak lengkap (tidak ada waktu Clock In).");
        return;
    }
    const recordDate = new Date(record.clockIn).toISOString().split('T')[0];
    setEditingRecord({id: record.id, date: recordDate, userId: record.userId, currentStatus: record.status});
    setNewStatus(record.status);
    setNewNotes(record.notes || '');
  };

  const handleModalStatusChange = async () => {
    if (!editingRecord || !newStatus) {
      alert("Pilih status baru.");
      return;
    }
    const { id: attendanceId, date: recordDate, userId: recordUserId } = editingRecord;
    
    setActionLoading(prev => ({...prev, [attendanceId]: true}));
    setError(null);

    if (!accessToken) {
      setError('Token tidak ditemukan.');
      setActionLoading(prev => ({...prev, [attendanceId]: false}));
      return;
    }
    
    try {
        const response = await fetch('/api/admin/attendance/status', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ 
                userId: recordUserId, 
                date: recordDate,   
                status: newStatus, 
                notes: newNotes.trim() === '' ? null : newNotes.trim()
            }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Gagal mengubah status. Status: ${response.status}`);
        }
        alert('Status absensi berhasil diubah.');
        setEditingRecord(null);
        fetchAttendances(currentPage);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        setError(`Gagal ubah status: ${errorMessage}`);
    } finally {
        setActionLoading(prev => ({...prev, [attendanceId]: false}));
    }
  };

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return '-';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    } catch (e: unknown) { 
        console.error("Error formatting date:", e);
        return 'Invalid Date Format'; 
    }
  };

  if (isLoading && attendances.length === 0 && !error) return <div style={styles.container}>Memuat data absensi...</div>;
  if (error && !editingRecord) return <div style={styles.container}><p style={styles.errorText}>Error: {error}</p></div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Kontrol & Laporan Absensi Karyawan</h2>

      <form onSubmit={handleFilterSubmit} style={styles.filterForm}>
        <div>
          <label htmlFor="userFilter" style={styles.label}>Karyawan:</label>
          <select id="userFilter" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={styles.select}>
            <option value="">Semua Karyawan</option>
            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="startDateFilter" style={styles.label}>Dari Tanggal:</label>
          <input type="date" id="startDateFilter" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.inputDate} />
        </div>
        <div>
          <label htmlFor="endDateFilter" style={styles.label}>Sampai Tanggal:</label>
          <input type="date" id="endDateFilter" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.inputDate} />
        </div>
        <div>
          <label htmlFor="statusFilter" style={styles.label}>Status:</label>
          <select id="statusFilter" value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)} style={styles.select}>
            <option value="">Semua Status</option>
            {ALL_ATTENDANCE_STATUSES.map(status => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <button type="submit" disabled={isLoading} style={styles.button}>Terapkan Filter</button>
      </form>
      {error && !editingRecord && <p style={styles.errorText}>Error saat filter/memuat: {error}</p>}
      
      {isLoading && <p>Memuat data...</p>}
      {!isLoading && attendances.length === 0 && <p>Tidak ada data absensi yang cocok dengan filter.</p>}
      {!isLoading && attendances.length > 0 && (
        <>
          <p>Total Data: {totalItems}</p>
          <table style={styles.table}>
            <thead style={styles.tableHead}>
              <tr>
                <th style={styles.tableHeader}>Karyawan</th>
                <th style={styles.tableHeader}>Clock In</th>
                <th style={styles.tableHeader}>Lokasi In</th>
                <th style={styles.tableHeader}>Selfie In</th>
                <th style={styles.tableHeader}>Device In</th> {/* Kolom Baru */}
                <th style={styles.tableHeader}>Clock Out</th>
                <th style={styles.tableHeader}>Lokasi Out</th>
                <th style={styles.tableHeader}>Selfie Out</th>
                <th style={styles.tableHeader}>Device Out</th> {/* Kolom Baru */}
                <th style={styles.tableHeader}>Status</th>
                <th style={styles.tableHeader}>Mock GPS?</th> {/* Kolom Baru */}
                <th style={styles.tableHeader}>Akurasi GPS (In)</th> {/* Kolom Baru */}
                <th style={styles.tableHeader}>Catatan</th>
                <th style={styles.tableHeader}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((att, index) => (
                <tr key={att.id} style={{ 
                    ...styles.tableRow, 
                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                }}>
                  <td style={styles.tableCell}>{att.user?.name || att.userId}</td>
                  <td style={styles.tableCell}>{formatDateTime(att.clockIn)}</td>
                  <td style={styles.tableCell}>
                    {att.latitudeIn && att.longitudeIn ? (
                      <a href={`https://www.google.com/maps?q=${att.latitudeIn},${att.longitudeIn}`} target="_blank" rel="noopener noreferrer">
                        Lihat Peta
                      </a>
                    ) : '-'}
                  </td>
                  <td style={styles.tableCell}>
                    {att.selfieInUrl ? <a href={`${SERVER_BASE_URL}${att.selfieInUrl}`} target="_blank" rel="noopener noreferrer">Lihat Foto</a> : '-'}
                  </td>
                  {/* Tampilkan Info Perangkat Clock In */}
                  <td style={styles.tableCell}>
                    {att.deviceModel || att.deviceOS ? `${att.deviceModel || ''} (${att.deviceOS || ''})` : '-'}
                  </td>
                  <td style={styles.tableCell}>{formatDateTime(att.clockOut)}</td>
                  <td style={styles.tableCell}>
                    {att.latitudeOut && att.longitudeOut ? (
                      <a href={`https://www.google.com/maps?q=${att.latitudeOut},${att.longitudeOut}`} target="_blank" rel="noopener noreferrer">
                        Lihat Peta
                      </a>
                    ) : '-'}
                  </td>
                  <td style={styles.tableCell}>
                     {att.selfieOutUrl ? <a href={`${SERVER_BASE_URL}${att.selfieOutUrl}`} target="_blank" rel="noopener noreferrer">Lihat Foto</a> : '-'}
                  </td>
                   {/* Tampilkan Info Perangkat Clock Out (Jika Anda menyimpannya terpisah) */}
                  <td style={styles.tableCell}>
                    {/* Asumsi device info sama untuk in & out, atau Anda perlu field terpisah di DB */}
                    {att.deviceModel || att.deviceOS ? `${att.deviceModel || ''} (${att.deviceOS || ''})` : '-'}
                  </td>
                  <td style={styles.tableCell}>{att.status.replace(/_/g, ' ')}</td>
                  {/* Tampilkan Indikasi Mock GPS */}
                  <td style={styles.tableCellCenter}>
                    {att.isMockLocation === true ? <span style={{color: 'red', fontWeight: 'bold'}}>Ya</span> : (att.isMockLocation === false ? 'Tidak' : '-')}
                  </td>
                  {/* Tampilkan Akurasi GPS */}
                  <td style={styles.tableCellRight}>
                    {att.gpsAccuracy !== null ? `${att.gpsAccuracy.toFixed(1)} m` : '-'}
                  </td>
                  <td style={styles.tableCell}>{att.notes || '-'}</td>
                  <td style={styles.tableCellCenter}>
                    <button 
                        onClick={() => openStatusEditModal(att)}
                        style={{ ...styles.actionButton, ...styles.editButton }}
                        disabled={actionLoading[att.id]}
                    >
                        Ubah Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginasi */}
          <div style={styles.pagination}>
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading}>
              Sebelumnya
            </button>
            <span> Halaman {currentPage} dari {totalPages} (Total: {totalItems}) </span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading}>
              Berikutnya
            </button>
          </div>
        </>
      )}

      {/* Modal/Form untuk Edit Status */}
      {editingRecord && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h4>Ubah Status Absensi untuk {attendances.find(a=>a.id === editingRecord.id)?.user.name}</h4>
            <p>Tanggal: {new Date(editingRecord.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div style={styles.inputGroup}>
                <label htmlFor="newStatus" style={styles.label}>Status Baru:</label>
                <select 
                    id="newStatus"
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value)}
                    disabled={actionLoading[editingRecord.id]}
                    style={styles.selectFull}
                >
                    <option value="">Pilih Status</option>
                    {ADMIN_SETTABLE_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
            </div>
            <div style={styles.inputGroup}>
                <label htmlFor="newNotes" style={styles.label}>Catatan (Opsional):</label>
                <textarea 
                    id="newNotes"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={3}
                    disabled={actionLoading[editingRecord.id]}
                    style={styles.textareaFull}
                />
            </div>
            {error && editingRecord && <p style={styles.errorTextModal}>{error}</p>}
            <div style={styles.modalActions}>
                <button 
                    onClick={() => handleModalStatusChange()}
                    style={{...styles.actionButton, backgroundColor: 'green'}}
                    disabled={actionLoading[editingRecord.id] || !newStatus}
                >
                    {actionLoading[editingRecord.id] ? 'Menyimpan...' : 'Simpan Status'}
                </button>
                <button 
                    onClick={() => setEditingRecord(null)}
                    style={{...styles.actionButton, backgroundColor: 'gray'}}
                    disabled={actionLoading[editingRecord.id]}
                >
                    Batal
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', fontFamily: 'sans-serif' },
  title: { marginBottom: '20px', color: '#333' },
  filterForm: { display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', padding: '15px', border: '1px solid #eee', borderRadius: '8px', alignItems: 'flex-end' },
  label: { display: 'block', marginBottom: '5px', fontSize: '14px' },
  select: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '10px' },
  inputDate: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '10px' },
  button: { padding: '8px 15px', borderRadius: '4px', border: '1px solid #007bff', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #dee2e6', marginTop: '15px' },
  tableHead: { backgroundColor: '#f0f0f0' },
  tableHeader: { padding: '10px', border: '1px solid #ccc', textAlign: 'left', fontWeight: 'bold' },
  tableRow: { /* Styling dasar untuk baris, zebra striping diterapkan secara dinamis */ },
  tableCell: { padding: '8px', border: '1px solid #ccc', verticalAlign: 'middle' },
  tableCellCenter: { padding: '8px', border: '1px solid #ccc', textAlign: 'center', verticalAlign: 'middle' },
  tableCellRight: { padding: '8px', border: '1px solid #ccc', textAlign: 'right', verticalAlign: 'middle' },
  actionButton: { marginRight: '5px', padding: '5px 8px', fontSize: '12px', border: 'none', borderRadius: '3px', cursor: 'pointer', color: 'white' },
  editButton: { backgroundColor: '#007bff' },
  errorText: { color: '#D8000C', backgroundColor: '#FFD2D2', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #D8000C' },
  errorTextModal: { color: '#D8000C', marginBottom: '10px', fontSize: '14px' },
  pagination: { marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 },
  modalContent: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '450px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
  inputGroup: { marginBottom: '15px' },
  selectFull: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
  textareaFull: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', minHeight: '80px' },
  modalActions: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
};

export default AttendanceControlPage;
