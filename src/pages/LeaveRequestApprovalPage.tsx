// src/pages/LeaveRequestApprovalPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface LeaveRequest {
  id: string;
  userId: string;
  user: { 
    name: string;
    email: string;
  };
  leaveType: string;
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
    // ... (logika fetch Anda tidak berubah)
    if (!accessToken || !API_BASE_URL) {
      setError('Token atau URL API tidak tersedia.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/yayasan/leave-requests?status=PENDING_APPROVAL`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as ApiErrorResponse;
        throw new Error(errData.message || errData.error || `Gagal mengambil data pengajuan izin. Status: ${response.status}`);
      }
      const data: { data: LeaveRequest[] } = await response.json();
      setLeaveRequests(data.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(errorMessage);
      setLeaveRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, API_BASE_URL]);

  useEffect(() => {
    // ... (logika useEffect Anda tidak berubah)
    if (adminUser && (adminUser.role === 'YAYASAN' || adminUser.role === 'SUPER_ADMIN')) {
        fetchPendingLeaveRequests();
    } else if (adminUser) {
        setError("Anda tidak memiliki izin untuk mengakses halaman ini.");
        setIsLoading(false);
    }
  }, [fetchPendingLeaveRequests, adminUser]);

  const handleLeaveRequestAction = async (leaveRequestId: string, action: 'approve' | 'reject') => {
    // ... (logika action Anda tidak berubah)
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
        // Jika user cancel prompt, rejectionReason akan null, itu tidak apa-apa
    }

    const url = `${API_BASE_URL}/yayasan/leave-requests/${leaveRequestId}/${action}`;
    const body: { rejectionReason?: string } = {};
    if (action === 'reject' && rejectionReason && rejectionReason.trim() !== '') {
        body.rejectionReason = rejectionReason;
    }
    
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

  if (isLoading) {
    return <div className="p-6 text-center text-slate-600">Memuat pengajuan izin...</div>;
  }
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }
  if (adminUser && !(adminUser.role === 'YAYASAN' || adminUser.role === 'SUPER_ADMIN')) {
      return (
        <div className="p-6">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Akses Ditolak: </strong>
            <span className="block sm:inline">Anda tidak memiliki izin untuk halaman ini.</span>
          </div>
        </div>
      );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Approval Pengajuan Izin</h1>
        <span className="mt-2 sm:mt-0 text-sm text-slate-500">Total Pending: {leaveRequests.length}</span>
      </div>

      {leaveRequests.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <p className="text-slate-600">Tidak ada pengajuan izin yang menunggu approval saat ini.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-3">Nama Pengguna</th>
                    <th scope="col" className="px-6 py-3">Tipe Izin</th>
                    <th scope="col" className="px-6 py-3">Tanggal Mulai</th>
                    <th scope="col" className="px-6 py-3">Tanggal Selesai</th>
                    <th scope="col" className="px-6 py-3 min-w-[200px]">Alasan</th>
                    <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((req) => (
                    <tr key={req.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{req.user?.name || req.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="capitalize">{req.leaveType ? req.leaveType.replace(/_/g, ' ').toLowerCase() : 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(req.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(req.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-4 text-xs">{req.reason}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleLeaveRequestAction(req.id, 'approve')}
                          className="font-medium text-green-600 hover:text-green-800 hover:underline mr-3 text-xs py-1 px-2 rounded bg-green-100 hover:bg-green-200 transition-colors disabled:opacity-50"
                          disabled={actionLoading[req.id]}
                        >
                          {actionLoading[req.id] ? 'Memproses...' : 'Setujui'}
                        </button>
                        <button
                          onClick={() => handleLeaveRequestAction(req.id, 'reject')}
                          className="font-medium text-red-600 hover:text-red-800 hover:underline text-xs py-1 px-2 rounded bg-red-100 hover:bg-red-200 transition-colors disabled:opacity-50"
                          disabled={actionLoading[req.id]}
                        >
                          {actionLoading[req.id] ? 'Memproses...' : 'Tolak'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}
    </div>
  );
}

export default LeaveRequestApprovalPage;