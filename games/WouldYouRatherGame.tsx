import React, { useState, useEffect } from 'react';
import { Player, PartySettings, WouldYouRatherPrompt, GameType, RoundResult } from '../types';
import { generateWouldYouRather } from '../services/geminiService';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { playSound } from '../utils/sound';

interface WouldYouRatherGameProps {
  players: Player[];
  onUpdateScore: (playerId: string, points: number) => void;
  onRoundComplete: (result: RoundResult) => void;
  onExit: () => void;
  settings: PartySettings;
}

export const WouldYouRatherGame: React.FC<WouldYouRatherGameProps> = ({ players, onUpdateScore, onRoundComplete, onExit, settings }) => {
  const [prompt, setPrompt] = useState<WouldYouRatherPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, 'A' | 'B'>>({});
  const [showResults, setShowResults] = useState(false);

  const fetchPrompt = async () => {
    setLoading(true);
    setShowResults(false);
    setVotes({});
    const res = await generateWouldYouRather(settings);
    if (res.ok) {
      setPrompt(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrompt();
  }, [settings]);

  const handleVote = (playerId: string, choice: 'A' | 'B') => {
    playSound('click');
    setVotes(prev => ({ ...prev, [playerId]: choice }));
  };

  const handleReveal = () => {
    playSound('success');
    setShowResults(true);
    
    // Award points to the majority? Or just 1 point for participating?
    // Let's just award 1 point for participating in this game, it's more of a conversation starter.
    const roundScores: Record<string, number> = {};
    const winners: string[] = [];
    
    Object.keys(votes).forEach(playerId => {
      roundScores[playerId] = 1;
      winners.push(playerId);
      onUpdateScore(playerId, 1);
    });
    
    onRoundComplete({
      gameType: GameType.WOULD_YOU_RATHER,
      winners,
      scores: roundScores,
      timestamp: Date.now()
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium">Thinking of tough choices...</p>
      </div>
    );
  }

  if (!prompt) return <div>Failed to load.</div>;

  const votesA = Object.values(votes).filter(v => v === 'A').length;
  const votesB = Object.values(votes).filter(v => v === 'B').length;
  const totalVotes = Object.keys(votes).length;

  return (
    <div className="flex flex-col h-full animate-fade-in max-w-4xl mx-auto w-full p-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
          Would You Rather...
        </h2>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 mb-8">
        {/* Option A */}
        <div className="flex-1 relative group">
          <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl transition-opacity ${showResults && votesA > votesB ? 'opacity-100' : 'opacity-0'}`} />
          <Card className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-cyan-500/30 relative overflow-hidden">
            <h3 className="text-2xl md:text-4xl font-bold mb-4 z-10">{prompt.optionA}</h3>
            
            {showResults && (
              <div className="mt-4 z-10 animate-bounce-in">
                <div className="text-5xl font-black text-cyan-400">{Math.round((votesA / Math.max(1, totalVotes)) * 100)}%</div>
                <div className="text-gray-400">{votesA} votes</div>
              </div>
            )}
          </Card>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-black text-xl text-gray-400 italic">
            OR
          </div>
        </div>

        {/* Option B */}
        <div className="flex-1 relative group">
          <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl transition-opacity ${showResults && votesB > votesA ? 'opacity-100' : 'opacity-0'}`} />
          <Card className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-blue-500/30 relative overflow-hidden">
            <h3 className="text-2xl md:text-4xl font-bold mb-4 z-10">{prompt.optionB}</h3>
            
            {showResults && (
              <div className="mt-4 z-10 animate-bounce-in">
                <div className="text-5xl font-black text-blue-400">{Math.round((votesB / Math.max(1, totalVotes)) * 100)}%</div>
                <div className="text-gray-400">{votesB} votes</div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {!showResults ? (
        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <h4 className="text-center font-bold text-gray-400 mb-4 uppercase tracking-widest text-sm">Cast Your Votes</h4>
            <div className="flex flex-wrap justify-center gap-3">
              {players.map(p => (
                <div key={p.id} className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleVote(p.id, 'A')}
                      className={`w-10 h-10 rounded-lg font-bold transition-all ${votes[p.id] === 'A' ? 'bg-cyan-500 text-white scale-110 shadow-lg shadow-cyan-500/50' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                    >
                      A
                    </button>
                    <button 
                      onClick={() => handleVote(p.id, 'B')}
                      className={`w-10 h-10 rounded-lg font-bold transition-all ${votes[p.id] === 'B' ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/50' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                    >
                      B
                    </button>
                  </div>
                  <span className="text-xs font-medium text-gray-300 truncate w-20 text-center">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
          <Button 
            onClick={handleReveal} 
            className="w-full py-4 text-xl shadow-xl shadow-indigo-500/20"
            disabled={Object.keys(votes).length === 0}
          >
            Reveal Results
          </Button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Button onClick={fetchPrompt} className="flex-1 py-4 text-xl shadow-xl shadow-indigo-500/20">
            Next Question
          </Button>
        </div>
      )}
    </div>
  );
};
