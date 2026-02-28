
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingView } from '../components/LoadingView';
import { PassPhoneScreen } from '../components/PassPhoneScreen';
import { Player, ImpostorScenario, Language, GameType, RoundResult, PartySettings } from '../types';
import { generateImpostorScenario } from '../services/geminiService';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface ImpostorGameProps {
  players: Player[];
  onUpdateScore: (playerId: string, points: number) => void;
  onRoundComplete: (result: RoundResult) => void;
  onExit: () => void;
  settings: PartySettings;
}

export const ImpostorGame: React.FC<ImpostorGameProps> = ({ players, onUpdateScore, onRoundComplete, onExit, settings }) => {
  const [scenario, setScenario] = useState<ImpostorScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [playerRoles, setPlayerRoles] = useState<{playerId: string, role: string, isImpostor: boolean}[]>([]);
  const [viewingIndex, setViewingIndex] = useState(-1);
  const [isRevealed, setIsRevealed] = useState(false);
  const [phase, setPhase] = useState<'SETUP' | 'VIEWING' | 'PLAYING' | 'VOTING' | 'GUESS_LOCATION'>('SETUP');
  
  // Timer settings
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [timer, setTimer] = useState(5 * 60);
  const [gameActive, setGameActive] = useState(false);
  const [impostorCaught, setImpostorCaught] = useState(false);

  const lang = settings.language;
  const t = translations[lang];

  useEffect(() => {
    let interval: number;
    if (gameActive && timer > 0) {
      interval = window.setInterval(() => {
        setTimer(t => {
            if (t <= 10 && t > 1) playSound('tick');
            return t - 1;
        });
      }, 1000);
    } else if (timer === 0 && gameActive) {
        playSound('error');
        setGameActive(false);
    }
    return () => clearInterval(interval);
  }, [gameActive, timer]);

  const startGame = async () => {
    playSound('click');
    setLoading(true);
    const response = await generateImpostorScenario(players.length, settings);
    const data = response.ok ? response.data : null;
    
    if (!data) {
        setLoading(false);
        return;
    }

    setScenario(data);
    
    const impostorIndex = Math.floor(Math.random() * players.length);
    const assignments = players.map((p, idx) => ({
      playerId: p.id,
      role: idx === impostorIndex ? t.youAreImpostor : data.roles[idx > impostorIndex ? idx - 1 : idx],
      isImpostor: idx === impostorIndex
    }));
    
    setPlayerRoles(assignments);
    setLoading(false);
    setViewingIndex(0);
    setIsRevealed(false);
    setTimer(durationMinutes * 60);
    setPhase('VIEWING');
  };

  const nextPlayer = () => {
    playSound('click');
    setIsRevealed(false);
    setViewingIndex(prev => prev + 1);
    if (viewingIndex + 1 >= players.length) {
        setGameActive(true);
        setPhase('PLAYING');
        playSound('start');
    }
  };

  const handleVote = (targetId: string) => {
      const targetRole = playerRoles.find(p => p.playerId === targetId);
      if (targetRole?.isImpostor) {
          playSound('success');
          setImpostorCaught(true);
          setPhase('GUESS_LOCATION'); 
          // Impostor caught. They can still win if they guess location.
          // We will handle scoring in the GUESS_LOCATION phase.
      } else {
          playSound('error');
          setImpostorCaught(false);
          setPhase('GUESS_LOCATION'); 
          
          // Innocents voted wrong. Impostor wins immediately.
          const impostor = players.find(p => playerRoles.find(pr => pr.playerId === p.id)?.isImpostor);
          const innocents = players.filter(p => p.id !== impostor?.id);
          
          if (impostor) {
             const result: RoundResult = {
                gameType: GameType.IMPOSTOR,
                winners: [impostor.id],
                scores: {
                    [impostor.id]: 10,
                    ...innocents.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
                },
                timestamp: Date.now()
            };
            onRoundComplete(result);
          }
      }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
      return <LoadingView message={t.loadingImpostor} gameType={GameType.IMPOSTOR} />;
  }

  if (phase === 'SETUP') {
     return (
        <div className="max-w-md mx-auto text-center space-y-6 flex flex-col h-full animate-fade-in">
            <h2 className="text-3xl font-bold">🕵️ {t.setupPhase}</h2>
            <Card className="space-y-6">
               <p className="text-gray-300">
                 {t.impostorRole}
               </p>

               <div>
                 <label className="block text-sm text-gray-400 mb-2">{t.timerLabel}: {durationMinutes} min</label>
                 <div className="flex justify-center gap-2">
                    {[3, 5, 8, 10].map(min => (
                      <button
                        key={min}
                        onClick={() => { setDurationMinutes(min); playSound('click'); }}
                        className={`px-3 py-1 rounded-lg border text-sm font-bold transition-all ${durationMinutes === min ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-white/20 hover:bg-white/10'}`}
                      >
                        {min}m
                      </button>
                    ))}
                 </div>
               </div>

               <Button onClick={startGame} className="w-full">
                  {t.spyfallStart}
               </Button>
            </Card>
            <div className="flex-1"></div>
            <Button variant="ghost" onClick={onExit}>{t.exitGame}</Button>
        </div>
     );
  }

  // Viewing Phase
  if (phase === 'VIEWING') {
    const currentPlayer = players[viewingIndex];
    const roleInfo = playerRoles[viewingIndex];

    if (!isRevealed) {
      return (
        <PassPhoneScreen 
          playerName={currentPlayer.name} 
          onConfirm={() => { setIsRevealed(true); playSound('click'); }} 
          title={`Pass device to ${currentPlayer.name}`}
          buttonText={`I am ${currentPlayer.name}`}
        />
      );
    }

    return (
      <div className="max-w-md mx-auto space-y-6 text-center animate-fade-in">
        <h3 className="text-xl text-gray-400 font-bold uppercase tracking-widest">{t.nextPlayer}</h3>
        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{currentPlayer.name}</h2>
        
        <Card className="min-h-[300px] flex flex-col justify-center items-center relative overflow-hidden">
             <div className="space-y-6 animate-fade-in w-full">
                {roleInfo.isImpostor ? (
                  <div className="text-red-500">
                    <div className="text-6xl mb-4">🤫</div>
                    <h3 className="text-3xl font-extrabold uppercase">{t.youAreImpostor}</h3>
                    <p className="mt-2 text-gray-300">{t.blendIn}</p>
                  </div>
                ) : (
                  <div className="text-emerald-400">
                    <div className="text-6xl mb-4">📍</div>
                    <p className="text-sm text-gray-400 uppercase tracking-widest">{t.impostorLocation}</p>
                    <h3 className="text-3xl font-extrabold text-white mb-6">{scenario?.location}</h3>
                    <p className="text-sm text-gray-400 uppercase tracking-widest">{t.impostorRole}</p>
                    <h4 className="text-xl font-bold text-emerald-200">{roleInfo.role}</h4>
                  </div>
                )}
                
                <Button onClick={nextPlayer} className="w-full mt-6">
                   {t.correctBtn}
                </Button>
             </div>
        </Card>
      </div>
    );
  }

  // Final Reveal / Location Guess
  if (phase === 'GUESS_LOCATION') {
      const impostor = players.find(p => playerRoles.find(pr => pr.playerId === p.id)?.isImpostor);

      return (
          <div className="max-w-md mx-auto text-center space-y-6 animate-fade-in flex flex-col justify-center h-full">
               <Card className="p-8 space-y-6">
                   {impostorCaught ? (
                       <>
                           <div className="text-6xl">🎯</div>
                           <h2 className="text-3xl font-bold text-green-400">IMPOSTOR CAUGHT!</h2>
                           <p className="text-gray-300">The Impostor was <strong>{impostor?.name}</strong>.</p>
                           <div className="p-4 bg-white/10 rounded-xl">
                               <p className="text-sm font-bold text-gray-400 uppercase">Impostor's Last Chance</p>
                               <p className="mb-2">If they guess the location, they win!</p>
                               <div className="text-2xl font-black text-emerald-400">{scenario?.location}</div>
                           </div>
                       </>
                   ) : (
                       <>
                           <div className="text-6xl">🕵️‍♂️</div>
                           <h2 className="text-3xl font-bold text-red-500">IMPOSTOR WINS!</h2>
                           <p className="text-gray-300">The innocents voted incorrectly.</p>
                           <div className="p-4 bg-white/10 rounded-xl mt-4">
                               <p className="text-sm text-gray-400">The Impostor was:</p>
                               <p className="text-2xl font-bold text-red-400">{impostor?.name}</p>
                           </div>
                       </>
                   )}
                   <Button onClick={() => { setPhase('SETUP'); setScenario(null); }} className="w-full">Play Again</Button>
               </Card>
          </div>
      );
  }

  // Voting Phase
  if (phase === 'VOTING') {
      return (
          <div className="max-w-md mx-auto space-y-4 pb-safe animate-fade-in">
              <div className="text-center mb-4">
                  <h2 className="text-3xl font-bold text-red-500 animate-pulse">VOTE!</h2>
                  <p className="text-gray-400">Who is the Impostor?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                  {players.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => handleVote(p.id)}
                        className="bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-500 p-4 rounded-xl flex flex-col items-center transition-all active:scale-95"
                      >
                          <span className="text-4xl mb-2">{p.avatar}</span>
                          <span className="font-bold">{p.name}</span>
                      </button>
                  ))}
              </div>
              <div className="mt-8">
                  <Button variant="secondary" onClick={() => setPhase('PLAYING')} className="w-full">Cancel Vote</Button>
              </div>
          </div>
      );
  }

  // Playing Phase
  return (
    <div className="max-w-md mx-auto text-center space-y-6 animate-fade-in flex flex-col h-full">
       <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-red-500">{t.impostorActive}</h2>
            <div className={`text-3xl font-mono font-bold ${timer < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {formatTime(timer)}
            </div>
       </div>

       <Card className="flex-1 flex flex-col items-center justify-center space-y-8">
         <div className="text-8xl animate-bounce filter drop-shadow-lg">❓</div>
         <div>
            <p className="text-xl font-bold text-gray-200">{t.askQuestions}</p>
            <p className="text-sm text-gray-400 mt-2">Find the spy before time runs out!</p>
         </div>
       </Card>

       <div className="pb-safe pt-4">
           <Button variant="danger" onClick={() => { setGameActive(false); setPhase('VOTING'); playSound('click'); }} className="w-full text-xl py-6 shadow-lg shadow-red-500/20">
             🚨 STOP & VOTE 🚨
           </Button>
       </div>
    </div>
  );
};
