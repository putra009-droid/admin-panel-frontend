// src/pages/AttendanceControlPage.tsx
import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || '';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Interface Definitions ---
interface UserFromApi { id: string; name: string; }
interface UsersApiResponse { data: UserFromApi[]; } // Pastikan ini sesuai dengan API Anda
interface RawAttendanceRecordFromApi {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; };
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  notes: string | null;
  latitudeIn: string | number | null;
  longitudeIn: string | number | null;
  latitudeOut: string | number | null;
  longitudeOut: string | number | null;
  createdAt: string;
  selfieInUrl?: string | null;
  selfieOutUrl?: string | null;
  deviceModel?: string | null;
  deviceOS?: string | null;
  isMockLocationIn?: boolean | null;
  gpsAccuracyIn?: string | number | null;
  isMockLocationOut?: boolean | null;
  gpsAccuracyOut?: string | number | null;
}
interface AttendanceRecord {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; };
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
  deviceModel?: string | null;
  deviceOS?: string | null;
  isMockLocationIn?: boolean | null;
  gpsAccuracyIn?: number | null;
  isMockLocationOut?: boolean | null;
  gpsAccuracyOut?: number | null;
}
interface AttendancesApiResponse { data: RawAttendanceRecordFromApi[]; currentPage: number; totalPages: number; totalItems: number; }
interface UpdateStatusApiResponse { message: string; record: Partial<AttendanceRecord>; }
interface UserOption { id: string; name: string; }
// Definisi ApiErrorResponse dihapus jika tidak secara eksplisit digunakan sebagai tipe untuk variabel


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
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<{id: string, date: string, userId: string, currentStatus: string, userName: string} | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  const fetchUsersForFilter = useCallback(async () => {
    if (!accessToken || !API_BASE_URL) return;
    setIsLoadingUsers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users?limit=1000&sort=name&order=asc`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Tidak ada type assertion ke ApiErrorResponse
        throw new Error(errorData.message || errorData.error || 'Gagal mengambil daftar pengguna');
      }
      const data = await response.json() as UsersApiResponse;
      setUsers((data.data || []).map((u: UserFromApi) => ({ id: u.id, name: u.name })));
    } catch (err) {
      console.error("Gagal mengambil daftar pengguna untuk filter:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [accessToken, API_BASE_URL]);

  const fetchAttendances = useCallback(async (pageToFetch = 1) => {
    if (!accessToken || !API_BASE_URL) {
      setError('Token autentikasi atau URL API tidak tersedia.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const queryParams = new URLSearchParams({ page: String(pageToFetch), limit: String(limit) });
    if (selectedUserId) queryParams.append('userId', selectedUserId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (selectedStatusFilter) queryParams.append('status', selectedStatusFilter);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/attendances?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({})); // Tidak ada type assertion ke ApiErrorResponse
        throw new Error(errData.message || errData.error || `Gagal mengambil data absensi. Status: ${response.status}`);
      }
      const data = await response.json() as AttendancesApiResponse;
      const formattedAttendances: AttendanceRecord[] = (data.data || []).map((att: RawAttendanceRecordFromApi) => ({
        ...att,
        latitudeIn: (att.latitudeIn !== null && att.latitudeIn !== undefined && !isNaN(parseFloat(String(att.latitudeIn)))) ? parseFloat(String(att.latitudeIn)) : null,
        longitudeIn: (att.longitudeIn !== null && att.longitudeIn !== undefined && !isNaN(parseFloat(String(att.longitudeIn)))) ? parseFloat(String(att.longitudeIn)) : null,
        latitudeOut: (att.latitudeOut !== null && att.latitudeOut !== undefined && !isNaN(parseFloat(String(att.latitudeOut)))) ? parseFloat(String(att.latitudeOut)) : null,
        longitudeOut: (att.longitudeOut !== null && att.longitudeOut !== undefined && !isNaN(parseFloat(String(att.longitudeOut)))) ? parseFloat(String(att.longitudeOut)) : null,
        gpsAccuracyIn: (att.gpsAccuracyIn !== null && att.gpsAccuracyIn !== undefined && !isNaN(parseFloat(String(att.gpsAccuracyIn)))) ? parseFloat(String(att.gpsAccuracyIn)) : null,
        gpsAccuracyOut: (att.gpsAccuracyOut !== null && att.gpsAccuracyOut !== undefined && !isNaN(parseFloat(String(att.gpsAccuracyOut)))) ? parseFloat(String(att.gpsAccuracyOut)) : null,
        isMockLocationIn: typeof att.isMockLocationIn === 'boolean' ? att.isMockLocationIn : null,
        isMockLocationOut: typeof att.isMockLocationOut === 'boolean' ? att.isMockLocationOut : null,
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
  }, [accessToken, selectedUserId, startDate, endDate, selectedStatusFilter, limit, API_BASE_URL]);

  useEffect(() => { fetchUsersForFilter(); }, [fetchUsersForFilter]);
  useEffect(() => { fetchAttendances(currentPage); }, [fetchAttendances, currentPage]);

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); 
    fetchAttendances(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };
  
  const openStatusEditModal = (record: AttendanceRecord) => {
    if (!record.clockIn && !ADMIN_SETTABLE_STATUSES.includes(record.status) ) { 
        alert("Data absensi tidak lengkap (tidak ada waktu Clock In untuk status yang memerlukan). Status saat ini: "+record.status);
        return;
    }
    const recordDateSource = record.clockIn || record.createdAt;
    const recordDate = new Date(recordDateSource).toISOString().split('T')[0];
    setEditingRecord({id: record.id, date: recordDate, userId: record.userId, currentStatus: record.status, userName: record.user.name});
    setNewStatus(record.status);
    setNewNotes(record.notes || '');
  };

  const handleModalStatusChange = async () => {
    if (!API_BASE_URL) {
        setError('Konfigurasi URL API tidak ditemukan.');
        setIsSubmittingStatus(false);
        throw new Error('Konfigurasi URL API tidak ditemukan.');
    }
    if (!editingRecord || !newStatus) {
      alert("Pilih status baru.");
      return;
    }
    if (!ADMIN_SETTABLE_STATUSES.includes(newStatus)) {
        alert(`Status "${newStatus.replace(/_/g, ' ')}" tidak diizinkan untuk diatur oleh admin.`);
        return;
    }
    const { date: recordDate, userId: recordUserId } = editingRecord;
    setIsSubmittingStatus(true);
    setError(null);
    if (!accessToken) {
      setError('Token tidak ditemukan.');
      setIsSubmittingStatus(false);
      return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/admin/attendance/status`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}`},
            body: JSON.stringify({ userId: recordUserId, date: recordDate, status: newStatus, notes: newNotes.trim() === '' ? null : newNotes.trim() }),
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({})); // Tidak ada type assertion ke ApiErrorResponse
            throw new Error(errData.message || errData.error || `Gagal mengubah status. Status: ${response.status}`);
        }
        const result = await response.json() as UpdateStatusApiResponse;
        alert(result.message || 'Status absensi berhasil diubah.');
        setEditingRecord(null);
        fetchAttendances(currentPage);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        setError(`Gagal ubah status: ${errorMessage}`);
    } finally {
        setIsSubmittingStatus(false);
    }
  };

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return '-';
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
            console.warn("Detected invalid date string for formatting:", dateTimeString);
            return 'Invalid Date';
        }
        return date.toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    } catch (e: unknown) { // 'e' digunakan di console.error
        console.error("Error during date formatting:", e, "| Original string:", dateTimeString);
        return 'Invalid Date Format';
    }
  };

  if (isLoadingUsers && users.length === 0) {
    return <div className="p-6 text-center text-slate-600">Memuat data filter pengguna...</div>;
  }
  if (isLoading && attendances.length === 0 && !error && !editingRecord) {
    return <div className="p-6 text-center text-slate-600">Memuat data absensi...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6">Kontrol & Laporan Absensi</h1>

      <form onSubmit={handleFilterSubmit} className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-8 space-y-4 md:space-y-0 md:flex md:flex-wrap md:items-end md:gap-x-4 md:gap-y-4">
        <div className="flex-grow min-w-[180px]">
          <label htmlFor="userFilter" className="block text-sm font-medium text-slate-700 mb-1">Karyawan:</label>
          <select id="userFilter" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm">
            <option value="">Semua Karyawan</option>
            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </div>
        <div className="flex-grow min-w-[150px]">
          <label htmlFor="startDateFilter" className="block text-sm font-medium text-slate-700 mb-1">Dari Tanggal:</label>
          <input type="date" id="startDateFilter" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm" />
        </div>
        <div className="flex-grow min-w-[150px]">
          <label htmlFor="endDateFilter" className="block text-sm font-medium text-slate-700 mb-1">Sampai Tanggal:</label>
          <input type="date" id="endDateFilter" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm" />
        </div>
        <div className="flex-grow min-w-[150px]">
          <label htmlFor="statusFilter" className="block text-sm font-medium text-slate-700 mb-1">Status:</label>
          <select id="statusFilter" value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm">
            <option value="">Semua Status</option>
            {ALL_ATTENDANCE_STATUSES.map(status => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <button type="submit" disabled={isLoading} className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-colors duration-150 text-sm disabled:opacity-50">
          Terapkan
        </button>
      </form>
      
      {error && !editingRecord && (
         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Terjadi Kesalahan</p>
            <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <h3 className="text-lg font-semibold text-slate-700 mb-2 sm:mb-0">Data Absensi ({totalItems} item)</h3>
        </div>
        {isLoading && <p className="p-10 text-center text-slate-500 text-lg">Sedang memuat data absensi...</p>}
        {!isLoading && attendances.length === 0 && <p className="p-10 text-center text-slate-500 text-lg">Tidak ada data absensi yang cocok dengan filter yang diterapkan.</p>}
        {!isLoading && attendances.length > 0 && (
          <>
            <div className="overflow-x-auto w-full">
              <table className="min-w-full text-xs text-left text-slate-600">
                <thead className="text-[11px] text-slate-700 uppercase bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 whitespace-nowrap">Karyawan</th>
                    <th className="px-3 py-3 whitespace-nowrap">Clock In</th>
                    <th className="px-3 py-3 whitespace-nowrap">Lokasi In</th>
                    <th className="px-3 py-3 whitespace-nowrap">Selfie In</th>
                    <th className="px-3 py-3 whitespace-nowrap">Device (In)</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap">Mock (In)</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Akurasi (In)</th>
                    <th className="px-3 py-3 whitespace-nowrap">Clock Out</th>
                    <th className="px-3 py-3 whitespace-nowrap">Lokasi Out</th>
                    <th className="px-3 py-3 whitespace-nowrap">Selfie Out</th>
                    <th className="px-3 py-3 whitespace-nowrap">Device (Out)</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap">Mock (Out)</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Akurasi (Out)</th>
                    <th className="px-3 py-3 whitespace-nowrap">Status</th>
                    <th className="px-3 py-3 whitespace-nowrap">Catatan</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {attendances.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">{att.user?.name || att.userId}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(att.clockIn)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {att.latitudeIn && att.longitudeIn ? (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${att.latitudeIn},${att.longitudeIn}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                            Lihat Peta
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {att.selfieInUrl ? <a href={`${SERVER_BASE_URL}${att.selfieInUrl}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">Lihat Foto</a> : '-'}
                      </td>
                      <td className="px-3 py-2 text-[10px] whitespace-nowrap">{att.deviceModel || att.deviceOS ? `${att.deviceModel || ''} (${att.deviceOS || ''})` : '-'}</td>
                      <td className={`px-3 py-2 text-center whitespace-nowrap ${att.isMockLocationIn === true ? 'text-red-600 font-bold' : ''}`}>
                        {att.isMockLocationIn === true ? 'Ya' : (att.isMockLocationIn === false ? 'Tidak' : '-')}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {typeof att.gpsAccuracyIn === 'number' ? `${att.gpsAccuracyIn.toFixed(1)} m` : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(att.clockOut)}</td>
                       <td className="px-3 py-2 whitespace-nowrap">
                        {att.latitudeOut && att.longitudeOut ? (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${att.latitudeOut},${att.longitudeOut}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                            Lihat Peta
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                         {att.selfieOutUrl ? <a href={`${SERVER_BASE_URL}${att.selfieOutUrl}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">Lihat Foto</a> : '-'}
                      </td>
                      <td className="px-3 py-2 text-[10px] whitespace-nowrap">{att.deviceModel || att.deviceOS ? `${att.deviceModel || ''} (${att.deviceOS || ''})` : '-'}</td>
                      <td className={`px-3 py-2 text-center whitespace-nowrap ${att.isMockLocationOut === true ? 'text-red-600 font-bold' : ''}`}>
                        {att.isMockLocationOut === true ? 'Ya' : (att.isMockLocationOut === false ? 'Tidak' : '-')}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {typeof att.gpsAccuracyOut === 'number' ? `${att.gpsAccuracyOut.toFixed(1)} m` : '-'}
                      </td>
                      <td className="px-3 py-2 capitalize whitespace-nowrap">{att.status.replace(/_/g, ' ').toLowerCase()}</td>
                      <td className="px-3 py-2 text-xs max-w-[150px] truncate whitespace-nowrap" title={att.notes || undefined}>{att.notes || '-'}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <button 
                            onClick={() => openStatusEditModal(att)}
                            className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline text-[11px] py-1 px-2.5 rounded-md bg-indigo-100 hover:bg-indigo-200 transition-colors disabled:opacity-50"
                            disabled={isSubmittingStatus || !!editingRecord} 
                        >
                            Ubah Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading} className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Sebelumnya</button>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading} className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Berikutnya</button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-700">
                                Halaman <span className="font-medium">{currentPage}</span> dari <span className="font-medium">{totalPages}</span> ({totalItems} item)
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                                    <span className="sr-only">Sebelumnya</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                                </button>
                                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                                    <span className="sr-only">Berikutnya</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
          </>
        )}
      </div>

      {editingRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Ubah Status Absensi</h3>
            <p className="text-sm text-slate-600 mb-1">Karyawan: <span className="font-medium text-sky-700">{editingRecord.userName}</span></p>
            <p className="text-sm text-slate-600 mb-5">Tanggal: <span className="font-medium">{new Date(editingRecord.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
            
            <div className="space-y-5">
                <div>
                    <label htmlFor="newStatusModal" className="block text-sm font-medium text-slate-700 mb-1">Status Baru:</label>
                    <select 
                        id="newStatusModal"
                        value={newStatus} 
                        onChange={(e) => setNewStatus(e.target.value)}
                        disabled={isSubmittingStatus}
                        className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
                    >
                        <option value="" disabled>Pilih Status</option>
                        {ADMIN_SETTABLE_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="newNotesModal" className="block text-sm font-medium text-slate-700 mb-1">Catatan (Opsional):</label>
                    <textarea 
                        id="newNotesModal"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        rows={3}
                        disabled={isSubmittingStatus}
                        className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
                        placeholder="Masukkan catatan jika ada..."
                    />
                </div>
            </div>
            {error && editingRecord && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            
            <div className="mt-8 flex justify-end space-x-3">
                <button 
                    onClick={() => { setEditingRecord(null); setError(null); }}
                    type="button"
                    className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors disabled:opacity-50"
                    disabled={isSubmittingStatus}
                >
                    Batal
                </button>
                <button 
                    onClick={handleModalStatusChange}
                    type="button"
                    className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isSubmittingStatus || !newStatus || (newStatus === editingRecord.currentStatus && (newNotes || '') === (attendances.find(a=>a.id === editingRecord.id)?.notes || '')) }
                >
                    {isSubmittingStatus ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Menyimpan...
                        </div>
                    ) : 'Simpan Status'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceControlPage;