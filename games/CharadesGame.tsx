
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingView } from '../components/LoadingView';
import { PassPhoneScreen } from '../components/PassPhoneScreen';
import { ErrorView } from '../components/ErrorView';
import { Player, CharadePrompt, Language, GameType, RoundResult, PartySettings } from '../types';
import { generateCharades, consumePrefetch, prefetchGame } from '../services/geminiService';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface CharadesGameProps {
  players: Player[];
  onUpdateScore: (playerId: string, points: number) => void;
  onRoundComplete: (result: RoundResult) => void;
  onExit: () => void;
  settings: PartySettings;
}

export const CharadesGame: React.FC<CharadesGameProps> = ({ players, onUpdateScore, onRoundComplete, onExit, settings }) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [prompt, setPrompt] = useState<CharadePrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [roundDuration, setRoundDuration] = useState(60);
  const [timer, setTimer] = useState<number>(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const lang = settings.language;
  const t = translations[lang];

  const currentPlayer = players[currentPlayerIdx];

  // Timer Effect
  useEffect(() => {
    let interval: number;
    if (isPlaying && timer > 0) {
      interval = window.setInterval(() => {
        setTimer(t => {
           if (t <= 4 && t > 1) playSound('tick'); // Ticking sound near end
           return t - 1;
        });
      }, 1000);
    } else if (timer === 0 && isPlaying) {
      playSound('error'); // Time up sound
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timer]);

  const fetchCard = async () => {
    playSound('click');
    setLoading(true);
    setError(null);
    
    const prefetched = consumePrefetch<CharadePrompt>('charades', settings);
    if (prefetched) {
      setPrompt(prefetched);
      setLoading(false);
      setShowPrompt(false);
      setIsPlaying(false);
      setTimer(roundDuration);
      
      // Trigger next prefetch in background
      prefetchGame('charades', settings);
      return;
    }

    const response = await generateCharades(settings);
    if (response.ok && response.data) {
      setPrompt(response.data);
      setError(null);
    } else {
      setPrompt(null);
      setError("Failed to generate charades. Please try again.");
    }
    setLoading(false);
    setShowPrompt(false);
    setIsPlaying(false);
    setTimer(roundDuration);
    
    // Trigger next prefetch in background
    if (response.ok) prefetchGame('charades', settings);
  };

  const startRound = () => {
    playSound('click');
    setShowPrompt(true);
  };

  const startTimer = () => {
    playSound('start');
    setIsPlaying(true);
  };

  const handleSuccess = () => {
    playSound('success');
    const result: RoundResult = {
        gameType: GameType.CHARADES,
        winners: [currentPlayer.id],
        scores: { [currentPlayer.id]: 10 },
        timestamp: Date.now()
    };
    onRoundComplete(result);
    nextTurn();
  };

  const handleSkip = () => {
    playSound('error');
    const result: RoundResult = {
        gameType: GameType.CHARADES,
        winners: [],
        scores: { [currentPlayer.id]: 0 },
        timestamp: Date.now()
    };
    onRoundComplete(result);
    nextTurn();
  };

  const nextTurn = () => {
    setPrompt(null);
    setError(null);
    setShowPrompt(false);
    setIsPlaying(false);
    setTimer(roundDuration);
    setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
  };

  if (loading) {
      return <LoadingView message={t.loadingCharades} gameType={GameType.CHARADES} />;
  }

  if (error) {
      return <ErrorView onRetry={fetchCard} lang={settings.language} message={error} />;
  }

  // Setup Phase (Before drawing card)
  if (!prompt) {
     return (
        <div className="max-w-md mx-auto text-center space-y-6 flex flex-col h-full">
            <h2 className="text-3xl font-bold">🎭 {t.setupPhase}</h2>
            <Card className="space-y-6">
               <div>
                 <label className="block text-sm font-bold text-gray-400 mb-3">{t.timerLabel}: {roundDuration}s</label>
                 <div className="flex justify-center gap-3">
                    {[30, 60, 90, 120].map(sec => (
                      <button
                        key={sec}
                        onClick={() => { setRoundDuration(sec); playSound('click'); }}
                        className={`px-4 py-2 rounded-xl border-2 font-bold transition-all ${roundDuration === sec ? 'bg-pink-500 border-pink-500 text-white scale-110' : 'border-white/20 hover:bg-white/10'}`}
                      >
                        {sec}s
                      </button>
                    ))}
                 </div>
               </div>

               <div className="pt-4 border-t border-white/10">
                 <p className="mb-4 text-gray-300">{t.nextPlayer}: <span className="font-bold text-pink-400 text-xl block mt-1">{currentPlayer.name}</span></p>
                 <Button onClick={fetchCard} isLoading={loading} className="w-full text-lg shadow-xl shadow-pink-500/20">
                    {t.drawCardBtn}
                 </Button>
               </div>
            </Card>
            <div className="flex-1"></div>
            <Button variant="ghost" onClick={onExit}>{t.exitGame}</Button>
        </div>
     )
  }

  return (
    <div className="max-w-md mx-auto flex flex-col h-full pb-32">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold text-pink-300">{t.actor}: {currentPlayer.name}</h2>
         <div className={`text-4xl font-mono font-black ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timer}s
         </div>
      </div>

      <Card className="flex-1 flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[40vh]">
        {!showPrompt ? (
           <PassPhoneScreen 
             playerName={currentPlayer.name}
             onConfirm={startRound}
             title={`${t.handDevice} ${currentPlayer.name}`}
             buttonText={`${t.iAm} ${currentPlayer.name}, ${t.revealWord}`}
           />
        ) : (
           <div className="w-full h-full flex flex-col justify-between space-y-6 animate-fade-in">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest mb-4 border border-white/10">
                   {prompt?.category}
                </span>
                <h3 className="text-5xl font-extrabold mt-2 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 leading-tight">
                    {prompt?.phrase}
                </h3>
                <div className="text-sm text-gray-400">
                   {t.difficulty}: <span className="text-white font-bold">{prompt?.difficulty}</span>
                </div>
              </div>

              {!isPlaying && timer > 0 && (
                  <Button size="lg" onClick={startTimer} className="animate-bounce w-full shadow-2xl shadow-pink-500/40">
                      {t.startTimer}
                  </Button>
              )}

              {isPlaying && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{t.hint}:</p>
                      <p className="italic text-gray-200 text-lg">"{prompt?.hint}"</p>
                  </div>
              )}

              {timer === 0 && (
                  <div className="text-red-400 font-bold text-2xl animate-pulse">{t.timeUp}</div>
              )}
           </div>
        )}
      </Card>

      {/* Sticky Bottom Controls */}
      {showPrompt && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent z-20 flex justify-center pb-24 animate-slide-up">
           <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <Button variant="danger" onClick={handleSkip} className="h-16 text-lg shadow-lg shadow-red-500/20">{t.skipBtn}</Button>
                <Button onClick={handleSuccess} className="bg-green-600 hover:bg-green-500 h-16 text-lg shadow-lg shadow-green-500/20">
                    {t.correctBtn} (+10)
                </Button>
           </div>
        </div>
      )}
    </div>
  );
};
