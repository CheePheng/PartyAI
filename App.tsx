
import React, { useState } from 'react';
import { PlayerSetup } from './views/PlayerSetup';
import { GameMenu } from './views/GameMenu';
import { TriviaGame } from './games/TriviaGame';
import { CharadesGame } from './games/CharadesGame';
import { ForbiddenWordsGame } from './games/ForbiddenWordsGame';
import { DebateGame } from './games/DebateGame';
import { ImpostorGame } from './games/ImpostorGame';
import { MurderMysteryGame } from './games/MurderMysteryGame';
import { PictionaryGame } from './games/PictionaryGame';
import { CategoryRushGame } from './games/CategoryRushGame';
import { WhoAmIGame } from './games/WhoAmIGame';
import { SecretCodeGame } from './games/SecretCodeGame';
import { Scoreboard } from './components/Scoreboard';
import { MiniScoreboard } from './components/MiniScoreboard';
import { Modal } from './components/Modal';
import { Player, GameType, Language, PlayerStats } from './types';
import { translations } from './utils/i18n';
import { playSound, toggleMute, getMuteStatus } from './utils/sound';
import { getGames } from './utils/gameData';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [screen, setScreen] = useState<'SETUP' | 'MENU' | 'GAME'>('SETUP');
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [isMuted, setIsMuted] = useState(getMuteStatus());

  const t = translations[lang];
  const games = getGames(lang);

  const handleSetupComplete = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    setScreen('MENU');
  };

  const handleSelectGame = (gameId: GameType) => {
    setActiveGame(gameId);
    setScreen('GAME');
  };

  const handleExitGame = () => {
    setActiveGame(null);
    setScreen('MENU');
    playSound('click');
  };

  const handleToggleMute = () => {
    const newVal = toggleMute();
    setIsMuted(newVal);
  };

  const updateScore = (playerId: string, points: number) => {
    setPlayers(current => 
      current.map(p => {
        // If points are awarded, we consider it a "win" for that round/action for stats purposes
        // We also increment "played" for the active game type
        if (p.id === playerId) {
          const gameKey = activeGame || GameType.TRIVIA;
          const currentStats = p.stats?.[gameKey] || { wins: 0, played: 0 };
          
          return { 
            ...p, 
            score: p.score + points,
            wins: points > 0 ? p.wins + 1 : p.wins,
            gamesPlayed: p.gamesPlayed + 1, // Simplified total increment
            stats: {
                ...p.stats,
                [gameKey]: {
                    played: currentStats.played + 1,
                    wins: points > 0 ? currentStats.wins + 1 : currentStats.wins
                }
            }
          };
        }
        return p;
      })
    );
  };

  // Render content based on state
  const renderContent = () => {
    switch (screen) {
      case 'SETUP':
        return <PlayerSetup onComplete={handleSetupComplete} lang={lang} initialPlayers={players} />;
      
      case 'MENU':
        // GameMenu now handles its own scrolling and layout
        return <GameMenu onSelectGame={handleSelectGame} onBack={() => setScreen('SETUP')} lang={lang} />;

      case 'GAME':
        if (!activeGame) return null;
        switch (activeGame) {
          case GameType.TRIVIA:
            return <TriviaGame players={players} updateScore={updateScore} onExit={handleExitGame} lang={lang} />;
          case GameType.CHARADES:
            return <CharadesGame players={players} updateScore={updateScore} onExit={handleExitGame} lang={lang} />;
          case GameType.FORBIDDEN_WORDS:
            return <ForbiddenWordsGame players={players} updateScore={updateScore} onExit={handleExitGame} lang={lang} />;
          case GameType.DEBATE:
            return <DebateGame players={players} updateScore={updateScore} onExit={handleExitGame} lang={lang} />;
          case GameType.IMPOSTOR:
            return <ImpostorGame players={players} onExit={handleExitGame} lang={lang} />;
          case GameType.MURDER_MYSTERY:
            return <MurderMysteryGame players={players} onExit={handleExitGame} lang={lang} />;
          case GameType.PICTIONARY:
            return <PictionaryGame players={players} updateScore={updateScore} onExit={handleExitGame} lang={lang} />;
          case GameType.SCATTERGORIES:
            return <CategoryRushGame players={players} updateScore={updateScore} onExit={handleExitGame} lang={lang} />;
          case GameType.WHO_AM_I:
            return <WhoAmIGame players={players} updateScore={updateScore} onExit={handleExitGame} lang={lang} />;
          case GameType.SECRET_CODE:
            return <SecretCodeGame players={players} updateScore={updateScore} onExit={handleExitGame} lang={lang} />;
          default:
            return <div>Game Not Implemented</div>;
        }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0f172a] text-white selection:bg-indigo-500/30 font-inter flex flex-col overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 flex flex-col h-[100dvh]">
        {/* Header - Safe Area Top for Dynamic Island */}
        <header className="flex-none flex justify-between items-center z-50 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
           <div className="flex items-center gap-3" onClick={() => { if(screen!=='GAME') { setScreen('MENU'); playSound('click'); } }}>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg cursor-pointer transform hover:scale-105 transition-transform text-xl">
                P
              </div>
              <span className="font-bold text-xl tracking-tight cursor-pointer hidden sm:block">PartyAI</span>
           </div>

           <div className="flex gap-3">
             <button
                onClick={handleToggleMute}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 ${isMuted ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/10 border-white/5 text-gray-300 hover:text-white'}`}
             >
                {isMuted ? '🔇' : '🔊'}
             </button>

             <button
               onClick={() => { setLang(l => l === 'en' ? 'zh' : 'en'); playSound('click'); }}
               className="bg-white/10 active:scale-95 px-4 py-1 rounded-full text-xs font-bold border border-white/5 uppercase transition-colors"
             >
               {lang === 'en' ? 'CN' : 'EN'}
             </button>

             {players.length > 0 && (
               <>
                 <button 
                   onClick={() => { setShowStats(true); playSound('click'); }}
                   className="bg-white/10 active:scale-95 w-10 h-10 flex items-center justify-center rounded-full border border-white/5 transition-colors"
                 >
                   📊
                 </button>
                 <button 
                   onClick={() => { setShowScoreboard(true); playSound('click'); }}
                   className="bg-white/10 active:scale-95 w-10 h-10 flex items-center justify-center rounded-full border border-white/5 transition-colors"
                 >
                   🏆
                 </button>
               </>
             )}
           </div>
        </header>

        {/* Main Content Area - Fill remaining height */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          {renderContent()}
        </main>

        {/* Mini Scoreboard - Persistent during game */}
        {screen === 'GAME' && activeGame !== GameType.SECRET_CODE && <MiniScoreboard players={players} />}

        {/* Scoreboard Modal */}
        <Scoreboard 
          players={players} 
          isOpen={showScoreboard} 
          onClose={() => setShowScoreboard(false)}
          lang={lang} 
        />

        {/* Stats Modal */}
        <Modal isOpen={showStats} onClose={() => setShowStats(false)} title={`📊 ${t.statsBtn}`}>
           <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
             {players.sort((a,b) => b.wins - a.wins).map((p) => (
               <div key={p.id} className="bg-white/5 p-4 rounded-xl flex flex-col border border-white/5">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.avatar}</span>
                        <div>
                            <div className="font-bold">{p.name}</div>
                            <div className="text-xs text-gray-400">
                                {p.wins} Wins / {p.gamesPlayed} Rounds
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-emerald-400">{p.score}</div>
                        <div className="text-xs text-gray-500">Score</div>
                    </div>
                 </div>
                 
                 {/* Detailed Stats */}
                 {p.stats && Object.keys(p.stats).length > 0 && (
                     <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-1 gap-2 text-xs">
                         {Object.entries(p.stats).map(([type, value]) => {
                             const stats = value as PlayerStats;
                             const gameDef = games.find(g => g.id === type);
                             const gameName = gameDef ? gameDef.title[lang] : type;
                             const winRate = stats.played > 0 ? Math.round((stats.wins/stats.played)*100) : 0;
                             
                             return (
                              <div key={type} className="flex justify-between items-center bg-black/20 p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{gameDef?.icon || '🎮'}</span>
                                    <span className="text-gray-300 font-medium">{gameName}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <div className="font-mono text-white">{stats.wins} / {stats.played}</div>
                                      <div className="text-[10px] text-gray-500 uppercase">Wins</div>
                                    </div>
                                    <div className={`w-12 text-center py-0.5 rounded ${winRate >= 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'}`}>
                                      {winRate}%
                                    </div>
                                  </div>
                              </div>
                             );
                         })}
                     </div>
                 )}
               </div>
             ))}
             {players.length === 0 && (
               <div className="text-center text-gray-500 py-4">No stats recorded yet.</div>
             )}
             <div className="flex justify-end pt-2">
               <button onClick={() => setShowStats(false)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm font-bold">
                 Close
               </button>
             </div>
           </div>
        </Modal>
      </div>
    </div>
  );
}

export default App;
