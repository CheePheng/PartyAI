
import React, { useState, useEffect } from 'react';
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
import { WouldYouRatherGame } from './games/WouldYouRatherGame';
import { TwoTruthsGame } from './games/TwoTruthsGame';
import { NeverHaveIEverGame } from './games/NeverHaveIEverGame';
import { Scoreboard } from './components/Scoreboard';
import { MiniScoreboard } from './components/MiniScoreboard';
import { StatsView } from './components/StatsView';
import { Modal } from './components/Modal';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Player, GameType, Language, PlayerStats, PartySettings, RoundResult } from './types';
import { translations } from './utils/i18n';
import { playSound, toggleMute, getMuteStatus, toggleHaptics, getHapticsStatus } from './utils/sound';
import { getGames } from './utils/gameData';
import { updatePlayerStats } from './utils/scoring';
import { PartySettingsModal } from './components/PartySettingsModal';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [screen, setScreen] = useState<'SETUP' | 'MENU' | 'GAME'>('SETUP');
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Load settings from local storage or use defaults
  const [settings, setSettings] = useState<PartySettings>(() => {
    const saved = localStorage.getItem('partySettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return { language: 'en', theme: 'default', intensity: 'family', highContrast: false };
  });
  
  const [isMuted, setIsMuted] = useState(getMuteStatus());
  const [isHapticsEnabled, setIsHapticsEnabled] = useState(true);

  const t = translations[settings.language];
  const games = getGames(settings.language);

  // Save settings to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('partySettings', JSON.stringify(settings));
  }, [settings]);

  const handleSetupComplete = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    setScreen('MENU');
  };

  const handleSelectGame = (gameId: GameType) => {
    setActiveGame(gameId);
    setScreen('GAME');
  };

  const confirmExitGame = () => {
    setShowExitConfirm(true);
    playSound('click');
  };

  const handleExitGame = () => {
    setActiveGame(null);
    setScreen('MENU');
    setShowExitConfirm(false);
    playSound('click');
  };

  const handleToggleMute = () => {
    const newVal = toggleMute();
    setIsMuted(newVal);
  };

  const handleToggleHaptics = () => {
    const newVal = toggleHaptics();
    setIsHapticsEnabled(newVal);
    if (newVal && navigator.vibrate) {
      navigator.vibrate(50); // Test vibration
    }
  };

  // Updates session score ONLY (no stats) - for live feedback
  const updateSessionScore = (playerId: string, points: number) => {
      setPlayers(current => {
          const updated = current.map(p => {
              if (p.id === playerId) {
                  return { ...p, score: p.score + points };
              }
              return p;
          });
          return updated;
      });
  };

  // Commits results to stats - call at end of round/game
  const handleRoundComplete = (result: RoundResult) => {
      setPlayers(current => {
          const updated = updatePlayerStats(current, result);
          return updated;
      });
  };

  // Render content based on state
  const renderContent = () => {
    switch (screen) {
      case 'SETUP':
        return <PlayerSetup onComplete={handleSetupComplete} lang={settings.language} initialPlayers={players} />;
      
      case 'MENU':
        // GameMenu now handles its own scrolling and layout
        return <GameMenu onSelectGame={handleSelectGame} onBack={() => setScreen('SETUP')} settings={settings} />;

      case 'GAME':
        if (!activeGame) return null;

        switch (activeGame) {
          case GameType.TRIVIA:
            return <TriviaGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          case GameType.CHARADES:
            return <CharadesGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          case GameType.FORBIDDEN_WORDS:
            return <ForbiddenWordsGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          case GameType.DEBATE:
            return <DebateGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          case GameType.IMPOSTOR:
            return <ImpostorGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          case GameType.MURDER_MYSTERY:
            return <MurderMysteryGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          case GameType.PICTIONARY:
            return <PictionaryGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          case GameType.SCATTERGORIES:
            return <CategoryRushGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          case GameType.WHO_AM_I:
            return <WhoAmIGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          case GameType.SECRET_CODE:
            return <SecretCodeGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          case GameType.WOULD_YOU_RATHER:
            return <WouldYouRatherGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          case GameType.TWO_TRUTHS:
            return <TwoTruthsGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          case GameType.NEVER_HAVE_I_EVER:
            return <NeverHaveIEverGame players={players} onUpdateScore={updateSessionScore} onRoundComplete={handleRoundComplete} onExit={handleExitGame} settings={settings} />;
          default:
            return <div>Game Not Implemented</div>;
        }
    }
  };

  return (
    <div data-theme={settings.theme} className={`min-h-[100dvh] ${settings.highContrast ? 'bg-black text-white' : 'bg-theme-bg text-theme-text'} selection:bg-theme-accent/30 font-inter flex flex-col overflow-hidden`}>
      {/* Dynamic Background */}
      {!settings.highContrast && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-theme-accent/20 rounded-full blur-[120px] motion-safe:animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-theme-accent-hover/20 rounded-full blur-[120px] motion-safe:animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        </div>
      )}

      <div className="relative z-10 w-full mx-auto px-4 sm:px-6 flex flex-col h-[100dvh] motion-safe:transition-all duration-500 ease-in-out md:max-w-4xl lg:max-w-6xl">
        {/* Header - Safe Area Top for Dynamic Island */}
        <header className="flex-none flex justify-between items-center z-50 pt-[max(1rem,env(safe-area-inset-top))] pb-4 border-b border-white/5 bg-theme-bg/50 backdrop-blur-md px-4 -mx-4 sm:px-6 sm:-mx-6 mb-4 shadow-sm">
           <div className="flex items-center gap-3" onClick={() => { 
               if(screen === 'GAME') { confirmExitGame(); }
               else if(screen === 'MENU') { setScreen('SETUP'); playSound('click'); }
           }}>
              <div className="w-11 h-11 bg-gradient-to-br from-theme-accent to-theme-accent-hover rounded-[14px] flex items-center justify-center font-black text-white shadow-lg cursor-pointer transform hover:scale-105 motion-safe:transition-transform text-xl border border-white/20">
                P
              </div>
              <span className="font-black text-2xl tracking-tight cursor-pointer hidden sm:block text-transparent bg-clip-text bg-gradient-to-r from-white to-theme-muted">PartyAI</span>
           </div>

           <div className="flex gap-3">
             {screen === 'GAME' && (
                <button
                    onClick={() => { setShowRules(true); playSound('click'); }}
                    className="w-11 h-11 rounded-full flex items-center justify-center border bg-white/10 border-white/5 text-gray-300 hover:text-white transition-all active:scale-95"
                >
                    ?
                </button>
             )}

             <button
                onClick={() => {
                  const newLang = settings.language === 'en' ? 'zh' : 'en';
                  setSettings({ ...settings, language: newLang });
                  playSound('click');
                }}
                className="w-11 h-11 rounded-full flex items-center justify-center border transition-all active:scale-95 bg-white/10 border-white/5 text-gray-300 hover:text-white font-bold text-sm"
                aria-label="Toggle Language"
             >
                {settings.language === 'en' ? 'EN' : '中'}
             </button>

             <button
                onClick={handleToggleMute}
                className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all active:scale-95 ${isMuted ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/10 border-white/5 text-gray-300 hover:text-white'}`}
                aria-label={isMuted ? "Unmute" : "Mute"}
             >
                {isMuted ? '🔇' : '🔊'}
             </button>

             <button
               onClick={() => { setShowSettings(true); playSound('click'); }}
               className="bg-white/10 active:scale-95 w-11 h-11 flex items-center justify-center rounded-full border border-white/5 transition-colors text-xl"
               aria-label="Settings"
             >
               ⚙️
             </button>

             {players.length > 0 && (
               <>
                 <button 
                   onClick={() => { setShowStats(true); playSound('click'); }}
                   className="bg-white/10 active:scale-95 w-11 h-11 flex items-center justify-center rounded-full border border-white/5 transition-colors"
                 >
                   📊
                 </button>
                 <button 
                   onClick={() => { setShowScoreboard(true); playSound('click'); }}
                   className="bg-white/10 active:scale-95 w-11 h-11 flex items-center justify-center rounded-full border border-white/5 transition-colors"
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
          lang={settings.language} 
        />

        {/* Stats Modal */}
        {showStats && <StatsView players={players} onClose={() => setShowStats(false)} />}

        {/* Party Settings Modal */}
        <PartySettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSettingsChange={setSettings}
        />

        {/* Exit Confirmation Modal */}
        <Modal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Exit Game?">
            <div className="space-y-6">
                <p className="text-gray-300">Are you sure you want to end the current game? Progress may be lost.</p>
                <div className="flex gap-4">
                    <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleExitGame} className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 font-bold transition-colors shadow-lg shadow-red-500/20">
                        Exit Game
                    </button>
                </div>
            </div>
        </Modal>

        {/* In-Game Rules Modal */}
        <Modal isOpen={showRules} onClose={() => setShowRules(false)} title="How to Play">
            <div className="space-y-6">
                {activeGame && (
                    <div className="bg-[#0f172a]/50 p-6 rounded-2xl space-y-4 border border-white/5 relative overflow-hidden">
                        {(() => {
                            const gameDef = games.find(g => g.id === activeGame);
                            if (!gameDef) return null;
                            return (
                                <>
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${gameDef.color}`}></div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-3xl">{gameDef.icon}</span>
                                        <h3 className="font-bold text-xl">{gameDef.title[settings.language]}</h3>
                                    </div>
                                    {gameDef.rules[settings.language].split('\n').map((line, i) => (
                                        <div key={i} className="flex gap-3 text-gray-200">
                                            <span className="font-mono text-white/50 font-bold select-none">{i+1}.</span>
                                            <p className="leading-relaxed font-medium">{line.substring(2)}</p>
                                        </div>
                                    ))}
                                </>
                            );
                        })()}
                    </div>
                )}
                <div className="flex justify-end pt-2">
                    <button onClick={() => setShowRules(false)} className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-bold">
                        Got it!
                    </button>
                </div>
            </div>
        </Modal>
      </div>
    </div>
  );
}

export default App;
