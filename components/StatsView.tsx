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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden bg-[#1e293b] border-white/10 shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
            <h2 className="text-2xl font-bold text-white">📊 Party Stats</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {sortedPlayers.map((player, idx) => {
                const badges = getBadges(player);
                const stats = player.stats || {};
                const totalWins = Object.values(stats).reduce((sum, s) => sum + (s?.wins || 0), 0);
                const totalGames = Object.values(stats).reduce((sum, s) => sum + (s?.played || 0), 0);
                const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

                return (
                    <div key={player.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="text-4xl">{player.avatar}</div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold text-white">{player.name}</h3>
                                    {idx === 0 && <span className="text-yellow-400 text-xs font-bold border border-yellow-400 px-1.5 py-0.5 rounded">LEADER</span>}
                                </div>
                                <div className="text-sm text-gray-400 flex gap-4 mt-1">
                                    <span>🏆 {totalWins} Wins</span>
                                    <span>🎮 {totalGames} Played</span>
                                    <span>📈 {winRate}% Win Rate</span>
                                </div>
                            </div>
                        </div>

                        {badges.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {badges.map(b => (
                                    <span key={b} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30">
                                        {b}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Detailed Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
                            {Object.entries(stats).map(([gameType, stat]) => {
                                if (!stat || stat.played === 0) return null;
                                return (
                                    <div key={gameType} className="text-xs bg-black/20 p-2 rounded">
                                        <div className="font-bold text-gray-300 mb-0.5 capitalize">{gameType.toLowerCase().replace('_', ' ')}</div>
                                        <div className="text-gray-500">
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

        <div className="p-4 border-t border-white/10 bg-white/5">
            <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </Card>
    </div>
  );
};
