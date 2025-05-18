// src/components/ui/Alert.tsx
import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  className?: string;
  showIcon?: boolean;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({
  children,
  type = 'info',
  title,
  className = '',
  showIcon = true,
  onClose
}) => {
  let baseClasses = 'border-l-4 p-4 rounded-md shadow-md mb-4 relative'; // Tambahkan relative untuk positioning tombol close
  let iconContainerClasses = 'h-5 w-5 mr-3 flex-shrink-0'; // flex-shrink-0 agar ikon tidak mengecil
  let iconContent: React.ReactNode = null; // Variabel untuk menampung JSX ikon

  switch (type) {
    case 'success':
      baseClasses += ' bg-green-50 border-green-500 text-green-700';
      iconContainerClasses += ' text-green-500';
      iconContent = ( // Contoh ikon SVG atau emoji (ganti dengan komponen ikon jika ada)
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
      break;
    case 'error':
      baseClasses += ' bg-red-50 border-red-500 text-red-700';
      iconContainerClasses += ' text-red-500';
      iconContent = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 101.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
      break;
    case 'warning':
      baseClasses += ' bg-yellow-50 border-yellow-500 text-yellow-700';
      iconContainerClasses += ' text-yellow-500';
      iconContent = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-5.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
        </svg>
      );
      break;
    case 'info':
    default:
      baseClasses += ' bg-sky-50 border-sky-500 text-sky-700';
      iconContainerClasses += ' text-sky-500';
      iconContent = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
      break;
  }

  return (
    <div className={`${baseClasses} ${className}`} role="alert">
      <div className="flex items-start">
        {showIcon && iconContent && (
          <div className={iconContainerClasses}> {/* Menggunakan div untuk konsistensi styling ikon */}
            {iconContent}
          </div>
        )}
        <div className={`flex-1 ${showIcon && iconContent ? 'ml-3' : ''}`}>
          {title && <p className="text-sm font-bold mb-1">{title}</p>}
          <p className="text-sm">{children}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            // Styling tombol close disesuaikan agar lebih baik posisinya
            className="ml-auto -mx-1.5 -my-1.5 bg-transparent rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8"
            // Sesuaikan warna ring dan hover berdasarkan tipe alert
            // Contoh untuk tipe info (sky), Anda bisa menambahkan logika serupa untuk tipe lain
            style={{ color: type === 'info' ? 'rgb(var(--color-sky-700))' : type === 'success' ? 'rgb(var(--color-green-700))' : type === 'error' ? 'rgb(var(--color-red-700))' : 'rgb(var(--color-yellow-700))' }}
            // className={`ml-auto -mx-1.5 -my-1.5 bg-transparent rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8 
            //             ${type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-400' : ''}
            //             ${type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-400' : ''}
            //             ${type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-400' : ''}
            //             ${type === 'info' ? 'text-sky-500 hover:bg-sky-100 focus:ring-sky-400' : ''}
            // `}
            aria-label="Dismiss"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;