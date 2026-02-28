
import React from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { translations } from '../utils/i18n';
import { Language } from '../types';

interface ErrorViewProps {
  onRetry: () => void;
  lang: Language;
  message?: string;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ onRetry, lang, message }) => {
  const t = translations[lang];

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] motion-safe:animate-fade-in p-6">
      <Card className="text-center max-w-sm border-red-500/30 bg-red-900/10 shadow-[0_0_40px_rgba(220,38,38,0.15)]">
        <div className="text-6xl mb-6 motion-safe:animate-shake">🤖💥</div>
        <h3 className="text-2xl font-black text-red-400 mb-3 tracking-tight">
          {t.errorTitle}
        </h3>
        <p className="text-gray-300 mb-8 leading-relaxed font-medium">
          {message || t.errorDesc}
        </p>
        <Button onClick={onRetry} variant="danger" className="w-full text-lg py-4 shadow-xl shadow-red-500/20">
          {t.retryBtn}
        </Button>
      </Card>
    </div>
  );
};
