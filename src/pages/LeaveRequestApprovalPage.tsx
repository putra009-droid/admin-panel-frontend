// src/pages/LeaveRequestApprovalPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
// import { Link } from 'react-router-dom'; // Tidak digunakan di sini

// Ambil API_BASE_URL dari environment variable Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Tipe data untuk LeaveRequest yang diterima dari API
interface LeaveRequest {
  id: string;
  userId: string;
  user: { 
    name: string;
    email: string;
  };
  leaveType: string; // Di backend Anda, leaveType adalah AttendanceStatus (enum string)
  // Jika leaveType adalah objek relasi di backend, sesuaikan di sini
  // leaveType: { 
  //   id: string;
  //   name: string;
  // };
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

// Tipe untuk respons error umum dari API
interface ApiErrorResponse {
  message?: string;
  error?: string;
}

function LeaveRequestApprovalPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const { accessToken, user: adminUser } = useAuth();

  const fetchPendingLeaveRequests = useCallback(async () => {
    if (!accessToken || !API_BASE_URL) {
      setError('Token atau URL API tidak tersedia.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    console.log('LeaveRequestApprovalPage: Fetching pending leave requests...');
    try {
      const response = await fetch(`${API_BASE_URL}/yayasan/leave-requests?status=PENDING_APPROVAL`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as ApiErrorResponse;
        throw new Error(errData.message || errData.error || `Gagal mengambil data pengajuan izin. Status: ${response.status}`);
      }
      const data: { data: LeaveRequest[] } = await response.json(); // Asumsi API membungkus dalam 'data'
      setLeaveRequests(data.data || []);
      console.log('LeaveRequestApprovalPage: Pending leave requests fetched successfully:', data.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
      setLeaveRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, API_BASE_URL]);

  useEffect(() => {
    if (adminUser && (adminUser.role === 'YAYASAN' || adminUser.role === 'SUPER_ADMIN')) {
        fetchPendingLeaveRequests();
    } else if (adminUser) {
        setError("Anda tidak memiliki izin untuk mengakses halaman ini.");
        setIsLoading(false);
    }
  }, [fetchPendingLeaveRequests, adminUser]);

  const handleLeaveRequestAction = async (leaveRequestId: string, action: 'approve' | 'reject') => {
    if (!API_BASE_URL) { setError('URL API tidak ditemukan.'); return; }
    setActionLoading(prev => ({ ...prev, [leaveRequestId]: true }));
    setError(null);
    if (!accessToken) {
      setError('Token tidak ditemukan.');
      setActionLoading(prev => ({ ...prev, [leaveRequestId]: false }));
      return;
    }

    let rejectionReason: string | null = null;
    if (action === 'reject') {
        rejectionReason = window.prompt("Masukkan alasan penolakan (opsional):");
    }

    const url = `${API_BASE_URL}/yayasan/leave-requests/${leaveRequestId}/${action}`;
    const body: { rejectionReason?: string } = {};
    if (action === 'reject' && rejectionReason && rejectionReason.trim() !== '') {
        body.rejectionReason = rejectionReason;
    }

    console.log(`LeaveRequestApprovalPage: Performing action '${action}' for leave request ID: ${leaveRequestId}`);
    try {
      const response = await fetch(url, {
        method: 'PUT', // API Anda menggunakan PUT untuk approve/reject
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as ApiErrorResponse;
        throw new Error(errData.message || errData.error || `Gagal ${action === 'approve' ? 'menyetujui' : 'menolak'} pengajuan. Status: ${response.status}`);
      }
      alert(`Pengajuan izin berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}.`);
      fetchPendingLeaveRequests();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(`Gagal aksi: ${errorMessage}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [leaveRequestId]: false }));
    }
  };

  if (isLoading) return <div style={styles.container}>Memuat pengajuan izin...</div>;
  if (error) return <div style={styles.container}><p style={styles.errorText}>Error: {error}</p></div>;
  if (adminUser && !(adminUser.role === 'YAYASAN' || adminUser.role === 'SUPER_ADMIN')) {
      return <div style={styles.container}><p style={styles.errorText}>Akses Ditolak: Anda tidak memiliki izin untuk halaman ini.</p></div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Approval Pengajuan Izin</h2>
      <p>Total Pengajuan Pending: {leaveRequests.length}</p>
      
      {leaveRequests.length === 0 ? (
        <p>Tidak ada pengajuan izin yang menunggu approval.</p>
      ) : (
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeader}>Nama Pengguna</th>
              <th style={styles.tableHeader}>Tipe Izin</th>
              <th style={styles.tableHeader}>Tanggal Mulai</th>
              <th style={styles.tableHeader}>Tanggal Selesai</th>
              <th style={styles.tableHeader}>Alasan</th>
              <th style={styles.tableHeader}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.map((req, index) => (
              <tr key={req.id} style={{...styles.tableRow, backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'}}>
                <td style={styles.tableCell}>{req.user?.name || req.userId}</td>
                {/* Di backend, leaveType adalah enum AttendanceStatus, jadi kita tampilkan langsung */}
                <td style={styles.tableCell}>{req.leaveType ? req.leaveType.replace(/_/g, ' ') : 'N/A'}</td>
                <td style={styles.tableCell}>{new Date(req.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td style={styles.tableCell}>{new Date(req.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td style={styles.tableCell}>{req.reason}</td>
                <td style={styles.tableCellCenter}>
                  <button 
                    onClick={() => handleLeaveRequestAction(req.id, 'approve')}
                    style={{ ...styles.actionButton, ...styles.approveButton }}
                    disabled={actionLoading[req.id]}
                  >
                    {actionLoading[req.id] ? 'Memproses...' : 'Setujui'}
                  </button>
                  <button 
                    onClick={() => handleLeaveRequestAction(req.id, 'reject')}
                    style={{ ...styles.actionButton, ...styles.rejectButton }}
                    disabled={actionLoading[req.id]}
                  >
                    {actionLoading[req.id] ? 'Memproses...' : 'Tolak'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', fontFamily: 'sans-serif' },
  title: { marginBottom: '20px', color: '#333' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px', border: '1px solid #dee2e6', marginTop: '15px' },
  tableHead: { backgroundColor: '#f8f9fa' },
  tableHeader: { padding: '10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' },
  tableRow: {},
  tableCell: { padding: '10px', border: '1px solid #dee2e6', verticalAlign: 'middle' },
  tableCellCenter: { padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', verticalAlign: 'middle' },
  actionButton: { marginRight: '5px', padding: '6px 10px', fontSize: '13px', border: 'none', borderRadius: '3px', cursor: 'pointer', color: 'white' },
  approveButton: { backgroundColor: '#28a745' },
  rejectButton: { backgroundColor: '#dc3545' },
  errorText: { color: '#721c24', border: '1px solid #f5c6cb', padding: '10px', borderRadius: '4px', backgroundColor: '#f8d7da', marginBottom: '15px' },
};

export default LeaveRequestApprovalPage;
