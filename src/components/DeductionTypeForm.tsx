// src/components/DeductionTypeForm.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
// **PERBAIKAN: Impor tipe dan nilai secara terpisah/benar**
import type { DeductionCalculationType } from '../types/deductionTypes'; // Impor sebagai tipe
import { DeductionCalculationTypeValue, AllDeductionCalculationTypes } from '../types/deductionTypes'; // Impor sebagai nilai

// Tipe data untuk form Tipe Potongan
interface DeductionTypeFormData {
  id?: string;
  name: string;
  description?: string | null;
  calculationType: DeductionCalculationType; // Menggunakan tipe yang diimpor
  ruleAmount?: string | null;
  rulePercentage?: string | null;
  isMandatory: boolean;
}

// Props yang diterima oleh komponen DeductionTypeForm
interface DeductionTypeFormProps {
  initialData?: DeductionTypeFormData | null;
  onSubmit: (formData: DeductionTypeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function DeductionTypeForm({ initialData, onSubmit, onCancel, isLoading }: DeductionTypeFormProps) {
  const [formData, setFormData] = useState<DeductionTypeFormData>({
    id: initialData?.id || undefined,
    name: initialData?.name || '',
    description: initialData?.description || null,
    // **PERBAIKAN: Gunakan nilai dari DeductionCalculationTypeValue untuk default**
    calculationType: initialData?.calculationType || DeductionCalculationTypeValue.FIXED_USER,
    ruleAmount: initialData?.ruleAmount || null,
    rulePercentage: initialData?.rulePercentage || null,
    isMandatory: initialData?.isMandatory === undefined ? false : initialData.isMandatory,
  });
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!(initialData && initialData.id);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || undefined,
        name: initialData.name || '',
        description: initialData.description || null,
        // **PERBAIKAN: Gunakan nilai dari DeductionCalculationTypeValue untuk default**
        calculationType: initialData.calculationType || DeductionCalculationTypeValue.FIXED_USER,
        ruleAmount: initialData.ruleAmount || null,
        rulePercentage: initialData.rulePercentage || null,
        isMandatory: initialData.isMandatory === undefined ? false : initialData.isMandatory,
      });
    } else {
      setFormData({
        name: '',
        description: null,
        // **PERBAIKAN: Gunakan nilai dari DeductionCalculationTypeValue untuk default**
        calculationType: DeductionCalculationTypeValue.FIXED_USER,
        ruleAmount: null,
        rulePercentage: null,
        isMandatory: false,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' && (name === 'description' || name === 'ruleAmount' || name === 'rulePercentage') ? null : value,
      }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Nama tipe potongan wajib diisi.");
      return;
    }
    if (!formData.calculationType) {
        setError("Tipe Kalkulasi wajib dipilih.");
        return;
    }

    // **PERBAIKAN: Gunakan nilai dari DeductionCalculationTypeValue untuk array**
    const requiresRuleAmount: DeductionCalculationType[] = [DeductionCalculationTypeValue.PER_LATE_INSTANCE, DeductionCalculationTypeValue.PER_ALPHA_DAY];
    const requiresRulePercentage: DeductionCalculationType[] = [DeductionCalculationTypeValue.PERCENTAGE_ALPHA_DAY, DeductionCalculationTypeValue.MANDATORY_PERCENTAGE];

    if (requiresRuleAmount.includes(formData.calculationType) && (formData.ruleAmount === null || (typeof formData.ruleAmount === 'string' && formData.ruleAmount.trim() === ''))) {
        setError(`Jumlah Aturan (Rule Amount) wajib diisi untuk tipe kalkulasi ${formData.calculationType.replace(/_/g, ' ')}.`);
        return;
    }
    if (requiresRulePercentage.includes(formData.calculationType) && (formData.rulePercentage === null || (typeof formData.rulePercentage === 'string' && formData.rulePercentage.trim() === ''))) {
        setError(`Persentase Aturan (Rule Percentage) wajib diisi untuk tipe kalkulasi ${formData.calculationType.replace(/_/g, ' ')}.`);
        return;
    }

    if (formData.ruleAmount !== null && isNaN(Number(formData.ruleAmount))) {
        setError("Jumlah Aturan harus berupa angka.");
        return;
    }
    if (formData.rulePercentage !== null && (isNaN(Number(formData.rulePercentage)) || Number(formData.rulePercentage) < 0 || Number(formData.rulePercentage) > 100)) {
        setError("Persentase Aturan harus antara 0 dan 100.");
        return;
    }

    try {
      await onSubmit(formData);
    } catch (submitError: unknown) {
       const errorMessage = submitError instanceof Error ? submitError.message : 'Terjadi kesalahan saat menyimpan.';
       setError(errorMessage);
    }
  };

  // **PERBAIKAN: Gunakan nilai dari DeductionCalculationTypeValue untuk perbandingan**
  const showRuleAmount = [DeductionCalculationTypeValue.PER_LATE_INSTANCE, DeductionCalculationTypeValue.PER_ALPHA_DAY].includes(formData.calculationType);
  const showRulePercentage = [DeductionCalculationTypeValue.PERCENTAGE_ALPHA_DAY, DeductionCalculationTypeValue.MANDATORY_PERCENTAGE].includes(formData.calculationType);

  return (
    <div style={formStyles.overlay}>
      <div style={formStyles.formContainer}>
        <h3>{isEditMode ? 'Edit Tipe Potongan' : 'Tambah Tipe Potongan Baru'}</h3>
        <form onSubmit={handleSubmit}>
          {/* Nama */}
          <div style={formStyles.inputGroup}>
            <label htmlFor="name" style={formStyles.label}>Nama Tipe Potongan:</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} style={formStyles.input}/>
          </div>
          {/* Deskripsi */}
          <div style={formStyles.inputGroup}>
            <label htmlFor="description" style={formStyles.label}>Deskripsi (Opsional):</label>
            <textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} disabled={isLoading} rows={3} style={formStyles.textarea}/>
          </div>
          {/* Tipe Kalkulasi */}
          <div style={formStyles.inputGroup}>
            <label htmlFor="calculationType" style={formStyles.label}>Tipe Kalkulasi:</label>
            <select id="calculationType" name="calculationType" value={formData.calculationType} onChange={handleChange} required disabled={isLoading} style={formStyles.select}>
              {/* **PERBAIKAN: Gunakan AllDeductionCalculationTypes untuk iterasi dropdown** */}
              {AllDeductionCalculationTypes.map(typeValue => (
                <option key={typeValue} value={typeValue}>{typeValue.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          {/* Rule Amount */}
          {showRuleAmount && (
            <div style={formStyles.inputGroup}>
              <label htmlFor="ruleAmount" style={formStyles.label}>Jumlah Aturan (Rp):</label>
              <input type="number" id="ruleAmount" name="ruleAmount" value={formData.ruleAmount || ''} onChange={handleChange} disabled={isLoading} min="0" step="any" style={formStyles.input}/>
              <small style={formStyles.smallText}>Diperlukan untuk tipe PER LATE INSTANCE, PER ALPHA DAY.</small>
            </div>
          )}
          {/* Rule Percentage */}
          {showRulePercentage && (
            <div style={formStyles.inputGroup}>
              <label htmlFor="rulePercentage" style={formStyles.label}>Persentase Aturan (%):</label>
              <input type="number" id="rulePercentage" name="rulePercentage" value={formData.rulePercentage || ''} onChange={handleChange} disabled={isLoading} min="0" max="100" step="any" style={formStyles.input}/>
              <small style={formStyles.smallText}>Diperlukan untuk tipe PERCENTAGE ALPHA DAY, MANDATORY PERCENTAGE (0-100).</small>
            </div>
          )}
          {/* Info untuk FIXED_USER dan PERCENTAGE_USER */}
          {(formData.calculationType === DeductionCalculationTypeValue.FIXED_USER || formData.calculationType === DeductionCalculationTypeValue.PERCENTAGE_USER) && (
            <p style={formStyles.infoText}>
              Untuk tipe {formData.calculationType.replace(/_/g, ' ')}, nilai potongan spesifik akan diatur per pengguna melalui menu "Kelola Pengguna".
            </p>
          )}
          {/* Is Mandatory */}
          <div style={formStyles.inputGroup}>
            <label htmlFor="isMandatory" style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal' }}>
              <input type="checkbox" id="isMandatory" name="isMandatory" checked={formData.isMandatory} onChange={handleChange} disabled={isLoading} style={{ marginRight: '8px' }} />
              Apakah potongan ini bersifat wajib untuk semua pengguna yang relevan?
            </label>
          </div>
          {error && <p style={formStyles.errorText}>{error}</p>}
          {/* Tombol Aksi */}
          <div style={formStyles.buttonGroup}>
            <button type="submit" disabled={isLoading} style={formStyles.submitButton}>
              {isLoading ? 'Menyimpan...' : (isEditMode ? 'Update Tipe Potongan' : 'Tambah Tipe Potongan')}
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

const formStyles: { [key: string]: React.CSSProperties } = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    formContainer: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'sans-serif' },
    inputGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' },
    input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', minHeight: '60px' },
    select: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
    buttonGroup: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    submitButton: { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    cancelButton: { padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    errorText: { color: 'red', fontSize: '14px', marginBottom: '15px', border: '1px solid #ffc0cb', padding: '8px', borderRadius: '4px', backgroundColor: '#ffe0e6'},
    infoText: {fontSize: '13px', color: '#555', fontStyle: 'italic', marginTop: '-10px', marginBottom: '15px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef'},
    smallText: {fontSize: '12px', color: '#6c757d', display: 'block', marginTop: '4px'}
};

export default DeductionTypeForm;
