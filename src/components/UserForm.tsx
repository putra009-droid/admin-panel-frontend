    // src/components/UserForm.tsx
    import React, { useState, useEffect, type FormEvent } from 'react';

    // Tipe data untuk user (cocokkan dengan UserData di UserManagementPage)
    interface UserFormData {
      id?: string; // Opsional, hanya ada saat edit
      name: string;
      email: string;
      password?: string; // Opsional, hanya wajib saat tambah
      role: string; // Nanti kita bisa pakai enum Role jika diimpor
      baseSalary: string | null;
    }

    // Props yang diterima oleh komponen UserForm
    interface UserFormProps {
      initialData?: UserFormData | null; // Data awal untuk mode edit
      onSubmit: (formData: UserFormData) => Promise<void>; // Fungsi yg dipanggil saat submit
      onCancel: () => void; // Fungsi untuk menutup/membatalkan form
      isLoading: boolean; // Status loading dari parent
      availableRoles: string[]; // Daftar role yang bisa dipilih (kecuali SUPER_ADMIN)
    }

    function UserForm({ initialData, onSubmit, onCancel, isLoading, availableRoles }: UserFormProps) {
      // State untuk menyimpan data form
      const [formData, setFormData] = useState<UserFormData>({
        id: initialData?.id || undefined,
        name: initialData?.name || '',
        email: initialData?.email || '',
        password: '', // Password selalu kosong di awal
        role: initialData?.role || (availableRoles.length > 0 ? availableRoles[0] : ''), // Default role pertama
        baseSalary: initialData?.baseSalary || null,
      });
      const [error, setError] = useState<string | null>(null);

      // Mode edit ditentukan jika initialData ada dan punya id
      const isEditMode = !!(initialData && initialData.id);

      // Update state jika initialData berubah (untuk mode edit)
      useEffect(() => {
        if (initialData) {
          setFormData({
            id: initialData.id || undefined,
            name: initialData.name || '',
            email: initialData.email || '',
            password: '', // Jangan isi password saat edit
            role: initialData.role || (availableRoles.length > 0 ? availableRoles[0] : ''),
            baseSalary: initialData.baseSalary || null,
          });
        } else {
          // Reset form jika initialData null (mode tambah)
          setFormData({
            name: '', email: '', password: '',
            role: availableRoles.length > 0 ? availableRoles[0] : '',
            baseSalary: null,
          });
        }
      }, [initialData, availableRoles]); // Jalankan saat initialData atau availableRoles berubah

      // Handler untuk perubahan input
      const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
          ...prev,
          [name]: value === '' && name === 'baseSalary' ? null : value // Handle baseSalary kosong jadi null
        }));
      };

      // Handler untuk submit form
      const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        // Validasi dasar
        if (!formData.name || !formData.email || !formData.role) {
          setError("Nama, Email, dan Role wajib diisi.");
          return;
        }
        // Password wajib hanya saat tambah
        if (!isEditMode && (!formData.password || formData.password.length < 6)) {
          setError("Password wajib diisi (minimal 6 karakter) saat menambah pengguna baru.");
          return;
        }
        // Validasi format email (sederhana)
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError("Format email tidak valid.");
            return;
        }
        // Validasi baseSalary jika diisi
        if (formData.baseSalary !== null && isNaN(Number(formData.baseSalary))) {
            setError("Gaji Pokok harus berupa angka.");
            return;
        }

        // Panggil fungsi onSubmit dari parent dengan data form
        try {
          await onSubmit(formData);
          // Jika sukses, parent component akan menutup form ini
        } catch (submitError: unknown) {
           // Tangkap error dari parent jika perlu ditampilkan di form
           const errorMessage = submitError instanceof Error ? submitError.message : 'Terjadi kesalahan.';
           setError(errorMessage);
        }
      };

      return (
        // Styling form bisa disesuaikan (misal pakai modal)
        <div style={formStyles.overlay}>
          <div style={formStyles.formContainer}>
            <h3>{isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
            <form onSubmit={handleSubmit}>
              {/* Input Nama */}
              <div style={formStyles.inputGroup}>
                <label htmlFor="name">Nama:</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
              </div>

              {/* Input Email */}
              <div style={formStyles.inputGroup}>
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading || isEditMode} />
                 {isEditMode && <small> (Email tidak dapat diubah)</small>}
              </div>

              {/* Input Password (hanya tampil saat tambah) */}
              {!isEditMode && (
                <div style={formStyles.inputGroup}>
                  <label htmlFor="password">Password:</label>
                  <input type="password" id="password" name="password" value={formData.password || ''} onChange={handleChange} required disabled={isLoading} minLength={6} />
                  <small> (Minimal 6 karakter)</small>
                </div>
              )}

              {/* Input Role (Select/Dropdown) */}
              <div style={formStyles.inputGroup}>
                <label htmlFor="role">Role:</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange} required disabled={isLoading}>
                  {availableRoles.map(roleOption => (
                    <option key={roleOption} value={roleOption}>{roleOption}</option>
                  ))}
                </select>
              </div>

              {/* Input Gaji Pokok */}
              <div style={formStyles.inputGroup}>
                <label htmlFor="baseSalary">Gaji Pokok (kosongkan jika null):</label>
                <input type="number" id="baseSalary" name="baseSalary" value={formData.baseSalary ?? ''} onChange={handleChange} disabled={isLoading} min="0" step="any"/>
              </div>

              {/* Tampilkan Error */}
              {error && <p style={formStyles.errorText}>{error}</p>}

              {/* Tombol Aksi */}
              <div style={formStyles.buttonGroup}>
                <button type="submit" disabled={isLoading} style={formStyles.submitButton}>
                  {isLoading ? 'Menyimpan...' : (isEditMode ? 'Update Pengguna' : 'Tambah Pengguna')}
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

    // Styling dasar untuk form (bisa dipindah ke CSS)
    const formStyles: { [key: string]: React.CSSProperties } = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
        formContainer: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' },
        inputGroup: { marginBottom: '15px' },
        label: { display: 'block', marginBottom: '5px', fontWeight: 'bold' },
        input: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
        select: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
        buttonGroup: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
        submitButton: { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
        cancelButton: { padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
        errorText: { color: 'red', fontSize: '14px', marginBottom: '15px' },
    };


    export default UserForm;
 
    