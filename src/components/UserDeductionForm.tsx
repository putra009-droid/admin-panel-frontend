// src/components/UserDeductionForm.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
// Impor tipe dan nilai enum dari file terpisah
import type { DeductionCalculationType } from '../types/deductionTypes';
import { DeductionCalculationTypeValue } from '../types/deductionTypes';

// Tipe data untuk Tipe Potongan (yang akan dipilih dari dropdown)
interface DeductionTypeOption {
  id: string;
  name: string;
  calculationType: DeductionCalculationType; // Penting untuk logika di form
}

// Tipe data untuk form UserDeduction
interface UserDeductionFormData {
  id?: string; // ID UserDeduction (hanya ada saat edit)
  deductionTypeId: string; // ID dari DeductionType yang dipilih
  // Nilai spesifik untuk potongan tipe FIXED_USER atau PERCENTAGE_USER
  assignedAmount?: string | null; // Jumlah potongan tetap, disimpan sebagai string
  assignedPercentage?: string | null; // Persentase potongan, disimpan sebagai string
}

// Props yang diterima oleh komponen UserDeductionForm
interface UserDeductionFormProps {
  initialData?: UserDeductionFormData | null; // Data awal untuk mode edit
  availableDeductionTypes: DeductionTypeOption[]; // Daftar tipe potongan yang bisa dipilih
  onSubmit: (formData: UserDeductionFormData) => Promise<void>; // Fungsi saat submit
  onCancel: () => void; // Fungsi untuk menutup/membatalkan form
  isLoading: boolean; // Status loading dari parent
}

