import React from 'react';
import { Player, GameType } from '../types';
import { Card } from './Card';
import { Button } from './Button';

interface StatsViewProps {
  players: Player[];
  onClose: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ players, onClose }) => {
  const getBadges = (player: Player) => {
    const badges: string[] = [];
    const stats = player.stats || {};
    
    // Calculate total wins and games
    let totalWins = 0;
    let totalGames = 0;
    let uniqueGamesPlayed = 0;

    Object.values(stats).forEach(stat => {
        if (stat) {
            totalWins += stat.wins;
            totalGames += stat.played;
            if (stat.played > 0) uniqueGamesPlayed++;
        }
    });

    if (totalGames === 0) return badges;

    // Badges Logic
    if (totalWins >= 5) badges.push('🏆 Champion');
    if (totalWins >= 10) badges.push('👑 Legend');
    if (uniqueGamesPlayed >= 3) badges.push('🌍 Explorer');
    if (uniqueGamesPlayed >= 5) badges.push('🃏 Jack of All Trades');
    
    // Game specific badges
    if ((stats[GameType.TRIVIA]?.wins || 0) >= 3) badges.push('🧠 Brainiac');
    if ((stats[GameType.CHARADES]?.wins || 0) >= 3) badges.push('🎭 Thespian');
    if ((stats[GameType.PICTIONARY]?.wins || 0) >= 3) badges.push('🎨 Artist');
    if ((stats[GameType.IMPOSTOR]?.wins || 0) >= 2) badges.push('🕵️ Spy');
    if ((stats[GameType.SECRET_CODE]?.wins || 0) >= 2) badges.push('🤐 Codebreaker');

    return badges;
  };

  const sortedPlayers = [...players].sort((a, b) => {
      // Sort by total wins
      const winsA = Object.values(a.stats || {}).reduce((sum, s) => sum + (s?.wins || 0), 0);
      const winsB = Object.values(b.stats || {}).reduce((sum, s) => sum + (s?.wins || 0), 0);
      return winsB - winsA;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 pb-safe pt-safe bg-[#0f172a]/80 backdrop-blur-sm motion-safe:animate-fade-in">
      <div className="relative bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-white/20 rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl motion-safe:animate-slide-up">
        <div className="flex-none flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight leading-none">📊 Party Stats</h2>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors active:scale-95">✕</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {sortedPlayers.map((player, idx) => {
                const badges = getBadges(player);
                const stats = player.stats || {};
                const totalWins = Object.values(stats).reduce((sum, s) => sum + (s?.wins || 0), 0);
                const totalGames = Object.values(stats).reduce((sum, s) => sum + (s?.played || 0), 0);
                const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

                return (
                    <div key={player.id} className="bg-white/5 rounded-2xl p-5 border border-white/10 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="text-5xl drop-shadow-md">{player.avatar}</div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-2xl font-bold text-white tracking-tight">{player.name}</h3>
                                    {idx === 0 && <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest border border-yellow-400/50 bg-yellow-400/10 px-2 py-1 rounded-full">LEADER</span>}
                                </div>
                                <div className="text-sm text-gray-400 flex flex-wrap gap-x-4 gap-y-1 mt-1 font-medium">
                                    <span>🏆 {totalWins} Wins</span>
                                    <span>🎮 {totalGames} Played</span>
                                    <span>📈 {winRate}% Win Rate</span>
                                </div>
                            </div>
                        </div>

                        {badges.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {badges.map(b => (
                                    <span key={b} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30 shadow-sm">
                                        {b}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Detailed Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
                            {Object.entries(stats).map(([gameType, stat]) => {
                                if (!stat || stat.played === 0) return null;
                                return (
                                    <div key={gameType} className="text-xs bg-black/20 p-3 rounded-xl border border-white/5">
                                        <div className="font-bold text-gray-300 mb-1 capitalize tracking-wide">{gameType.toLowerCase().replace('_', ' ')}</div>
                                        <div className="text-gray-500 font-mono">
                                            {stat.wins}W - {stat.played}P
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {sortedPlayers.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                    No stats recorded yet. Play some games!
                </div>
            )}
        </div>

        <div className="flex-none p-6 border-t border-white/10 bg-white/5">
            <Button onClick={onClose} className="w-full text-lg py-4">Close</Button>
        </div>
      </div>
    </div>
  );
};
