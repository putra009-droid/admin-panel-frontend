// src/pages/LeaveRequestApprovalPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
// Hapus impor Link jika tidak digunakan di halaman ini
// import { Link } from 'react-router-dom'; 

// Tipe data untuk LeaveRequest yang diterima dari API
// Sesuaikan dengan struktur data yang dikembalikan oleh backend Anda
interface LeaveRequest {
  id: string;
  userId: string;
  user: { // Detail pengguna yang mengajukan
    name: string;
    email: string;
  };
  leaveType: { // Detail tipe izin
    id: string;
    name: string;
    deductsLeaveBalance: boolean;
  };
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED'; // Sesuaikan dengan enum StatusCuti Anda
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

function LeaveRequestApprovalPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({}); // Untuk loading per tombol aksi
  const { accessToken, user: adminUser } = useAuth(); // Ambil user admin untuk cek role jika perlu

  // Fungsi untuk mengambil data pengajuan izin yang pending
  const fetchPendingLeaveRequests = useCallback(async () => {
    if (!accessToken) {
      setError('Token autentikasi tidak tersedia.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    console.log('LeaveRequestApprovalPage: Fetching pending leave requests...');
    try {
      const response = await fetch('/api/yayasan/leave-requests?status=PENDING_APPROVAL', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal mengambil data pengajuan izin. Status: ${response.status}`);
      }
      const data: LeaveRequest[] = await response.json();
      setLeaveRequests(data);
      console.log('LeaveRequestApprovalPage: Pending leave requests fetched successfully:', data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (adminUser && (adminUser.role === 'YAYASAN' || adminUser.role === 'SUPER_ADMIN')) {
        fetchPendingLeaveRequests();
    } else if (adminUser) {
        setError("Anda tidak memiliki izin untuk mengakses halaman ini.");
        setIsLoading(false);
    }
  }, [fetchPendingLeaveRequests, adminUser]);

  // Fungsi untuk menangani aksi approve atau reject
  const handleLeaveRequestAction = async (leaveRequestId: string, action: 'approve' | 'reject') => {
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

    const url = `/api/yayasan/leave-requests/${leaveRequestId}/${action}`;
    const body: { rejectionReason?: string } = {};
    if (action === 'reject' && rejectionReason && rejectionReason.trim() !== '') {
        body.rejectionReason = rejectionReason;
    }

    console.log(`LeaveRequestApprovalPage: Performing action '${action}' for leave request ID: ${leaveRequestId}`);
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Gagal ${action === 'approve' ? 'menyetujui' : 'menolak'} pengajuan. Status: ${response.status}`);
      }
      alert(`Pengajuan izin berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}.`);
      fetchPendingLeaveRequests(); // Refresh daftar setelah aksi
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
            {leaveRequests.map((req) => (
              <tr key={req.id} style={styles.tableRow}>
                <td style={styles.tableCell}>{req.user?.name || req.userId}</td>
                <td style={styles.tableCell}>{req.leaveType?.name || (req.leaveType?.id ? `ID: ${req.leaveType.id}` : 'N/A')}</td>
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

// Styling (bisa disamakan atau disesuaikan)
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