function UserDeductionForm({
  initialData,
  availableDeductionTypes,
  onSubmit,
  onCancel,
  isLoading
}: UserDeductionFormProps) {
  const [formData, setFormData] = useState<UserDeductionFormData>({
    id: initialData?.id || undefined,
    deductionTypeId: initialData?.deductionTypeId || (availableDeductionTypes.length > 0 ? availableDeductionTypes[0].id : ''),
    assignedAmount: initialData?.assignedAmount || null,
    assignedPercentage: initialData?.assignedPercentage || null,
  });
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!(initialData && initialData.id);

  // State untuk menyimpan tipe kalkulasi dari Tipe Potongan yang dipilih
  const [selectedDeductionCalculationType, setSelectedDeductionCalculationType] =
    useState<DeductionCalculationType | null>(null);

  // Update state form jika initialData atau availableDeductionTypes berubah
  useEffect(() => {
    let defaultTypeId = '';
    if (availableDeductionTypes.length > 0) {
        defaultTypeId = availableDeductionTypes[0].id;
    }

    if (initialData) {
      setFormData({
        id: initialData.id || undefined,
        deductionTypeId: initialData.deductionTypeId || defaultTypeId,
        assignedAmount: initialData.assignedAmount || null,
        assignedPercentage: initialData.assignedPercentage || null,
      });
      // Set tipe kalkulasi awal jika dalam mode edit
      const selectedType = availableDeductionTypes.find(dt => dt.id === (initialData.deductionTypeId || defaultTypeId));
      setSelectedDeductionCalculationType(selectedType ? selectedType.calculationType : null);
    } else {
      // Reset form untuk mode tambah
      setFormData({
        deductionTypeId: defaultTypeId,
        assignedAmount: null,
        assignedPercentage: null,
      });
      const defaultSelectedType = availableDeductionTypes.find(dt => dt.id === defaultTypeId);
      setSelectedDeductionCalculationType(defaultSelectedType ? defaultSelectedType.calculationType : null);
    }
  }, [initialData, availableDeductionTypes]);

  // Handler untuk perubahan input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    const baseNewFormData = { ...formData, [name]: value };

    // Jika tipe potongan berubah, update selectedDeductionCalculationType
    // dan reset field amount/percentage yang tidak relevan
    if (name === 'deductionTypeId') {
      const selectedType = availableDeductionTypes.find(dt => dt.id === value);
      const newCalcType = selectedType ? selectedType.calculationType : null;
      setSelectedDeductionCalculationType(newCalcType);

      // PERBAIKAN: Ubah 'let' menjadi 'const' karena variabel 'finalFormData' tidak di-reassign
      const finalFormData = { ...baseNewFormData };
      if (newCalcType !== DeductionCalculationTypeValue.FIXED_USER) {
        finalFormData.assignedAmount = null; // Memodifikasi properti objek, bukan reassign variabel
      }
      if (newCalcType !== DeductionCalculationTypeValue.PERCENTAGE_USER) {
        finalFormData.assignedPercentage = null; // Memodifikasi properti objek, bukan reassign variabel
      }
      setFormData(finalFormData);
      return; 
    }
    setFormData(baseNewFormData); 
  };

  // Handler untuk submit form
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!formData.deductionTypeId) {
      setError("Tipe Potongan wajib dipilih.");
      return;
    }

    const dataToSubmit = { ...formData };

    // Validasi dan penyesuaian berdasarkan tipe kalkulasi yang dipilih
    if (selectedDeductionCalculationType === DeductionCalculationTypeValue.FIXED_USER) {
      if (!formData.assignedAmount || formData.assignedAmount.trim() === '' || isNaN(Number(formData.assignedAmount)) || Number(formData.assignedAmount) < 0) {
        setError("Jumlah potongan tetap wajib diisi dan harus berupa angka positif.");
        return;
      }
      dataToSubmit.assignedPercentage = null; // Pastikan null
    } else if (selectedDeductionCalculationType === DeductionCalculationTypeValue.PERCENTAGE_USER) {
      if (!formData.assignedPercentage || formData.assignedPercentage.trim() === '' || isNaN(Number(formData.assignedPercentage)) || Number(formData.assignedPercentage) < 0 || Number(formData.assignedPercentage) > 100) {
        setError("Persentase potongan wajib diisi (0-100).");
        return;
      }
      dataToSubmit.assignedAmount = null; // Pastikan null
    } else {
      // Untuk tipe lain, assignedAmount dan assignedPercentage harus null
      dataToSubmit.assignedAmount = null;
      dataToSubmit.assignedPercentage = null;
    }

    try {
      await onSubmit(dataToSubmit);
    } catch (submitError: unknown) {
      const errorMessage = submitError instanceof Error ? submitError.message : 'Terjadi kesalahan saat menyimpan.';
      setError(errorMessage);
    }
  };

  // Tentukan apakah input jumlah atau persentase harus ditampilkan
  const showAssignedAmountInput = selectedDeductionCalculationType === DeductionCalculationTypeValue.FIXED_USER;
  const showAssignedPercentageInput = selectedDeductionCalculationType === DeductionCalculationTypeValue.PERCENTAGE_USER;

  return (
    <div style={formStyles.overlay}>
      <div style={formStyles.formContainer}>
        <h3>{isEditMode ? 'Edit Potongan Pengguna' : 'Tambah Potongan untuk Pengguna'}</h3>
        <form onSubmit={handleSubmit}>
          {/* Dropdown untuk Tipe Potongan */}
          <div style={formStyles.inputGroup}>
            <label htmlFor="deductionTypeId" style={formStyles.label}>Tipe Potongan:</label>
            <select
              id="deductionTypeId"
              name="deductionTypeId"
              value={formData.deductionTypeId}
              onChange={handleChange}
              required
              disabled={isLoading || isEditMode} // Nonaktifkan saat edit
              style={formStyles.select}
            >
              <option value="">Pilih Tipe Potongan</option>
              {availableDeductionTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.calculationType.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
            {isEditMode && <small style={formStyles.smallText}>Tipe potongan tidak dapat diubah saat edit.</small>}
          </div>

          {/* Input Jumlah Potongan (hanya jika tipe FIXED_USER) */}
          {showAssignedAmountInput && (
            <div style={formStyles.inputGroup}>
              <label htmlFor="assignedAmount" style={formStyles.label}>Jumlah Potongan Tetap (Rp):</label>
              <input
                type="number"
                id="assignedAmount"
                name="assignedAmount"
                value={formData.assignedAmount || ''}
                onChange={handleChange}
                required
                disabled={isLoading}
                min="0"
                step="any"
                style={formStyles.input}
              />
            </div>
          )}

          {/* Input Persentase Potongan (hanya jika tipe PERCENTAGE_USER) */}
          {showAssignedPercentageInput && (
            <div style={formStyles.inputGroup}>
              <label htmlFor="assignedPercentage" style={formStyles.label}>Persentase Potongan (% dari Gaji Pokok):</label>
              <input
                type="number"
                id="assignedPercentage"
                name="assignedPercentage"
                value={formData.assignedPercentage || ''}
                onChange={handleChange}
                required
                disabled={isLoading}
                min="0"
                max="100"
                step="any"
                style={formStyles.input}
              />
            </div>
          )}
          
          {/* Info jika tipe potongan tidak memerlukan input nilai di sini */}
          {!showAssignedAmountInput && !showAssignedPercentageInput && selectedDeductionCalculationType && (
            <p style={formStyles.infoText}>
              Untuk tipe potongan "{selectedDeductionCalculationType.replace(/_/g, ' ')}", nilai akan dihitung otomatis berdasarkan aturan tipe potongan.
            </p>
          )}

          {error && <p style={formStyles.errorText}>{error}</p>}

          <div style={formStyles.buttonGroup}>
            <button type="submit" disabled={isLoading} style={formStyles.submitButton}>
              {isLoading ? 'Menyimpan...' : (isEditMode ? 'Update Potongan' : 'Tambah Potongan')}
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
    smallText: {fontSize: '12px', color: '#6c757d', display: 'block', marginTop: '4px'},
    infoText: {fontSize: '13px', color: '#555', fontStyle: 'italic', marginTop: '-10px', marginBottom: '15px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef'}
};

export default UserDeductionForm;
