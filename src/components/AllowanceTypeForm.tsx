// src/components/AllowanceTypeForm.tsx
import React, { useState, useEffect, type FormEvent } from 'react';

// Tipe data untuk form Tipe Tunjangan
interface AllowanceTypeFormData {
  id?: string; // Opsional, hanya ada saat edit
  name: string;
  description?: string | null; // Deskripsi bisa string atau null
  isFixed: boolean; // Tipe tunjangan (tetap atau tidak)
}

// Props yang diterima oleh komponen AllowanceTypeForm
interface AllowanceTypeFormProps {
  initialData?: AllowanceTypeFormData | null; // Data awal untuk mode edit
  onSubmit: (formData: AllowanceTypeFormData) => Promise<void>; // Fungsi saat submit
  onCancel: () => void; // Fungsi untuk menutup/membatalkan form
  isLoading: boolean; // Status loading dari parent
}

function AllowanceTypeForm({ initialData, onSubmit, onCancel, isLoading }: AllowanceTypeFormProps) {
  const [formData, setFormData] = useState<AllowanceTypeFormData>({
    id: initialData?.id || undefined,
    name: initialData?.name || '',
    description: initialData?.description || null,
    isFixed: initialData?.isFixed === undefined ? true : initialData.isFixed, // Default true
  });
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!(initialData && initialData.id);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || undefined,
        name: initialData.name || '',
        description: initialData.description || null,
        isFixed: initialData.isFixed === undefined ? true : initialData.isFixed,
      });
    } else {
      // Reset form untuk mode tambah
      setFormData({
        name: '',
        description: null,
        isFixed: true, // Default
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        // Untuk checkbox 'isFixed'
        setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: value === '' && name === 'description' ? null : value,
        }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Nama tipe tunjangan wajib diisi.");
      return;
    }

    try {
      await onSubmit(formData);
    } catch (submitError: unknown) {
      const errorMessage = submitError instanceof Error ? submitError.message : 'Terjadi kesalahan.';
      setError(errorMessage);
    }
  };

  return (
    <div style={formStyles.overlay}>
      <div style={formStyles.formContainer}>
        <h3>{isEditMode ? 'Edit Tipe Tunjangan' : 'Tambah Tipe Tunjangan Baru'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={formStyles.inputGroup}>
            <label htmlFor="name">Nama Tipe Tunjangan:</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
          </div>

          <div style={formStyles.inputGroup}>
            <label htmlFor="description">Deskripsi (Opsional):</label>
            <textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} disabled={isLoading} rows={3} />
          </div>

          <div style={formStyles.inputGroup}>
            <label htmlFor="isFixed" style={{ display: 'flex', alignItems: 'center' }}>
              <input type="checkbox" id="isFixed" name="isFixed" checked={formData.isFixed} onChange={handleChange} disabled={isLoading} style={{ marginRight: '8px' }} />
              Apakah tunjangan ini bersifat tetap (fixed)?
            </label>
            <small style={{display: 'block', marginTop: '4px'}}>Jika dicentang, jumlahnya tetap per periode. Jika tidak, bisa bervariasi.</small>
          </div>

          {error && <p style={formStyles.errorText}>{error}</p>}

          <div style={formStyles.buttonGroup}>
            <button type="submit" disabled={isLoading} style={formStyles.submitButton}>
              {isLoading ? 'Menyimpan...' : (isEditMode ? 'Update Tipe Tunjangan' : 'Tambah Tipe Tunjangan')}
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

// Styling dasar untuk form (bisa dipindah ke CSS atau pakai library UI)
const formStyles: { [key: string]: React.CSSProperties } = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    formContainer: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'sans-serif' },
    inputGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' },
    input: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', minHeight: '60px' },
    buttonGroup: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    submitButton: { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    cancelButton: { padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    errorText: { color: 'red', fontSize: '14px', marginBottom: '15px' },
};

export default AllowanceTypeForm;
