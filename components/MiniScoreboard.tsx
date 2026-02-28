import React from 'react';
import { Player } from '../types';

interface MiniScoreboardProps {
  players: Player[];
}

export const MiniScoreboard: React.FC<MiniScoreboardProps> = ({ players }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f172a]/90 backdrop-blur-2xl border-t border-white/5 pb-safe pt-4 px-4 sm:px-6 shadow-[0_-20px_40px_rgba(0,0,0,0.4)] motion-safe:animate-slide-up">
       <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x items-center">
          {/* Label for context */}
          <div className="hidden sm:block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap">
             Top Scores
          </div>

          {sortedPlayers.map((player, idx) => {
             const isFirst = idx === 0 && player.score > 0;
             const isSecond = idx === 1 && player.score > 0;
             const isThird = idx === 2 && player.score > 0;
             
             let borderColor = "border-white/5";
             let bgClasses = "bg-white/5";
             let scoreColor = "text-indigo-300";
             let rankIcon = null;

             if (isFirst) {
               borderColor = "border-yellow-500/40";
               bgClasses = "bg-gradient-to-br from-yellow-500/10 to-amber-500/5";
               scoreColor = "text-yellow-400";
               rankIcon = "👑";
             } else if (isSecond) {
               borderColor = "border-slate-400/30";
               bgClasses = "bg-gradient-to-br from-slate-400/10 to-slate-500/5";
               scoreColor = "text-slate-300";
               rankIcon = "🥈";
             } else if (isThird) {
               borderColor = "border-orange-700/30";
               bgClasses = "bg-gradient-to-br from-orange-700/10 to-orange-800/5";
               scoreColor = "text-orange-300";
               rankIcon = "🥉";
             }

             return (
               <div 
                 key={player.id} 
                 className={`
                    flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border ${borderColor} ${bgClasses} 
                    min-w-[140px] snap-center motion-safe:transition-all duration-300 relative overflow-hidden group
                 `}
               >
                  <span className="text-3xl drop-shadow-md filter group-hover:scale-110 motion-safe:transition-transform duration-200">
                    {player.avatar}
                  </span>
                  
                  <div className="flex flex-col z-10">
                     <span className="text-xs font-bold truncate max-w-[90px] text-gray-200 uppercase tracking-wider opacity-90">
                       {player.name}
                     </span>
                     <span className={`text-xl font-mono font-black leading-none tracking-tighter ${scoreColor}`}>
                       {player.score}
                     </span>
                  </div>
                  
                  {rankIcon && (
                    <div className="absolute right-1 bottom-1 text-2xl opacity-10 group-hover:opacity-20 transition-opacity">
                      {rankIcon}
                    </div>
                  )}

                  {/* Subtle shine effect for #1 */}
                  {isFirst && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}
               </div>
             );
          })}
       </div>
    </div>
  );
};