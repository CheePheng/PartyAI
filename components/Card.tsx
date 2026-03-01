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
        relative overflow-hidden bg-theme-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl
        ${hoverEffect ? 'hover:bg-theme-card/60 hover:scale-[1.02] cursor-pointer motion-safe:transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]' : ''}
        ${className}
      `}
    >
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};