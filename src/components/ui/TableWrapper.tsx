// src/components/ui/TableWrapper.tsx
import React from 'react';

interface TableWrapperProps {
  children: React.ReactNode; // Biasanya berisi <table> itu sendiri
  title?: string;
  headerContent?: React.ReactNode; // Konten tambahan di header (misal, tombol tambah)
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
}

const TableWrapper: React.FC<TableWrapperProps> = ({
  children,
  title,
  headerContent,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "Tidak ada data untuk ditampilkan.",
  loadingMessage = "Sedang memuat data...",
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-xl overflow-hidden ${className}`}>
      {(title || headerContent) && (
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          {title && <h3 className="text-lg font-semibold text-slate-700 mb-2 sm:mb-0">{title}</h3>}
          {headerContent && <div className="sm:ml-auto">{headerContent}</div>}
        </div>
      )}
      {isLoading ? (
        <p className="p-10 text-center text-slate-500 text-lg">{loadingMessage}</p>
      ) : isEmpty ? (
        <p className="p-10 text-center text-slate-500 text-lg">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto w-full">
          {children} {/* Di sini Anda letakkan elemen <table> Anda */}
        </div>
      )}
      {/* Anda bisa menambahkan slot untuk pagination di sini jika perlu */}
    </div>
  );
};

export default TableWrapper;