
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Player, Language, PlayerStats } from '../types';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface PlayerSetupProps {
  onComplete: (players: Player[]) => void;
  lang: Language;
  initialPlayers?: Player[];
}

const AVATAR_LIST = [
  '🐶', '🐱', '🦊', '🦁', '🐸', '🦄', '🐙', '🦋', '🐝', '🐞', '🦖', '🐳',
  '🐵', '🐼', '🐨', '🐷', '🐰', '🐯', '🐮', '🐔', '🐧', '🐦', '🐺', '🐗',
  '👻', '👽', '🤖', '💩', '🤡', '👹', '👺', '💀', '🎃', '😺', '👾', '🤠',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🎳', '🎮', '🎲', '🎸', '🎷',
  '🧜', '🧛', '🧟', '🧞', '🧝', '🧚', '🧙', '🦹', '🦸', '🎅', '🥷', '🤴',
  '👸', '🕵️', '💂', '👷', '👮', '👨‍🚀', '🧘', '🏄', '🏊', '🏋️', '🚴', '🤸',
  '🍕', '🍔', '🌮', '🍩', '🍪', '🍫', '🍿', '🍣', '🍱', '🍦', '🍉', '🍄',
  '🚀', '🛸', '⚓', '⛵', '🏰', '🗿', '🗽', '🗼', '🎪', '🎢', '🏝️', '🌋'
];

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onComplete, lang, initialPlayers = [] }) => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_LIST[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const t = translations[lang];

  // Auto-start timer logic
  useEffect(() => {
    let timer: number;
    if (players.length >= 2) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            playSound('start');
            onComplete(players);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeLeft(60); // Reset if not enough players
    }
    return () => clearInterval(timer);
  }, [players, onComplete]);

  const handleAddPlayer = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    const trimmedName = newName.trim();
    
    if (!trimmedName) return;
    
    if (players.length >= 10) {
      setError("Max 10 players reached!");
      playSound('error');
      return;
    }

    if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        setError("Name already taken!");
        playSound('error');
        return;
    }

    const finalAvatar = customAvatar.trim() ? customAvatar.trim() : selectedAvatar;

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: trimmedName,
      score: 0,
      avatar: finalAvatar,
      gamesPlayed: 0,
      wins: 0,
      stats: {}
    };

    setPlayers([...players, newPlayer]);
    setNewName('');
    setCustomAvatar('');
    setError('');
    // Reset timer on interaction to give more time
    setTimeLeft(60);
    
    // Pick random next avatar
    pickRandomAvatar();
    playSound('success');
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
    setTimeLeft(60); // Reset timer
    playSound('click');
  };

  const shufflePlayers = () => {
    setPlayers(prev => {
        const shuffled = [...prev];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    });
    setTimeLeft(60);
    playSound('click');
  };

  const pickRandomAvatar = () => {
      const randomAvatar = AVATAR_LIST[Math.floor(Math.random() * AVATAR_LIST.length)];
      setSelectedAvatar(randomAvatar);
  };

  const handleCustomAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomAvatar(e.target.value.slice(0, 4)); 
  };

  return (
    <div className="flex flex-col h-full animate-fade-in relative"> 
      
      {/* Header with Timer */}
      <div className="flex-none pt-2 px-4 flex justify-between items-end mb-6">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 drop-shadow-sm leading-none">
          {t.setupTitle}
        </h1>
        {players.length >= 2 && (
            <div className="text-right">
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Auto-start</div>
                <div className={`text-2xl font-mono font-black leading-none ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-indigo-300'}`}>
                    {timeLeft}s
                </div>
            </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-1">
        
        <div className="space-y-6 pb-safe">
            {/* Form Card */}
            <Card className="flex-none shadow-xl border-white/20 relative overflow-visible">
            <form onSubmit={handleAddPlayer} className="space-y-5">
                
                {/* Avatar Section */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Choose Avatar</label>
                        <button 
                            type="button" 
                            onClick={() => { pickRandomAvatar(); playSound('click'); }}
                            className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-gray-300 transition-colors"
                        >
                            🎲 Random
                        </button>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide snap-x px-2">
                        {/* Custom Input */}
                        <div className="flex-shrink-0 snap-center flex flex-col items-center">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300 overflow-hidden relative ${customAvatar ? 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-4 ring-indigo-400/50 ring-offset-2 ring-offset-[#1e293b] shadow-2xl shadow-indigo-500/50 scale-110 z-10' : 'bg-white/5 border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/10'}`}>
                                <input 
                                    type="text"
                                    value={customAvatar}
                                    onChange={handleCustomAvatarChange}
                                    placeholder="?"
                                    className="w-full h-full bg-transparent text-center text-4xl focus:outline-none placeholder-white/20 caret-white font-bold"
                                />
                                {!customAvatar && <div className="absolute bottom-2 text-[9px] text-gray-400 font-bold uppercase tracking-wider">Custom</div>}
                            </div>
                        </div>

                        {AVATAR_LIST.map(emoji => {
                            const isSelected = selectedAvatar === emoji && !customAvatar;
                            return (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => { setSelectedAvatar(emoji); setCustomAvatar(''); playSound('click'); }}
                                    className={`
                                        w-20 h-20 text-5xl rounded-3xl transition-all duration-300 flex-shrink-0 snap-center flex items-center justify-center relative
                                        ${isSelected 
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-4 ring-indigo-400/50 ring-offset-2 ring-offset-[#1e293b] shadow-2xl shadow-indigo-500/50 scale-110 z-10' 
                                            : 'bg-white/5 hover:bg-white/10 grayscale-[0.3] hover:grayscale-0 hover:scale-105 active:scale-95'
                                        }
                                    `}
                                >
                                    {emoji}
                                    {isSelected && (
                                        <div className="absolute -top-2 -right-2 bg-white text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-[#0f172a] animate-bounce">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="relative">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => { setNewName(e.target.value); setError(''); }}
                            placeholder={t.addPlayerPlaceholder}
                            className={`flex-1 bg-black/30 border-2 rounded-xl px-5 py-4 text-white text-lg placeholder-gray-500 focus:outline-none transition-colors ${error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-indigo-500'}`}
                        />
                        <Button type="submit" disabled={!newName.trim()} className="h-full aspect-square !px-0 flex items-center justify-center text-2xl">
                            +
                        </Button>
                    </div>
                    {error && <div className="absolute -bottom-6 left-0 text-red-400 text-xs font-bold animate-pulse">{error}</div>}
                </div>
            </form>
            </Card>

            {/* Player List */}
            <div className="space-y-3">
                <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Players</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${players.length >= 10 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-300'}`}>
                            {players.length}/10
                        </span>
                    </div>
                    {players.length > 1 && (
                        <button 
                            onClick={shufflePlayers} 
                            className="text-indigo-300 text-xs font-bold hover:text-white flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            🔀 Shuffle
                        </button>
                    )}
                </div>
                
                {players.length === 0 && (
                    <div className="text-center py-10 opacity-30 text-lg font-bold">
                        Add players to start!
                    </div>
                )}

                {players.map((player, idx) => (
                    <div key={player.id} className="flex flex-col bg-white/5 p-4 rounded-xl animate-slide-in border border-white/5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-mono text-gray-600">#{idx + 1}</span>
                                <span className="text-3xl">{player.avatar}</span>
                                <div>
                                    <span className="font-bold text-lg block">{player.name}</span>
                                    {/* Basic Summary */}
                                    <span className="text-xs text-gray-500 font-mono">
                                        Wins: {player.wins} / Games: {player.gamesPlayed}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => removePlayer(player.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {/* Detailed Stats Breakdown */}
                        {player.stats && Object.keys(player.stats).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
                                {Object.entries(player.stats).map(([game, stat]) => {
                                     const pStat = stat as PlayerStats;
                                     const played = pStat?.played || 0;
                                     const wins = pStat?.wins || 0;
                                     const ratio = played > 0 ? Math.round((wins / played) * 100) : 0;
                                     return (
                                        <div key={game} className="text-[10px] flex justify-between items-center bg-black/20 px-2 py-1.5 rounded-lg border border-white/5">
                                            <span className="text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[70px] mr-2" title={game}>{game.replace('_', ' ')}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-gray-500">{wins}/{played}</span>
                                                <span className={`font-mono font-bold ${ratio >= 50 ? 'text-green-400' : 'text-indigo-300'}`}>
                                                    {ratio}%
                                                </span>
                                            </div>
                                        </div>
                                     );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {/* Start Button - In Flow */}
            <div className="pt-4 pb-8">
                <Button 
                size="lg" 
                onClick={() => { playSound('start'); onComplete(players); }}
                disabled={players.length < 2}
                className="w-full shadow-2xl shadow-indigo-500/30 text-xl py-5"
                >
                {t.startPartyBtn}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};
