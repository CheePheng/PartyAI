import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverEffect = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl
        ${hoverEffect ? 'hover:bg-white/15 hover:scale-[1.02] cursor-pointer motion-safe:transition-all duration-300 hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};