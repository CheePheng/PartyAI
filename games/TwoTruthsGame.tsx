import React, { useState, useEffect } from 'react';
import { Player, PartySettings, TwoTruthsPrompt, GameType, RoundResult } from '../types';
import { generateTwoTruths } from '../services/geminiService';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PassPhoneScreen } from '../components/PassPhoneScreen';
import { playSound } from '../utils/sound';

interface TwoTruthsGameProps {
  players: Player[];
  onUpdateScore: (playerId: string, points: number) => void;
  onRoundComplete: (result: RoundResult) => void;
  onExit: () => void;
  settings: PartySettings;
}

export const TwoTruthsGame: React.FC<TwoTruthsGameProps> = ({ players, onUpdateScore, onRoundComplete, onExit, settings }) => {
  const [prompt, setPrompt] = useState<TwoTruthsPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [mode, setMode] = useState<'AI' | 'PLAYER'>('AI');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  
  // Custom prompt state
  const [customS1, setCustomS1] = useState('');
  const [customS2, setCustomS2] = useState('');
  const [customS3, setCustomS3] = useState('');
  const [customLie, setCustomLie] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const fetchPrompt = async () => {
    setLoading(true);
    setShowResults(false);
    setVotes({});
    const res = await generateTwoTruths(settings);
    if (res.ok) {
      setPrompt(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (mode === 'AI') {
      fetchPrompt();
    }
  }, [settings, mode]);

  const handleVote = (playerId: string, statementIndex: number) => {
    playSound('click');
    setVotes(prev => ({ ...prev, [playerId]: statementIndex }));
  };

  const handleReveal = () => {
    playSound('success');
    setShowResults(true);
    
    const roundScores: Record<string, number> = {};
    const winners: string[] = [];
    
    const lieIndex = prompt?.lieIndex;
    
    Object.keys(votes).forEach(playerId => {
      if (votes[playerId] === lieIndex) {
        roundScores[playerId] = 10;
        winners.push(playerId);
        onUpdateScore(playerId, 10);
      }
    });

    // If player mode, award points to the player who fooled others
    if (mode === 'PLAYER' && prompt) {
      const currentPlayer = players[currentPlayerIndex];
      const fooledCount = Object.keys(votes).length - winners.length;
      if (fooledCount > 0) {
        const points = fooledCount * 5;
        roundScores[currentPlayer.id] = (roundScores[currentPlayer.id] || 0) + points;
        onUpdateScore(currentPlayer.id, points);
      }
    }
    
    onRoundComplete({
      gameType: GameType.TWO_TRUTHS,
      winners,
      scores: roundScores,
      timestamp: Date.now()
    });
  };

  const handleCustomSubmit = () => {
    if (customLie === null || !customS1 || !customS2 || !customS3) return;
    
    setPrompt({
      statement1: customS1,
      statement2: customS2,
      statement3: customS3,
      lieIndex: customLie
    });
    setIsSubmitting(false);
    setVotes({});
    setShowResults(false);
  };

  const handleNextPlayer = () => {
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
    setCustomS1('');
    setCustomS2('');
    setCustomS3('');
    setCustomLie(null);
    setIsSubmitting(true);
    setIsReady(false);
    setPrompt(null);
    setShowResults(false);
    setVotes({});
  };

  if (mode === 'PLAYER' && isSubmitting) {
    const currentPlayer = players[currentPlayerIndex];
    if (!isReady) {
      return (
        <PassPhoneScreen 
          playerName={currentPlayer.name}
          onConfirm={() => { setIsReady(true); playSound('click'); }}
          title={`Pass device to ${currentPlayer.name}`}
          subtitle="Enter your truths and lie in secret!"
          buttonText={`I am ${currentPlayer.name}`}
        />
      );
    }

    return (
      <div className="flex flex-col h-full animate-fade-in max-w-2xl mx-auto w-full p-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500 mb-2">
            {currentPlayer.name}'s Turn
          </h2>
          <p className="text-gray-400">Enter two truths and one lie.</p>
        </div>

        <Card className="space-y-6 p-6 border-2 border-lime-500/30">
          {[1, 2, 3].map((num, idx) => (
            <div key={num} className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex justify-between">
                Statement {num}
                <button 
                  onClick={() => setCustomLie(idx)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${customLie === idx ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                >
                  {customLie === idx ? 'This is the Lie' : 'Mark as Lie'}
                </button>
              </label>
              <input 
                type="text"
                value={idx === 0 ? customS1 : idx === 1 ? customS2 : customS3}
                onChange={(e) => {
                  if (idx === 0) setCustomS1(e.target.value);
                  if (idx === 1) setCustomS2(e.target.value);
                  if (idx === 2) setCustomS3(e.target.value);
                }}
                placeholder={`Enter statement ${num}...`}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-lime-500 outline-none transition-colors"
              />
            </div>
          ))}

          <Button 
            onClick={handleCustomSubmit} 
            className="w-full py-4 text-xl shadow-xl shadow-lime-500/20"
            disabled={customLie === null || !customS1 || !customS2 || !customS3}
          >
            Ready to Play
          </Button>
        </Card>
      </div>
    );
  }

  if (loading && mode === 'AI') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in">
        <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium">Generating a persona...</p>
      </div>
    );
  }

  if (!prompt) return <div>Failed to load.</div>;

  const statements = [prompt.statement1, prompt.statement2, prompt.statement3];

  return (
    <div className="flex flex-col h-full animate-fade-in max-w-4xl mx-auto w-full p-4">
      <div className="flex justify-between items-center mb-8">
        <div className="text-center flex-1">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500 mb-2">
            Two Truths & A Lie
          </h2>
          <p className="text-gray-400">
            {mode === 'AI' ? "Spot the AI's lie!" : `Spot ${players[currentPlayerIndex]?.name}'s lie!`}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setMode('AI'); setIsSubmitting(false); }}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${mode === 'AI' ? 'bg-lime-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
          >
            AI Mode
          </button>
          <button 
            onClick={() => { setMode('PLAYER'); setIsSubmitting(true); setIsReady(false); }}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${mode === 'PLAYER' ? 'bg-lime-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
          >
            Player Mode
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 mb-8">
        {statements.map((stmt, idx) => {
          const votesForStmt = Object.values(votes).filter(v => v === idx).length;
          const isLie = prompt.lieIndex === idx;
          
          return (
            <div key={idx} className="relative group">
              <div className={`absolute inset-0 rounded-3xl transition-opacity duration-500 ${showResults ? (isLie ? 'bg-red-500/20 opacity-100' : 'bg-green-500/10 opacity-100') : 'opacity-0'}`} />
              <Card className={`p-6 border-2 transition-all duration-500 relative overflow-hidden ${showResults ? (isLie ? 'border-red-500/50' : 'border-green-500/30') : 'border-white/10'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${showResults ? (isLie ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'bg-white/10 text-gray-400'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl md:text-2xl font-medium leading-relaxed">{stmt}</p>
                    {showResults && (
                      <div className="mt-2 text-sm font-bold tracking-widest uppercase animate-slide-in">
                        {isLie ? <span className="text-red-400">❌ The Lie</span> : <span className="text-green-400">✅ Truth</span>}
                        <span className="ml-4 text-gray-400">{votesForStmt} votes</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {!showResults ? (
        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <h4 className="text-center font-bold text-gray-400 mb-4 uppercase tracking-widest text-sm">Vote for the Lie</h4>
            <div className="flex flex-wrap justify-center gap-3">
              {players.map(p => {
                // In player mode, the current player doesn't vote
                if (mode === 'PLAYER' && p.id === players[currentPlayerIndex]?.id) return null;
                
                return (
                  <div key={p.id} className="flex flex-col items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(idx => (
                        <button 
                          key={idx}
                          onClick={() => handleVote(p.id, idx)}
                          className={`w-10 h-10 rounded-lg font-bold transition-all ${votes[p.id] === idx ? 'bg-lime-500 text-white scale-110 shadow-lg shadow-lime-500/50' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-gray-300 truncate w-20 text-center">{p.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <Button 
            onClick={handleReveal} 
            className="w-full py-4 text-xl shadow-xl shadow-lime-500/20"
            disabled={Object.keys(votes).length === 0}
          >
            Reveal the Lie
          </Button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Button onClick={mode === 'AI' ? fetchPrompt : handleNextPlayer} className="flex-1 py-4 text-xl shadow-xl shadow-lime-500/20">
            {mode === 'AI' ? 'Next Persona' : 'Next Player'}
          </Button>
        </div>
      )}
    </div>
  );
};
