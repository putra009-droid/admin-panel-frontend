// src/components/UserAllowanceForm.tsx
import React, { useState, useEffect, type FormEvent } from 'react';

// Tipe data untuk Tipe Tunjangan (yang akan dipilih dari dropdown)
interface AllowanceTypeOption {
  id: string;
  name: string;
  isFixed: boolean; // Untuk informasi, apakah jumlahnya tetap atau tidak
}

// Tipe data untuk form UserAllowance
interface UserAllowanceFormData {
  id?: string; // ID UserAllowance (hanya ada saat edit)
  allowanceTypeId: string; // ID dari AllowanceType yang dipilih
  amount: string; // Jumlah tunjangan, disimpan sebagai string di form
}

// Props yang diterima oleh komponen UserAllowanceForm
interface UserAllowanceFormProps {
  // userId: string; // <-- HAPUS PROP INI KARENA TIDAK DIGUNAKAN DI SINI
  initialData?: UserAllowanceFormData | null; // Data awal untuk mode edit
  availableAllowanceTypes: AllowanceTypeOption[]; // Daftar tipe tunjangan yang bisa dipilih
  onSubmit: (formData: UserAllowanceFormData) => Promise<void>; // Fungsi saat submit
  onCancel: () => void; // Fungsi untuk menutup/membatalkan form
  isLoading: boolean; // Status loading dari parent
}

function UserAllowanceForm({
  // userId, // <-- HAPUS DARI DESTRUKTURISASI
  initialData,
  availableAllowanceTypes,
  onSubmit,
  onCancel,
  isLoading
}: UserAllowanceFormProps) {
  const [formData, setFormData] = useState<UserAllowanceFormData>({
    id: initialData?.id || undefined,
    allowanceTypeId: initialData?.allowanceTypeId || (availableAllowanceTypes.length > 0 ? availableAllowanceTypes[0].id : ''),
    amount: initialData?.amount || '',
  });
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!(initialData && initialData.id);

  // Update state form jika initialData atau availableAllowanceTypes berubah
  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || undefined,
        allowanceTypeId: initialData.allowanceTypeId || (availableAllowanceTypes.length > 0 ? availableAllowanceTypes[0].id : ''),
        amount: initialData.amount || '',
      });
    } else {
      // Reset form untuk mode tambah
      setFormData({
        allowanceTypeId: availableAllowanceTypes.length > 0 ? availableAllowanceTypes[0].id : '',
        amount: '',
      });
    }
  }, [initialData, availableAllowanceTypes]);

  // Handler untuk perubahan input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler untuk submit form
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!formData.allowanceTypeId) {
      setError("Tipe Tunjangan wajib dipilih.");
      return;
    }
    if (!formData.amount.trim() || isNaN(Number(formData.amount)) || Number(formData.amount) < 0) {
      setError("Jumlah tunjangan wajib diisi dan harus berupa angka positif.");
      return;
    }

    try {
      // userId tidak lagi menjadi bagian dari formData yang dikirim dari sini,
      // karena parent component (UserAllowancesPage) yang akan menanganinya saat memanggil API.
      await onSubmit(formData);
    } catch (submitError: unknown) {
      const errorMessage = submitError instanceof Error ? submitError.message : 'Terjadi kesalahan saat menyimpan.';
      setError(errorMessage);
    }
  };

  return (
    <div style={formStyles.overlay}>
      <div style={formStyles.formContainer}>
        <h3>{isEditMode ? 'Edit Tunjangan Pengguna' : 'Tambah Tunjangan untuk Pengguna'}</h3>
        <form onSubmit={handleSubmit}>
          {/* Dropdown untuk Tipe Tunjangan */}
          <div style={formStyles.inputGroup}>
            <label htmlFor="allowanceTypeId" style={formStyles.label}>Tipe Tunjangan:</label>
            <select
              id="allowanceTypeId"
              name="allowanceTypeId"
              value={formData.allowanceTypeId}
              onChange={handleChange}
              required
              disabled={isLoading || isEditMode} // Nonaktifkan saat edit karena tipe tunjangan biasanya tidak diubah
              style={formStyles.select}
            >
              <option value="">Pilih Tipe Tunjangan</option>
              {availableAllowanceTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.isFixed ? 'Tetap' : 'Tidak Tetap'})
                </option>
              ))}
            </select>
            {isEditMode && <small style={formStyles.smallText}>Tipe tunjangan tidak dapat diubah saat edit.</small>}
          </div>

          {/* Input Jumlah Tunjangan */}
          <div style={formStyles.inputGroup}>
            <label htmlFor="amount" style={formStyles.label}>Jumlah (Rp):</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              disabled={isLoading}
              min="0"
              step="any"
              style={formStyles.input}
            />
          </div>

          {error && <p style={formStyles.errorText}>{error}</p>}

          <div style={formStyles.buttonGroup}>
            <button type="submit" disabled={isLoading} style={formStyles.submitButton}>
              {isLoading ? 'Menyimpan...' : (isEditMode ? 'Update Tunjangan' : 'Tambah Tunjangan')}
            </button>
            <button type="button" onClick={onCancel} disabled={isLoading} style={formStyles.cancelButton}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Styling dasar untuk form (bisa disesuaikan)
const formStyles: { [key: string]: React.CSSProperties } = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    formContainer: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'sans-serif' },
    inputGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' },
    input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
    select: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
    buttonGroup: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    submitButton: { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    cancelButton: { padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    errorText: { color: 'red', fontSize: '14px', marginBottom: '15px', border: '1px solid #ffc0cb', padding: '8px', borderRadius: '4px', backgroundColor: '#ffe0e6'},
    smallText: {fontSize: '12px', color: '#6c757d', display: 'block', marginTop: '4px'}
};

export default UserAllowanceForm;
