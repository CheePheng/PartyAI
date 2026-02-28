
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
import { initSocket, createRoom, joinRoom, getSocket, syncPlayers } from './services/socket';
import { QRCodeSVG } from 'qrcode.react';
import { updatePlayerStats } from './utils/scoring';
import { PartySettingsModal } from './components/PartySettingsModal';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [screen, setScreen] = useState<'MODE_SELECT' | 'HOST_LOBBY' | 'JOIN_LOBBY' | 'SETUP' | 'MENU' | 'GAME'>('MODE_SELECT');
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
  
  // Multiplayer State
  const [mode, setMode] = useState<'SINGLE' | 'HOST' | 'PLAYER'>('SINGLE');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [myPlayerId, setMyPlayerId] = useState('');

  const t = translations[settings.language];
  const games = getGames(settings.language);

  // Save settings to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('partySettings', JSON.stringify(settings));
  }, [settings]);

  // Initialize from URL hash if present (for joining)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/join/')) {
        const code = hash.split('/join/')[1];
        if (code) {
            setJoinCode(code);
            setMode('PLAYER');
            setScreen('JOIN_LOBBY');
        }
    }
  }, []);

  // Socket Listeners
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
        socket.on('room_created', (code: string) => {
            setRoomCode(code);
            setScreen('HOST_LOBBY');
        });

        socket.on('update_players', (updatedPlayers: any[]) => {
            // Map socket players to app players if needed, or just use directly
            // Ensure we keep local player properties if any
            setPlayers(updatedPlayers);
        });

        socket.on('game_started', (gameId: GameType) => {
            setActiveGame(gameId);
            setScreen('GAME');
        });
        
        socket.on('error', (msg: string) => {
            alert(msg);
        });

        return () => {
            socket.off('room_created');
            socket.off('update_players');
            socket.off('game_started');
            socket.off('error');
        };
    }
  }, [screen]); // Re-bind if screen changes (though socket instance is stable)

  const handleModeSelect = (selectedMode: 'SINGLE' | 'HOST' | 'PLAYER') => {
    setMode(selectedMode);
    playSound('click');
    
    if (selectedMode === 'SINGLE') {
        setScreen('SETUP');
    } else if (selectedMode === 'HOST') {
        const socket = initSocket();
        createRoom();
        // Wait for room_created event
    } else if (selectedMode === 'PLAYER') {
        setScreen('JOIN_LOBBY');
    }
  };

  const handleJoinRoom = (name: string, avatar: string) => {
      if (!joinCode) return;
      const socket = initSocket();
      const newPlayer: Player = {
          id: socket.id || crypto.randomUUID(), // Fallback ID
          name,
          avatar,
          score: 0,
          gamesPlayed: 0,
          wins: 0,
          stats: {}
      };
      setMyPlayerId(newPlayer.id);
      joinRoom(joinCode.toUpperCase(), newPlayer);
      setRoomCode(joinCode.toUpperCase());
      // Wait for update_players or game_started
      // Show "Waiting for host..." screen?
      setScreen('JOIN_LOBBY'); // Stay here but show waiting state
  };

  const handleSetupComplete = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    setScreen('MENU');
  };

  const handleSelectGame = (gameId: GameType) => {
    setActiveGame(gameId);
    setScreen('GAME');
    
    if (mode === 'HOST') {
        const socket = getSocket();
        socket?.emit('start_game', { roomCode, gameId });
    }
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
          
          if (mode === 'HOST') {
              syncPlayers(roomCode, updated);
          }
          return updated;
      });
  };

  // Commits results to stats - call at end of round/game
  const handleRoundComplete = (result: RoundResult) => {
      setPlayers(current => {
          const updated = updatePlayerStats(current, result);
          if (mode === 'HOST') {
              syncPlayers(roomCode, updated);
          }
          return updated;
      });
  };

  // Render content based on state
  const renderContent = () => {
    switch (screen) {
      case 'MODE_SELECT':
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-8 motion-safe:animate-fade-in p-4 sm:p-8">
                <div className="text-center space-y-3">
                    <h1 className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 tracking-tighter drop-shadow-sm">PartyAI</h1>
                    <p className="text-gray-400 font-medium tracking-wide">The Ultimate Game Night Experience</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    <button 
                        onClick={() => handleModeSelect('SINGLE')}
                        className="group relative p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 motion-safe:transition-all hover:scale-[1.02] active:scale-[0.98] text-left overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="text-5xl mb-5 filter drop-shadow-md group-hover:scale-110 motion-safe:transition-transform duration-300 origin-left">📱</div>
                        <h3 className="text-2xl font-black mb-2 tracking-tight text-white">Single Device</h3>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed">Pass the phone around. Perfect for small groups or quick games.</p>
                    </button>

                    <button 
                        onClick={() => handleModeSelect('HOST')}
                        className="group relative p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 motion-safe:transition-all hover:scale-[1.02] active:scale-[0.98] text-left overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-purple-500/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="text-5xl mb-5 filter drop-shadow-md group-hover:scale-110 motion-safe:transition-transform duration-300 origin-left">📺</div>
                        <h3 className="text-2xl font-black mb-2 tracking-tight text-white">Host Party</h3>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed">Use this device as the TV/Board. Players join with their phones.</p>
                    </button>
                    
                    <button 
                        onClick={() => handleModeSelect('PLAYER')}
                        className="md:col-span-2 group relative p-6 sm:p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 motion-safe:transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-6 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-green-500/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="text-5xl filter drop-shadow-md group-hover:scale-110 motion-safe:transition-transform duration-300 origin-left">👋</div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">Join Existing Party</h3>
                            <p className="text-gray-400 text-sm font-medium">Enter a room code to join a game nearby.</p>
                        </div>
                    </button>
                </div>
            </div>
        );

      case 'HOST_LOBBY':
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-widest mb-2">Room Code</h2>
                    <div className="text-7xl font-black font-mono text-white tracking-wider mb-8">{roomCode}</div>
                    
                    <div className="bg-white p-4 rounded-3xl shadow-2xl mx-auto w-fit mb-8">
                        <QRCodeSVG value={`${window.location.origin}/#/join/${roomCode}`} size={200} />
                    </div>
                    
                    <p className="text-gray-400 mb-8">Scan to join or visit <span className="text-white font-mono">{window.location.host}/#/join/{roomCode}</span></p>
                </div>

                <div className="w-full max-w-2xl bg-white/5 rounded-3xl p-6 border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl">Players ({players.length})</h3>
                        {players.length > 0 && <span className="animate-pulse text-green-400 text-sm font-bold">● Waiting for more...</span>}
                    </div>
                    
                    {players.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 italic">Waiting for players to join...</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {players.map(p => (
                                <div key={p.id} className="bg-black/20 p-3 rounded-xl flex items-center gap-3 animate-slide-in">
                                    <span className="text-2xl">{p.avatar}</span>
                                    <span className="font-bold truncate">{p.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button 
                    size="lg" 
                    onClick={() => setScreen('MENU')} 
                    disabled={players.length < 1}
                    className="w-full max-w-md shadow-xl"
                >
                    Start Game
                </Button>
            </div>
        );

      case 'JOIN_LOBBY':
        if (roomCode && myPlayerId) {
            // Waiting for host to start
            return (
                <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in p-4 text-center">
                    <div className="text-6xl animate-bounce">⏳</div>
                    <h2 className="text-3xl font-bold">You're in!</h2>
                    <p className="text-gray-400">Waiting for host to start the game...</p>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Room</p>
                        <p className="text-2xl font-mono font-bold">{roomCode}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in p-4 max-w-md mx-auto w-full">
                <h2 className="text-3xl font-bold">Join Party</h2>
                <Card className="w-full space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Room Code</label>
                        <input 
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="ABCD"
                            maxLength={4}
                            className="w-full bg-black/30 border-2 border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono text-2xl tracking-widest focus:border-indigo-500 outline-none uppercase"
                        />
                    </div>
                    
                    <PlayerSetup 
                        onComplete={(p) => {
                            // PlayerSetup returns array, we just take the first one as "me"
                            if (p.length > 0) handleJoinRoom(p[0].name, p[0].avatar);
                        }} 
                        lang={settings.language}
                        initialPlayers={[]} // Single player setup mode
                    />
                </Card>
                <Button variant="ghost" onClick={() => setScreen('MODE_SELECT')}>Back</Button>
            </div>
        );

      case 'SETUP':
        return <PlayerSetup onComplete={handleSetupComplete} lang={settings.language} initialPlayers={players} />;
      
      case 'MENU':
        // GameMenu now handles its own scrolling and layout
        return <GameMenu onSelectGame={handleSelectGame} onBack={() => setScreen('MODE_SELECT')} lang={settings.language} />;

      case 'GAME':
        if (!activeGame) return null;
        
        // If Player Mode, show controller view (placeholder for now)
        if (mode === 'PLAYER') {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">Look at the TV!</h2>
                    <p className="text-gray-400">Game is in progress.</p>
                    {/* Future: Render specific game controller here */}
                </div>
            );
        }

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
    <div className={`min-h-[100dvh] ${settings.highContrast ? 'bg-black text-white' : 'bg-[#0f172a] text-white'} selection:bg-indigo-500/30 font-inter flex flex-col overflow-hidden`}>
      {/* Dynamic Background */}
      {!settings.highContrast && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] motion-safe:animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] motion-safe:animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      <div className="relative z-10 w-full mx-auto px-4 sm:px-6 flex flex-col h-[100dvh] motion-safe:transition-all duration-500 ease-in-out md:max-w-4xl lg:max-w-6xl">
        {/* Header - Safe Area Top for Dynamic Island */}
        <header className="flex-none flex justify-between items-center z-50 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
           <div className="flex items-center gap-3" onClick={() => { 
               if(screen === 'GAME') { confirmExitGame(); }
               else if(screen === 'MENU') { setScreen('MODE_SELECT'); playSound('click'); }
               else if(screen === 'HOST_LOBBY') { setScreen('MODE_SELECT'); playSound('click'); }
               else if(screen === 'SETUP') { setScreen('MODE_SELECT'); playSound('click'); }
               else { setScreen('MODE_SELECT'); playSound('click'); }
           }}>
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[14px] flex items-center justify-center font-black text-white shadow-lg cursor-pointer transform hover:scale-105 motion-safe:transition-transform text-xl border border-white/10">
                P
              </div>
              <span className="font-black text-2xl tracking-tight cursor-pointer hidden sm:block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">PartyAI</span>
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
                onClick={handleToggleHaptics}
                className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all active:scale-95 ${!isHapticsEnabled ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/10 border-white/5 text-gray-300 hover:text-white'}`}
                aria-label={isHapticsEnabled ? "Disable Haptics" : "Enable Haptics"}
             >
                {isHapticsEnabled ? '📳' : '📴'}
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
