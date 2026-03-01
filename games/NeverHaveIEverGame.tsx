import React, { useState, useEffect } from 'react';
import { Player, PartySettings, NeverHaveIEverPrompt, GameType, RoundResult } from '../types';
import { generateNeverHaveIEver, consumePrefetch, prefetchGame } from '../services/geminiService';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorView } from '../components/ErrorView';
import { playSound } from '../utils/sound';

interface NeverHaveIEverGameProps {
  players: Player[];
  onUpdateScore: (playerId: string, points: number) => void;
  onRoundComplete: (result: RoundResult) => void;
  onExit: () => void;
  settings: PartySettings;
}

export const NeverHaveIEverGame: React.FC<NeverHaveIEverGameProps> = ({ players, onUpdateScore, onRoundComplete, onExit, settings }) => {
  const [prompt, setPrompt] = useState<NeverHaveIEverPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasDoneIt, setHasDoneIt] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);

  const fetchPrompt = async () => {
    setLoading(true);
    setError(null);
    setShowResults(false);
    setHasDoneIt({});
    
    const prefetched = consumePrefetch<NeverHaveIEverPrompt>('never_have_i_ever', settings);
    if (prefetched) {
      setPrompt(prefetched);
      setLoading(false);
      prefetchGame('never_have_i_ever', settings);
      return;
    }

    const res = await generateNeverHaveIEver(settings);
    if (res.ok && res.data) {
      setPrompt(res.data);
      setError(null);
    } else {
      setPrompt(null);
      setError("Failed to generate prompt. Please try again.");
    }
    setLoading(false);
    if (res.ok) prefetchGame('never_have_i_ever', settings);
  };

  useEffect(() => {
    fetchPrompt();
  }, [settings]);

  const toggleDoneIt = (playerId: string) => {
    playSound('click');
    setHasDoneIt(prev => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  const handleReveal = () => {
    playSound('success');
    setShowResults(true);
    
    const roundScores: Record<string, number> = {};
    const winners: string[] = [];
    
    // In Never Have I Ever, you usually lose a point if you HAVE done it.
    // So we award 1 point to those who HAVEN'T done it.
    players.forEach(p => {
      if (!hasDoneIt[p.id]) {
        roundScores[p.id] = 1;
        winners.push(p.id);
        onUpdateScore(p.id, 1);
      } else {
        // Lose a point if they have done it
        roundScores[p.id] = -1;
        onUpdateScore(p.id, -1);
      }
    });
    
    onRoundComplete({
      gameType: GameType.NEVER_HAVE_I_EVER,
      winners,
      scores: roundScores,
      timestamp: Date.now()
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in">
        <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium">Digging up secrets...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorView onRetry={fetchPrompt} lang={settings.language} message={error} />;
  }

  if (!prompt) return null;

  const doneCount = Object.values(hasDoneIt).filter(v => v).length;

  return (
    <div className="flex flex-col h-full animate-fade-in max-w-4xl mx-auto w-full p-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-500 mb-2">
          Never Have I Ever...
        </h2>
      </div>

      <div className="flex-1 flex flex-col justify-center mb-8">
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 rounded-3xl transition-opacity duration-500 ${showResults ? 'opacity-100' : 'opacity-0'}`} />
          <Card className="p-8 md:p-12 text-center border-2 border-fuchsia-500/30 relative overflow-hidden">
            <h3 className="text-3xl md:text-5xl font-bold mb-6 z-10 leading-tight">{prompt.statement}</h3>
            
            {showResults && (
              <div className="mt-8 z-10 animate-bounce-in">
                <div className="text-6xl font-black text-fuchsia-400">{doneCount}</div>
                <div className="text-gray-400 uppercase tracking-widest font-bold mt-2">People have done this</div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {!showResults ? (
        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <h4 className="text-center font-bold text-gray-400 mb-4 uppercase tracking-widest text-sm">Who has done it?</h4>
            <div className="flex flex-wrap justify-center gap-3">
              {players.map(p => (
                <button 
                  key={p.id}
                  onClick={() => toggleDoneIt(p.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${hasDoneIt[p.id] ? 'bg-fuchsia-500/20 border-2 border-fuchsia-500 scale-105' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}
                >
                  <div className="text-3xl">{p.avatar}</div>
                  <span className="text-xs font-bold text-white truncate w-16 text-center">{p.name}</span>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${hasDoneIt[p.id] ? 'text-fuchsia-400' : 'text-gray-500'}`}>
                    {hasDoneIt[p.id] ? 'Guilty' : 'Innocent'}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <Button 
            onClick={handleReveal} 
            className="w-full py-4 text-xl shadow-xl shadow-fuchsia-500/20"
          >
            Reveal Results
          </Button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Button onClick={fetchPrompt} className="flex-1 py-4 text-xl shadow-xl shadow-fuchsia-500/20">
            Next Statement
          </Button>
        </div>
      )}
    </div>
  );
};
