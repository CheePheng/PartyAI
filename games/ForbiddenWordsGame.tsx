
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingView } from '../components/LoadingView';
import { PassPhoneScreen } from '../components/PassPhoneScreen';
import { Player, ForbiddenWordsCard, Language, GameType, RoundResult, PartySettings } from '../types';
import { generateForbiddenWords } from '../services/geminiService';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface ForbiddenWordsGameProps {
  players: Player[];
  onUpdateScore: (playerId: string, points: number) => void;
  onRoundComplete: (result: RoundResult) => void;
  onExit: () => void;
  settings: PartySettings;
}

export const ForbiddenWordsGame: React.FC<ForbiddenWordsGameProps> = ({ players, onUpdateScore, onRoundComplete, onExit, settings }) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [card, setCard] = useState<ForbiddenWordsCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [roundDuration, setRoundDuration] = useState(60);
  const [timer, setTimer] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [cardsPlayed, setCardsPlayed] = useState(0);
  const lang = settings.language;
  const t = translations[lang];

  const currentPlayer = players[currentPlayerIdx];

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
    }
    return () => clearInterval(interval);
  }, [isPlaying, timer]);

  const drawCard = async () => {
    playSound('click');
    setLoading(true);
    const response = await generateForbiddenWords(settings);
    setCard(response.ok ? response.data : null);
    setLoading(false);
  };

  const startTurn = async () => {
    setIsPlaying(true);
    setTimer(roundDuration);
    setCardsPlayed(0);
    playSound('start');
    await drawCard();
  };

  const handleSuccess = async () => {
    playSound('success');
    const result: RoundResult = {
        gameType: GameType.FORBIDDEN_WORDS,
        winners: [currentPlayer.id],
        scores: { [currentPlayer.id]: 10 },
        timestamp: Date.now()
    };
    onRoundComplete(result);
    setCardsPlayed(p => p + 1);
    await drawCard();
  };

  const handleSkip = async () => {
    playSound('error');
    // Record participation with 0 points
    const result: RoundResult = {
        gameType: GameType.FORBIDDEN_WORDS,
        winners: [],
        scores: { [currentPlayer.id]: 0 },
        timestamp: Date.now()
    };
    onRoundComplete(result);
    await drawCard();
  };

  const finishTurn = () => {
    playSound('click');
    setIsPlaying(false);
    setIsReady(false);
    setCard(null);
    setTimer(roundDuration);
    setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
  };

  if (loading && !card) { // Initial loading
    return <LoadingView message={t.loadingForbidden} gameType={GameType.FORBIDDEN_WORDS} />;
  }

  // Setup / Transition Phase
  if (!isPlaying) {
    return (
        <div className="max-w-md mx-auto text-center space-y-6 flex flex-col h-full">
            <h2 className="text-3xl font-bold">🤐 {t.setupPhase}</h2>
            <Card className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-3">{t.timerLabel}: {roundDuration}s</label>
                  <div className="flex justify-center gap-3">
                    {[30, 60, 90].map(sec => (
                      <button
                        key={sec}
                        onClick={() => { setRoundDuration(sec); playSound('click'); }}
                        className={`px-4 py-2 rounded-xl border-2 font-bold transition-all ${roundDuration === sec ? 'bg-purple-500 border-purple-500 text-white scale-110' : 'border-white/20 hover:bg-white/10'}`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                   <p className="text-lg">{t.nextPlayer}: <span className="font-bold text-purple-400 block text-2xl mt-1">{currentPlayer.name}</span></p>
                   <Button onClick={() => { setIsReady(true); playSound('click'); }} className="w-full text-lg shadow-xl shadow-purple-500/20">
                      {t.startTimer}
                   </Button>
                </div>
            </Card>
            <div className="flex-1"></div>
            <Button variant="ghost" onClick={onExit}>{t.exitGame}</Button>
        </div>
    );
  }

  if (isReady && !isPlaying) {
      return (
          <PassPhoneScreen 
            playerName={currentPlayer.name}
            onConfirm={startTurn}
            title={`${t.handDevice} ${currentPlayer.name}`}
            buttonText={t.startTimer}
          />
      );
  }

  // Gameplay Phase
  return (
    <div className="max-w-md mx-auto flex flex-col h-full pb-32">
       <div className="flex justify-between items-center px-2 mb-4">
         <div className="flex items-center gap-2">
            <span className="text-2xl">{currentPlayer.avatar}</span>
            <span className="font-bold">{currentPlayer.name}</span>
         </div>
         <div className={`text-4xl font-mono font-black ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timer}s
         </div>
       </div>

       <div className="flex-1 flex flex-col justify-center">
        {loading ? (
            <Card className="min-h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin text-4xl">⏳</div>
                    <div className="text-sm text-gray-400 animate-pulse">{t.loading}</div>
                </div>
            </Card>
        ) : card ? (
            <Card className="space-y-6 border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 animate-fade-in">
                <div className="text-center pb-6 border-b border-white/10">
                    <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">{t.targetWord}</div>
                    <h2 className="text-5xl font-extrabold text-white tracking-tight">{card.target}</h2>
                </div>

                <div className="space-y-4">
                    <div className="text-xs uppercase tracking-widest text-red-400 text-center font-bold">{t.forbiddenWords}</div>
                    <div className="flex flex-col gap-3">
                        {card.forbidden.map((word, idx) => (
                            <div key={idx} className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center text-red-200 font-bold text-lg">
                            {word}
                            </div>
                        ))}
                    </div>
                </div>
                
                <p className="text-center text-xs text-gray-500">{t.forbiddenInstr}</p>
            </Card>
        ) : (
            <Card className="min-h-[300px] flex flex-col justify-center items-center text-center">
                <h3 className="text-3xl font-bold mb-2">{t.timeUp}</h3>
                <p className="text-gray-400 mb-8 text-xl">Score this round: <span className="text-green-400 font-bold">+{cardsPlayed * 10}</span></p>
                <Button onClick={finishTurn} className="w-full">{t.finishRound}</Button>
            </Card>
        )}
       </div>

       {/* Sticky Bottom Controls */}
       {timer > 0 && card && !loading && (
           <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent z-20 flex justify-center pb-24 animate-slide-up">
               <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                   <Button variant="danger" onClick={handleSkip} className="h-16 text-lg shadow-lg shadow-red-500/20">{t.skipBtn}</Button>
                   <Button onClick={handleSuccess} className="bg-green-600 hover:bg-green-500 h-16 text-lg shadow-lg shadow-green-500/20">{t.correctBtn}</Button>
               </div>
           </div>
       )}
    </div>
  );
};
