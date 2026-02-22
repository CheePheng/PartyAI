
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingView } from '../components/LoadingView';
import { Player, TriviaQuestion, Language, GameType } from '../types';
import { generateTriviaQuestions } from '../services/geminiService';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface TriviaGameProps {
  players: Player[];
  updateScore: (playerId: string, points: number) => void;
  onExit: () => void;
  lang: Language;
}

export const TriviaGame: React.FC<TriviaGameProps> = ({ players, updateScore, onExit, lang }) => {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [gameState, setGameState] = useState<'SETUP' | 'PLAYING' | 'REVEAL' | 'FINISHED'>('SETUP');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const t = translations[lang];

  const activePlayer = players[activePlayerIndex];
  const currentQuestion = questions[currentQIndex];

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setLoading(true);
    setLoadingMsg(t.loadingTrivia);
    playSound('click');
    const qs = await generateTriviaQuestions(topic, numQuestions, lang);
    setQuestions(qs);
    setLoading(false);
    
    if (qs.length > 0) {
      playSound('start');
      setGameState('PLAYING');
      setCurrentQIndex(0);
    }
  };

  const handleAnswer = (index: number) => {
    if (gameState !== 'PLAYING') return;
    setSelectedOption(index);
    setGameState('REVEAL');
    
    if (index === currentQuestion.answerIndex) {
      playSound('success');
      updateScore(activePlayer.id, 10);
    } else {
      playSound('error');
      // Record participation with 0 points so stats track "Games Played" correctly
      updateScore(activePlayer.id, 0);
    }
  };

  const nextQuestion = () => {
    playSound('click');
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setGameState('PLAYING');
      setSelectedOption(null);
      setActivePlayerIndex(prev => (prev + 1) % players.length);
    } else {
      playSound('win');
      setGameState('FINISHED');
    }
  };

  if (loading) {
     return <LoadingView message={loadingMsg} gameType={GameType.TRIVIA} />;
  }

  if (gameState === 'SETUP') {
    return (
      <div className="max-w-md mx-auto space-y-6 flex flex-col h-full">
        <h2 className="text-3xl font-bold text-center">{t.appTitle} - {t.setupPhase}</h2>
        <Card className="space-y-6">
          <form onSubmit={handleStart} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t.topicLabel}</label>
              <input 
                className="w-full bg-black/30 border-2 border-white/10 rounded-xl px-4 py-4 text-white focus:border-blue-500 outline-none transition-colors text-lg"
                placeholder="e.g. 90s Cartoons"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">{t.questionsLabel}: {numQuestions}</label>
              <input 
                type="range"
                min="1"
                max="20"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full accent-blue-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <Button type="submit" isLoading={loading} className="w-full text-lg shadow-xl" disabled={!topic.trim()}>
              {t.generateBtn}
            </Button>
          </form>
        </Card>
        <div className="flex-1"></div>
        <Button variant="ghost" onClick={onExit} className="w-full mb-4">{t.exitGame}</Button>
      </div>
    );
  }

  if (gameState === 'FINISHED') {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 flex flex-col justify-center min-h-[50vh]">
        <h2 className="text-3xl font-bold">{t.roundComplete}</h2>
        <Card className="p-8">
          <div className="flex flex-col gap-4 justify-center">
            <Button size="lg" onClick={() => setGameState('SETUP')}>{t.newTopic}</Button>
            <Button variant="secondary" onClick={onExit}>{t.backToMenu}</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col h-full relative">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl mb-4">
        <div>
           <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{t.actor}</span>
           <div className="flex items-center gap-2 font-bold text-xl text-blue-300">
             {activePlayer.avatar} {activePlayer.name}
           </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Q</span>
          <div className="font-mono text-xl">{currentQIndex + 1}/{questions.length}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-48 scrollbar-hide">
        <Card className="space-y-6 mb-4">
            <div className="space-y-2">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded uppercase tracking-wider">
                {currentQuestion.difficulty}
            </span>
            <h3 className="text-2xl font-bold leading-tight">{currentQuestion.question}</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((opt, idx) => {
                let btnClass = "text-left p-4 rounded-xl border-2 transition-all active:scale-[0.98] font-medium text-lg ";
                
                if (gameState === 'REVEAL') {
                if (idx === currentQuestion.answerIndex) {
                    btnClass += "bg-green-500/20 border-green-500 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                } else if (idx === selectedOption) {
                    btnClass += "bg-red-500/20 border-red-500 text-red-300";
                } else {
                    btnClass += "border-white/5 opacity-40";
                }
                } else {
                btnClass += "border-white/10 hover:bg-white/10 hover:border-white/30";
                }

                return (
                <button
                    key={idx}
                    disabled={gameState === 'REVEAL'}
                    onClick={() => handleAnswer(idx)}
                    className={btnClass}
                >
                    {opt}
                </button>
                );
            })}
            </div>

            {gameState === 'REVEAL' && (
             <div className="animate-fade-in p-4 bg-indigo-900/30 border border-indigo-500/20 rounded-xl">
                <span className="font-bold block mb-1 text-indigo-300 text-sm uppercase tracking-wider">💡 {t.explanation}</span>
                <p className="text-gray-200 leading-relaxed">{currentQuestion.explanation}</p>
             </div>
            )}
        </Card>
      </div>

      {/* Sticky Bottom Controls for Flip Phone Optimization */}
      {gameState === 'REVEAL' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent z-20 flex justify-center pb-24 animate-slide-up">
            <Button onClick={nextQuestion} size="lg" className="w-full max-w-md shadow-2xl shadow-indigo-500/30">
            {currentQIndex < questions.length - 1 ? t.nextQuestion : t.finishRound}
            </Button>
        </div>
      )}
    </div>
  );
};
