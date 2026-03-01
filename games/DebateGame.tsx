
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { Player, DebatePrompt, Language, GameType, RoundResult, PartySettings } from '../types';
import { generateDebateTopic, consumePrefetch, prefetchGame } from '../services/geminiService';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface DebateGameProps {
  players: Player[];
  onUpdateScore: (playerId: string, points: number) => void;
  onRoundComplete: (result: RoundResult) => void;
  onExit: () => void;
  settings: PartySettings;
}

export const DebateGame: React.FC<DebateGameProps> = ({ players, onUpdateScore, onRoundComplete, onExit, settings }) => {
  const [topic, setTopic] = useState<DebatePrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [p1Index, setP1Index] = useState(0);
  const [p2Index, setP2Index] = useState(1);
  const [stage, setStage] = useState<'SETUP' | 'DEBATING' | 'VOTING'>('SETUP');
  const [duration, setDuration] = useState(60);
  const [timer, setTimer] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const lang = settings.language;
  const t = translations[lang];
  const player1 = players[p1Index];
  const player2 = players[p2Index];

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && timer > 0) {
      interval = window.setInterval(() => {
          setTimer(t => {
              if(t <= 4 && t > 1) playSound('tick');
              return t - 1;
          });
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      playSound('error');
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const generate = async () => {
    playSound('click');
    setLoading(true);
    setError(null);
    
    const prefetched = consumePrefetch<DebatePrompt>('debate', settings);
    if (prefetched) {
      setTopic(prefetched);
      setLoading(false);
      setStage('DEBATING');
      setTimer(duration);
      setIsTimerRunning(false);
      playSound('start');
      prefetchGame('debate', settings);
      return;
    }

    const response = await generateDebateTopic(settings);
    if (response.ok && response.data) {
      setTopic(response.data);
      setError(null);
      setStage('DEBATING');
      setTimer(duration);
      setIsTimerRunning(false);
      playSound('start');
    } else {
      setTopic(null);
      setError("Failed to generate debate topic. Please try again.");
    }
    setLoading(false);
    if (response.ok) prefetchGame('debate', settings);
  };

  const handleVote = (winnerIndex: number) => {
    playSound('win');
    
    const winner = players[winnerIndex];
    const loserIndex = winnerIndex === p1Index ? p2Index : p1Index;
    const loser = players[loserIndex];

    const result: RoundResult = {
        gameType: GameType.DEBATE,
        winners: [winner.id],
        scores: {
            [winner.id]: 5,
            [loser.id]: 0
        },
        timestamp: Date.now()
    };
    onRoundComplete(result);

    setStage('SETUP');
    setTopic(null);
    setError(null);
    // Cycle players
    setP1Index((prev) => (prev + 1) % players.length);
    setP2Index((prev) => (prev + 2) % players.length === (prev + 1) % players.length ? (prev + 3) % players.length : (prev + 2) % players.length);
  };

  if (loading) {
      return <LoadingView message={t.loadingDebate} gameType={GameType.DEBATE} />;
  }

  if (error) {
      return <ErrorView onRetry={generate} lang={settings.language} message={error} />;
  }

  if (stage === 'SETUP') {
    return (
        <div className="max-w-md mx-auto text-center space-y-6 animate-fade-in flex flex-col h-full">
            <h2 className="text-3xl font-bold">🗣️ {t.setupPhase}</h2>
            <Card className="space-y-6">
               <div className="flex justify-center items-center gap-4 text-xl font-bold bg-white/5 p-6 rounded-xl">
                   <div className="text-orange-400 flex flex-col items-center">
                       <span className="text-4xl mb-2">{player1.avatar}</span>
                       <span className="text-sm">{player1.name}</span>
                   </div>
                   <div className="text-sm text-gray-500 font-mono italic px-2">{t.vs}</div>
                   <div className="text-red-400 flex flex-col items-center">
                       <span className="text-4xl mb-2">{player2.avatar}</span>
                       <span className="text-sm">{player2.name}</span>
                   </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-400 mb-3">{t.timerLabel}: {duration}s</label>
                 <div className="flex justify-center gap-3">
                    {[30, 60, 90, 120].map(sec => (
                      <button
                        key={sec}
                        onClick={() => { setDuration(sec); playSound('click'); }}
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${duration === sec ? 'bg-orange-500 border-orange-500 text-white scale-110' : 'border-white/20 hover:bg-white/10'}`}
                      >
                        {sec}s
                      </button>
                    ))}
                 </div>
               </div>

               <Button onClick={generate} isLoading={loading} className="w-full text-lg shadow-xl shadow-orange-500/20">
                  {t.startDebate}
               </Button>
            </Card>
            <div className="flex-1"></div>
            <Button variant="ghost" onClick={onExit}>{t.exitGame}</Button>
        </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in flex flex-col h-full pb-32">
       <Card className="text-center py-6 bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-500/30 shadow-2xl shrink-0">
          <h2 className="text-xs uppercase tracking-widest text-orange-300 mb-2">{t.debateTopic}</h2>
          <h1 className="text-2xl font-extrabold text-white leading-tight">{topic?.topic}</h1>
       </Card>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
          <Card className="bg-orange-500/10 border-orange-500/50 p-4">
             <div className="text-center">
                 <div className="text-3xl mb-1">{player1.avatar}</div>
                 <h3 className="font-bold text-sm mb-2 text-orange-200">{player1.name}</h3>
                 <div className="p-3 bg-black/30 rounded-lg text-orange-100 italic border border-orange-500/20 text-sm leading-relaxed">
                    "{topic?.sideA}"
                 </div>
             </div>
          </Card>
          
          <Card className="bg-red-500/10 border-red-500/50 p-4">
             <div className="text-center">
                 <div className="text-3xl mb-1">{player2.avatar}</div>
                 <h3 className="font-bold text-sm mb-2 text-red-200">{player2.name}</h3>
                 <div className="p-3 bg-black/30 rounded-lg text-red-100 italic border border-red-500/20 text-sm leading-relaxed">
                    "{topic?.sideB}"
                 </div>
             </div>
          </Card>
       </div>

       {/* Sticky Bottom Controls */}
       {stage === 'DEBATING' && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent z-20 flex flex-col items-center pb-24 animate-slide-up">
            <div className="bg-[#1e293b]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-full max-w-md shadow-2xl flex items-center justify-between mb-3">
                 <div className={`text-4xl font-mono font-black ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timer}s</div>
                 {timer === 0 && <div className="text-red-400 font-bold animate-bounce text-sm">{t.timeUp}</div>}
                 <Button size="sm" onClick={() => { setIsTimerRunning(!isTimerRunning); playSound('click'); }} className={isTimerRunning ? 'bg-yellow-600' : 'bg-green-600'}>
                    {isTimerRunning ? 'Pause' : t.startTimer}
                 </Button>
            </div>
            <Button size="lg" className="w-full max-w-md shadow-xl" onClick={() => { setStage('VOTING'); playSound('click'); }}>
                {t.voteWinner}
            </Button>
         </div>
       )}

       {stage === 'VOTING' && (
           <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent z-20 flex flex-col items-center pb-24 animate-slide-up">
               <div className="bg-[#1e293b]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                   <h3 className="text-center font-bold mb-4 text-gray-400 uppercase text-xs tracking-widest">{t.audienceVote}</h3>
                   <div className="grid grid-cols-2 gap-4">
                       <Button onClick={() => handleVote(p1Index)} className="bg-orange-600 hover:bg-orange-500 py-4 text-lg">
                           {player1.name}
                       </Button>
                       <Button onClick={() => handleVote(p2Index)} className="bg-red-600 hover:bg-red-500 py-4 text-lg">
                           {player2.name}
                       </Button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
