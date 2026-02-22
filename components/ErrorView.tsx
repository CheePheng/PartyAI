
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
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in p-6">
      <Card className="text-center max-w-sm border-red-500/30 bg-red-900/10">
        <div className="text-6xl mb-4 animate-shake">🤖💥</div>
        <h3 className="text-2xl font-bold text-red-400 mb-2">
          {t.errorTitle}
        </h3>
        <p className="text-gray-300 mb-6 leading-relaxed">
          {message || t.errorDesc}
        </p>
        <Button onClick={onRetry} variant="primary" className="w-full">
          {t.retryBtn}
        </Button>
      </Card>
    </div>
  );
};
