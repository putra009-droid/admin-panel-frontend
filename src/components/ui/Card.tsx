// src/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string; // Untuk kustomisasi tambahan dari luar
  titleClassName?: string;
  bodyClassName?: string;
  footer?: React.ReactNode; // Opsional footer untuk kartu
  footerClassName?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  titleClassName = '',
  bodyClassName = '',
  footer,
  footerClassName = ''
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out ${className}`}>
      {title && (
        <div className={`px-5 py-4 border-b border-slate-200 ${titleClassName}`}>
          <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className={`px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;