
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingView } from '../components/LoadingView';
import { Player, CategoryRushRound, Language, GameType, RoundResult, PartySettings } from '../types';
import { generateCategoryRush } from '../services/geminiService';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface CategoryRushGameProps {
  players: Player[];
  onUpdateScore: (playerId: string, points: number) => void;
  onRoundComplete: (result: RoundResult) => void;
  onExit: () => void;
  settings: PartySettings;
}

export const CategoryRushGame: React.FC<CategoryRushGameProps> = ({ players, onUpdateScore, onRoundComplete, onExit, settings }) => {
  const [roundData, setRoundData] = useState<CategoryRushRound | null>(null);
  const [loading, setLoading] = useState(false);
  const [roundDuration, setRoundDuration] = useState(90);
  const [timer, setTimer] = useState<number>(90);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stage, setStage] = useState<'SETUP' | 'PLAYING' | 'SCORING'>('SETUP');
  
  const lang = settings.language;
  const t = translations[lang];

  useEffect(() => {
    let interval: number;
    if (isPlaying && timer > 0) {
      interval = window.setInterval(() => {
        setTimer(t => {
           if (t <= 4 && t > 1) playSound('tick');
           return t - 1;
        });
      }, 1000);
    } else if (timer === 0 && isPlaying) {
      playSound('error');
      setIsPlaying(false);
      setStage('SCORING');
    }
    return () => clearInterval(interval);
  }, [isPlaying, timer]);

  const startRound = async () => {
    playSound('click');
    setLoading(true);
    const response = await generateCategoryRush(settings);
    setRoundData(response.ok ? response.data : null);
    setLoading(false);
    setStage('PLAYING');
    setIsPlaying(true);
    setTimer(roundDuration);
    playSound('start');
  };

  const awardWinner = (winner: Player | null) => {
    playSound('success');
    
    const scores: Record<string, number> = {};
    players.forEach(p => {
        scores[p.id] = (winner && p.id === winner.id) ? 5 : 0;
    });

    const result: RoundResult = {
        gameType: GameType.SCATTERGORIES,
        winners: winner ? [winner.id] : [],
        scores: scores,
        timestamp: Date.now()
    };
    onRoundComplete(result);

    setStage('SETUP');
    setRoundData(null);
  };

  if (loading) {
      return <LoadingView message={t.loadingScatter} gameType={GameType.SCATTERGORIES} />;
  }

  if (stage === 'SETUP') {
    return (
        <div className="max-w-md mx-auto text-center space-y-6 flex flex-col h-full">
            <h2 className="text-3xl font-bold">📝 {t.setupPhase}</h2>
            <Card className="space-y-6">
               <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                 <h3 className="font-bold text-gray-300 mb-2">{t.instructions}</h3>
                 <p className="text-sm text-gray-400 leading-relaxed">{t.scatterInstr}</p>
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-400 mb-3">{t.timerLabel}: {roundDuration}s</label>
                 <div className="flex justify-center gap-3">
                    {[60, 90, 120, 180].map(sec => (
                      <button
                        key={sec}
                        onClick={() => { setRoundDuration(sec); playSound('click'); }}
                        className={`px-4 py-2 rounded-xl border-2 font-bold transition-all ${roundDuration === sec ? 'bg-orange-500 border-orange-500 text-white scale-110' : 'border-white/20 hover:bg-white/10'}`}
                      >
                        {sec}s
                      </button>
                    ))}
                 </div>
               </div>

               <Button onClick={startRound} isLoading={loading} className="w-full text-lg shadow-xl shadow-orange-500/20">
                  {t.startRound}
               </Button>
            </Card>
            <div className="flex-1"></div>
            <Button variant="ghost" onClick={onExit}>{t.exitGame}</Button>
        </div>
    );
  }

  return (
    <div className="max-w-md mx-auto flex flex-col h-full pb-32">
       <div className="flex justify-between items-center px-2 mb-4">
         <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-widest text-orange-400">{t.appTitle}</span>
         </div>
         <div className={`text-4xl font-mono font-black ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timer}s
         </div>
       </div>

       {stage === 'PLAYING' && roundData && (
         <div className="flex-1 space-y-4 animate-fade-in">
           <Card className="bg-gradient-to-br from-orange-500/20 to-pink-500/20 border-orange-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-gray-400 block">{t.letter}</span>
                <span className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">{roundData.letter}</span>
              </div>
              <div className="text-right">
                 <div className="text-4xl">🎲</div>
              </div>
           </Card>

           <Card className="space-y-4">
             <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-white/10 pb-2">{t.categories}</h3>
             <ul className="space-y-3">
                {roundData.categories.map((cat, idx) => (
                  <li key={idx} className="flex gap-3 text-lg font-bold text-gray-200">
                     <span className="text-orange-500 font-mono">{idx + 1}.</span>
                     <span>{cat}</span>
                  </li>
                ))}
             </ul>
           </Card>
           
           <div className="text-center text-sm text-gray-500 italic animate-pulse">
             {t.scatterInstr}
           </div>
         </div>
       )}

       {stage === 'SCORING' && (
         <div className="flex-1 flex flex-col justify-center animate-slide-up">
            <Card className="text-center space-y-6">
                <h3 className="text-3xl font-bold text-white">{t.timeUp}</h3>
                <p className="text-gray-400">{t.roundWinner}</p>
                <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2">
                    {players.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => awardWinner(p)}
                        className="flex flex-col items-center p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all active:scale-95"
                      >
                         <span className="text-2xl mb-1">{p.avatar}</span>
                         <span className="font-bold text-sm truncate w-full">{p.name}</span>
                      </button>
                    ))}
                    <button 
                        onClick={() => awardWinner(null)}
                        className="col-span-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-gray-400 text-sm font-bold"
                    >
                        No Winner / Skip
                    </button>
                </div>
            </Card>
         </div>
       )}
    </div>
  );
};
