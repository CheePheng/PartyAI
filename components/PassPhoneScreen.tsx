import React from 'react';
import { Button } from './Button';
import { Card } from './Card';

interface PassPhoneScreenProps {
  playerName: string;
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

export const PassPhoneScreen: React.FC<PassPhoneScreenProps> = ({ 
  playerName, 
  onConfirm, 
  onCancel,
  title = "Pass the device", 
  subtitle = "Keep secrets hidden! Don't let others see.",
  buttonText = "Tap to Reveal"
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 motion-safe:animate-fade-in max-w-md mx-auto w-full p-4 pb-safe">
      <div className="text-center space-y-2">
        <h3 className="text-xl text-theme-muted font-bold uppercase tracking-widest">Next Player</h3>
        <h2 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-theme-accent via-theme-accent-hover to-white tracking-tight leading-tight">
          {playerName}
        </h2>
      </div>
      
      <Card className="w-full p-8 sm:p-10 flex flex-col items-center justify-center space-y-8 border border-theme-accent/30 relative overflow-hidden shadow-[0_0_40px_var(--theme-accent-hover)]">
        <div className="absolute inset-0 bg-gradient-to-br from-theme-accent/10 to-transparent pointer-events-none" />
        
        <div className="text-8xl motion-safe:animate-bounce z-10 filter drop-shadow-2xl">📱</div>
        
        <div className="text-center z-10 space-y-2">
          <p className="text-2xl font-bold text-theme-text">{title}</p>
          <p className="text-sm text-theme-muted font-medium">{subtitle}</p>
        </div>
        
        <div className="w-full space-y-3 z-10">
          <Button 
            onClick={onConfirm} 
            className="w-full text-xl py-4 shadow-xl"
          >
            {buttonText}
          </Button>
          {onCancel && (
            <Button 
              variant="secondary"
              onClick={onCancel} 
              className="w-full text-lg py-3"
            >
              Cancel
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
