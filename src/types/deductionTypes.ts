// src/types/deductionTypes.ts

// 1. Definisikan tipe sebagai gabungan string literal (Type-Only, Erasable)
export type DeductionCalculationType =
  | 'FIXED_USER'
  | 'PERCENTAGE_USER'
  | 'PER_LATE_INSTANCE'
  | 'PER_ALPHA_DAY'
  | 'PERCENTAGE_ALPHA_DAY'
  | 'MANDATORY_PERCENTAGE';

// 2. Definisikan objek konstanta untuk nilai-nilai runtime
export const DeductionCalculationTypeValue = {
  FIXED_USER: 'FIXED_USER' as DeductionCalculationType,
  PERCENTAGE_USER: 'PERCENTAGE_USER' as DeductionCalculationType,
  PER_LATE_INSTANCE: 'PER_LATE_INSTANCE' as DeductionCalculationType,
  PER_ALPHA_DAY: 'PER_ALPHA_DAY' as DeductionCalculationType,
  PERCENTAGE_ALPHA_DAY: 'PERCENTAGE_ALPHA_DAY' as DeductionCalculationType,
  MANDATORY_PERCENTAGE: 'MANDATORY_PERCENTAGE' as DeductionCalculationType,
} as const; // 'as const' membuat objek ini readonly dan tipenya lebih spesifik

// Helper untuk mendapatkan semua nilai enum (jika masih diperlukan untuk iterasi, misal di form)
export const AllDeductionCalculationTypes = Object.values(DeductionCalculationTypeValue);
