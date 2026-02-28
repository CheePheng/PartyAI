import { Player, RoundResult, GameType, PlayerStats } from '../types';

export const calculateNewStats = (player: Player, result: RoundResult): Partial<Record<GameType, PlayerStats>> => {
  const gameKey = result.gameType;
  const currentStats = player.stats[gameKey] || { wins: 0, played: 0 };
  
  const isWinner = result.winners.includes(player.id);
  // For some games, just participating is "played". 
  // For others, we might want to be more specific, but "Session" based is safest.
  
  return {
    ...player.stats,
    [gameKey]: {
      played: currentStats.played + 1,
      wins: isWinner ? currentStats.wins + 1 : currentStats.wins
    }
  };
};

export const updatePlayerStats = (players: Player[], result: RoundResult): Player[] => {
  return players.map(p => {
    // Only update stats if player was involved? 
    // The result.scores keys usually indicate involvement, or we can assume all active players are involved.
    // For now, let's assume if they have a score entry (even 0), they were involved.
    if (result.scores[p.id] !== undefined) {
      const newStats = calculateNewStats(p, result);
      const points = result.scores[p.id] || 0;
      
      return {
        ...p,
        score: p.score + points, // Add to session score
        wins: result.winners.includes(p.id) ? p.wins + 1 : p.wins, // Global wins
        gamesPlayed: p.gamesPlayed + 1, // Global games played
        stats: newStats
      };
    }
    return p;
  });
};
