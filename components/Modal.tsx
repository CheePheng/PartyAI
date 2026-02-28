
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 pb-safe pt-safe">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm motion-safe:transition-opacity motion-safe:animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-white/20 rounded-[2rem] w-full max-w-lg shadow-2xl motion-safe:animate-slide-up flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex-none flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight leading-none">{title}</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors active:scale-95"
          >
            ✕
          </button>
        </div>
        
        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 text-gray-200 scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
};
