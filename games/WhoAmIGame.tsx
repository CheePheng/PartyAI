
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingView } from '../components/LoadingView';
import { Player, WhoAmIWord, Language, GameType } from '../types';
import { generateWhoAmIWords } from '../services/geminiService';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface WhoAmIGameProps {
  players: Player[];
  updateScore: (playerId: string, points: number) => void;
  onExit: () => void;
  lang: Language;
}

export const WhoAmIGame: React.FC<WhoAmIGameProps> = ({ players, updateScore, onExit, lang }) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [category, setCategory] = useState('');
  const [words, setWords] = useState<WhoAmIWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<'SETUP' | 'READY' | 'PLAYING' | 'SUMMARY'>('SETUP');
  const [roundDuration, setRoundDuration] = useState(60);
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const t = translations[lang];

  const currentPlayer = players[currentPlayerIdx];

  // Timer Effect
  useEffect(() => {
    let interval: number;
    if (gameState === 'PLAYING' && timer > 0) {
      interval = window.setInterval(() => {
        setTimer(t => {
           if (t <= 4 && t > 1) playSound('tick');
           return t - 1;
        });
      }, 1000);
    } else if (timer === 0 && gameState === 'PLAYING') {
      playSound('error'); // Time up
      setGameState('SUMMARY');
      updateScore(currentPlayer.id, score);
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

  const fetchWords = async () => {
    if (!category.trim()) return;
    playSound('click');
    setLoading(true);
    // Fetch enough words for a fast round
    const data = await generateWhoAmIWords(category, 20, lang);
    setWords(data);
    setLoading(false);
    setGameState('READY');
  };

  const startGame = () => {
    playSound('start');
    setGameState('PLAYING');
    setTimer(roundDuration);
    setScore(0);
    setCurrentIndex(0);
  };

  const handleCorrect = () => {
      playSound('success');
      setScore(s => s + 1);
      advanceCard();
  };

  const handlePass = () => {
      playSound('error');
      advanceCard();
  };

  const advanceCard = () => {
      if (currentIndex < words.length - 1) {
          setCurrentIndex(c => c + 1);
      } else {
          // Out of words, end round early
          setGameState('SUMMARY');
          updateScore(currentPlayer.id, score + (timer > 0 ? 1 : 0)); // Bonus for finishing early? Just base score.
          updateScore(currentPlayer.id, 0); // Trigger score update
      }
  };

  const nextPlayer = () => {
      setGameState('SETUP');
      setWords([]);
      setCategory('');
      setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
      playSound('click');
  };

  if (loading) {
      return <LoadingView message={t.loadingWhoAmI} gameType={GameType.WHO_AM_I} />;
  }

  if (gameState === 'SETUP') {
      return (
        <div className="max-w-md mx-auto text-center space-y-6 flex flex-col h-full">
            <h2 className="text-3xl font-bold">🤔 {t.whoAmITitle}</h2>
            <Card className="space-y-6">
               <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">{t.categoryLabel}</label>
                  <input 
                    className="w-full bg-black/30 border-2 border-white/10 rounded-xl px-4 py-4 text-white focus:border-yellow-500 outline-none transition-colors text-lg"
                    placeholder="e.g. Celebrities, Animals"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-400 mb-3">{t.timerLabel}: {roundDuration}s</label>
                 <div className="flex justify-center gap-3">
                    {[30, 60, 90].map(sec => (
                      <button
                        key={sec}
                        onClick={() => { setRoundDuration(sec); playSound('click'); }}
                        className={`px-4 py-2 rounded-xl border-2 font-bold transition-all ${roundDuration === sec ? 'bg-yellow-500 border-yellow-500 text-white scale-110' : 'border-white/20 hover:bg-white/10'}`}
                      >
                        {sec}s
                      </button>
                    ))}
                 </div>
               </div>

               <div className="pt-4 border-t border-white/10">
                 <p className="mb-4 text-gray-300">{t.nextPlayer}: <span className="font-bold text-yellow-400 text-xl block mt-1">{currentPlayer.name}</span></p>
                 <Button onClick={fetchWords} disabled={!category.trim()} className="w-full text-lg shadow-xl shadow-yellow-500/20">
                    {t.generateBtn}
                 </Button>
               </div>
            </Card>
            <div className="flex-1"></div>
            <Button variant="ghost" onClick={onExit}>{t.exitGame}</Button>
        </div>
      );
  }

  if (gameState === 'READY') {
      return (
          <div className="flex flex-col h-full justify-center items-center text-center p-6 space-y-8 animate-fade-in">
              <div className="text-8xl animate-bounce">📱</div>
              <div>
                  <h2 className="text-3xl font-bold mb-2">{t.placeOnForehead}</h2>
                  <p className="text-gray-400">{t.whoAmIInstr}</p>
              </div>
              <Button size="lg" onClick={startGame} className="w-full max-w-sm py-6 text-xl animate-pulse">
                  {t.startGuessing}
              </Button>
          </div>
      );
  }

  if (gameState === 'SUMMARY') {
      return (
          <div className="flex flex-col h-full justify-center items-center text-center p-6 space-y-8 animate-fade-in">
              <h2 className="text-4xl font-bold text-white">{t.timeUp}</h2>
              <Card className="p-8 w-full max-w-sm">
                  <div className="text-sm text-gray-400 uppercase tracking-widest mb-2">{t.score}</div>
                  <div className="text-8xl font-black text-yellow-400 mb-4">{score}</div>
                  <div className="text-lg text-gray-300">{currentPlayer.name}</div>
              </Card>
              <Button size="lg" onClick={nextPlayer} className="w-full max-w-sm">
                  {t.nextPlayer}
              </Button>
          </div>
      );
  }

  // PLAYING STATE
  return (
      <div className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col">
          {/* Top Bar */}
          <div className="flex justify-between items-center p-6 pt-safe">
              <div className={`text-4xl font-mono font-black ${timer <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {timer}s
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                  {score} pts
              </div>
          </div>

          {/* Main Word Display - ROTATED for Landscape feeling in portrait? No, standard portrait is safer for web */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <h1 className="text-6xl sm:text-7xl font-black text-white leading-tight drop-shadow-2xl animate-fade-in key={currentIndex}">
                  {words[currentIndex]?.word}
              </h1>
              <p className="mt-6 text-xl text-gray-400 font-medium">
                  {words[currentIndex]?.hint}
              </p>
          </div>

          {/* Controls - Split Screen for easy tapping by friends */}
          <div className="h-1/3 flex pb-safe">
              <button 
                onClick={handlePass}
                className="flex-1 bg-red-600/20 active:bg-red-600/40 border-r border-white/10 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                  <span className="text-4xl">❌</span>
                  <span className="font-bold text-red-400 uppercase tracking-widest">{t.passBtn}</span>
              </button>
              <button 
                onClick={handleCorrect}
                className="flex-1 bg-green-600/20 active:bg-green-600/40 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                  <span className="text-4xl">✅</span>
                  <span className="font-bold text-green-400 uppercase tracking-widest">{t.correctBtn}</span>
              </button>
          </div>
      </div>
  );
};
