import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-2xl motion-safe:transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const variants = {
    primary: "bg-gradient-to-br from-theme-accent to-theme-accent-hover hover:from-theme-accent-hover hover:to-theme-accent text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-white/10",
    secondary: "bg-theme-card/50 hover:bg-theme-card/80 text-theme-text border border-white/10 backdrop-blur-md shadow-lg",
    danger: "bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-[0_8px_30px_rgba(225,29,72,0.3)] border border-red-400/20",
    ghost: "bg-transparent hover:bg-theme-card/50 text-theme-muted hover:text-theme-text"
  };

  const sizes = {
    sm: "px-5 py-2.5 text-sm min-h-[44px]",
    md: "px-7 py-3.5 text-base min-h-[48px]",
    lg: "px-9 py-4 text-lg min-h-[56px] tracking-wide",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};