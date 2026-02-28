
import React, { useState } from 'react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { GameType, GameDefinition, Language } from '../types';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';
import { getGames } from '../utils/gameData';

interface GameMenuProps {
  onSelectGame: (gameId: GameType) => void;
  onBack: () => void;
  lang: Language;
}

export const GameMenu: React.FC<GameMenuProps> = ({ onSelectGame, onBack, lang }) => {
  const [selectedRuleGame, setSelectedRuleGame] = useState<GameDefinition | null>(null);
  const t = translations[lang];
  const games = getGames(lang);

  return (
    <div className="flex flex-col h-full motion-safe:animate-fade-in relative">
       {/* Background decorative elements */}
       <div className="absolute top-10 right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10 motion-safe:animate-pulse" />
       <div className="absolute bottom-10 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10 motion-safe:animate-pulse" style={{ animationDelay: '2s' }} />

       {/* Fixed Header Part */}
       <div className="flex-none flex items-center justify-between pb-6 pt-2 px-2 z-10">
          <button onClick={() => { playSound('click'); onBack(); }} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 font-bold group min-h-[44px] px-2 active:scale-95">
             <span className="group-hover:-translate-x-1 motion-safe:transition-transform">&larr;</span> {t.backToSetup}
          </button>
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">{t.chooseGame}</h2>
          <div className="w-8"></div>
       </div>

       {/* Scrollable Grid */}
       <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-2 -mx-2">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
           {games.map((game, index) => (
             <button
               key={game.id}
               onClick={() => { playSound('click'); onSelectGame(game.id); }}
               className="group relative flex flex-col text-left w-full h-auto min-h-[160px] rounded-[2rem] overflow-hidden motion-safe:transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ring-1 ring-white/5 hover:ring-white/20 shadow-xl hover:shadow-2xl motion-safe:animate-slide-in"
               style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
             >
               {/* Animated Gradient Background */}
               <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-20 group-hover:opacity-30 motion-safe:transition-opacity duration-500`} />
               <div className="absolute inset-0 bg-[#0f172a] -z-10" />
               
               {/* Shine Effect Overlay */}
               <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 motion-safe:transition-opacity duration-500 pointer-events-none" />

               <div className="relative z-10 p-5 flex flex-col h-full">
                 <div className="flex justify-between items-start mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner border border-white/10 group-hover:scale-110 group-hover:rotate-3 motion-safe:transition-transform duration-300">
                        {game.icon}
                    </div>
                    
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            playSound('click');
                            setSelectedRuleGame(game);
                        }}
                        className="px-4 py-2 min-h-[44px] flex items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/20 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-colors cursor-pointer z-20 backdrop-blur-sm active:scale-95"
                    >
                        {t.rulesBtn}
                    </div>
                 </div>

                 <h3 className="text-xl font-black text-white mb-1 tracking-tight group-hover:translate-x-1 motion-safe:transition-transform duration-300">
                    {game.title[lang]}
                 </h3>
                 
                 <p className="text-sm text-gray-400 font-medium leading-relaxed opacity-90 mb-4 line-clamp-2">
                    {game.description[lang]}
                 </p>

                 <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-gray-300 uppercase tracking-widest border border-white/5">
                           {game.minPlayers}+ Players
                        </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:text-indigo-600 motion-safe:transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:shadow-white/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-0.5 motion-safe:transition-transform" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                 </div>
               </div>
             </button>
           ))}
         </div>
       </div>

       <Modal 
         isOpen={!!selectedRuleGame} 
         onClose={() => setSelectedRuleGame(null)} 
         title={selectedRuleGame?.title[lang] || 'Rules'}
       >
         <div className="space-y-6">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="text-4xl">{selectedRuleGame?.icon}</div>
                <div>
                    <h3 className="font-bold text-lg">{selectedRuleGame?.title[lang]}</h3>
                    <p className="text-sm text-gray-400">{selectedRuleGame?.description[lang]}</p>
                </div>
            </div>

            <div className="bg-[#0f172a]/50 p-6 rounded-2xl space-y-4 border border-white/5 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${selectedRuleGame?.color || 'from-white to-white'}`}></div>
              <h4 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-2">How to Play</h4>
              {selectedRuleGame?.rules[lang].split('\n').map((line, i) => (
                <div key={i} className="flex gap-3 text-gray-200">
                    <span className="font-mono text-white/50 font-bold select-none">{i+1}.</span>
                    <p className="leading-relaxed font-medium">{line.substring(2)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
               <Button onClick={() => setSelectedRuleGame(null)} className="w-full sm:w-auto">Got it!</Button>
            </div>
         </div>
       </Modal>
    </div>
  );
};
