import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { PartySettings, Theme, Intensity, Language } from '../types';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface PartySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PartySettings;
  onSettingsChange: (newSettings: PartySettings) => void;
}

const THEMES: { id: Theme; label: Record<Language, string>; icon: string }[] = [
  { id: 'default', label: { en: 'Default', zh: '默认' }, icon: '🎲' },
  { id: 'horror', label: { en: 'Horror', zh: '恐怖' }, icon: '👻' },
  { id: 'anime', label: { en: 'Anime', zh: '动漫' }, icon: '🌸' },
  { id: 'sports', label: { en: 'Sports', zh: '体育' }, icon: '⚽' },
  { id: 'kpop', label: { en: 'K-Pop', zh: 'K-Pop' }, icon: '🎤' },
  { id: 'sg_my', label: { en: 'SG/MY Local', zh: '新马本地' }, icon: '🇸🇬' },
];

const INTENSITIES: { id: Intensity; label: Record<Language, string>; icon: string; desc: Record<Language, string> }[] = [
  { id: 'family', label: { en: 'Family', zh: '家庭' }, icon: '👨‍👩‍👧‍👦', desc: { en: 'Safe for everyone', zh: '老少皆宜' } },
  { id: 'pg13', label: { en: 'PG-13', zh: 'PG-13' }, icon: '😎', desc: { en: 'A bit edgy', zh: '有点刺激' } },
  { id: 'spicy', label: { en: 'Spicy', zh: '火辣' }, icon: '🌶️', desc: { en: 'Adults only', zh: '仅限成人' } },
];

export const PartySettingsModal: React.FC<PartySettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const t = translations[settings.language];

  const updateSetting = <K extends keyof PartySettings>(key: K, value: PartySettings[K]) => {
    playSound('click');
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Party Settings">
      <div className="space-y-8">
        {/* Language */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Language / 语言</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateSetting('language', 'en')}
              className={`p-3 rounded-xl border-2 font-bold transition-all ${settings.language === 'en' ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              English
            </button>
            <button
              onClick={() => updateSetting('language', 'zh')}
              className={`p-3 rounded-xl border-2 font-bold transition-all ${settings.language === 'zh' ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              简体中文
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Theme</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => updateSetting('theme', theme.id)}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.theme === theme.id ? 'border-pink-500 bg-pink-500/20 text-pink-300 scale-105' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                <span className="text-2xl">{theme.icon}</span>
                <span className="text-xs font-bold">{theme.label[settings.language]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Intensity */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Intensity</h3>
          <div className="flex flex-col gap-3">
            {INTENSITIES.map(intensity => (
              <button
                key={intensity.id}
                onClick={() => updateSetting('intensity', intensity.id)}
                className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left ${settings.intensity === intensity.id ? 'border-orange-500 bg-orange-500/20 text-orange-300' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                <span className="text-3xl">{intensity.icon}</span>
                <div>
                  <div className="font-bold">{intensity.label[settings.language]}</div>
                  <div className="text-xs opacity-70">{intensity.desc[settings.language]}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Accessibility</h3>
          <button
            onClick={() => updateSetting('highContrast', !settings.highContrast)}
            className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${settings.highContrast ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">👁️</span>
              <div className="text-left">
                <div className="font-bold">High Contrast Mode</div>
                <div className="text-xs opacity-70">Improve readability</div>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.highContrast ? 'bg-indigo-500' : 'bg-white/20'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.highContrast ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>

        <Button onClick={onClose} className="w-full mt-4">
          Done
        </Button>
      </div>
    </Modal>
  );
};
