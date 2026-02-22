import React from 'react';
import { Player, Language } from '../types';
import { Modal } from './Modal';
import { translations } from '../utils/i18n';

interface ScoreboardProps {
  players: Player[];
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ players, isOpen, onClose, lang }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const t = translations[lang];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`🏆 ${t.leaderboardBtn}`}>
       <div className="space-y-3">
         {sortedPlayers.map((player, index) => (
           <div 
             key={player.id} 
             className={`flex items-center justify-between p-4 rounded-xl border ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-white/5 border-white/5'}`}
           >
             <div className="flex items-center gap-4">
               <span className="font-mono text-lg text-gray-500 w-6">#{index + 1}</span>
               <div className="flex flex-col">
                 <span className="font-bold text-lg flex items-center gap-2">
                   {player.avatar} {player.name}
                 </span>
                 {index === 0 && <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Winning</span>}
               </div>
             </div>
             <div className="text-2xl font-bold font-mono text-indigo-300">
               {player.score}
             </div>
           </div>
         ))}
       </div>
    </Modal>
  );
};