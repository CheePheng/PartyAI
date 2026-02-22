
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { Player, SecretCodeWord, Language, GameType } from '../types';
import { generateSecretCodeWords } from '../services/geminiService';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface SecretCodeGameProps {
  players: Player[];
  updateScore: (playerId: string, points: number) => void;
  onExit: () => void;
  lang: Language;
}

export const SecretCodeGame: React.FC<SecretCodeGameProps> = ({ players, updateScore, onExit, lang }) => {
  const [words, setWords] = useState<SecretCodeWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [phase, setPhase] = useState<'SETUP' | 'GAME' | 'GAME_OVER'>('SETUP');
  const [turn, setTurn] = useState<'RED' | 'BLUE'>('RED');
  const [viewMode, setViewMode] = useState<'PLAYER' | 'SPYMASTER'>('PLAYER');
  const [redSpymaster, setRedSpymaster] = useState<string>('');
  const [blueSpymaster, setBlueSpymaster] = useState<string>('');
  const [redTeam, setRedTeam] = useState<Player[]>([]);
  const [blueTeam, setBlueTeam] = useState<Player[]>([]);
  const [winner, setWinner] = useState<'RED' | 'BLUE' | null>(null);
  const [confirmReveal, setConfirmReveal] = useState(false);
  
  const t = translations[lang];

  // Logic to calculate remaining cards
  const redLeft = words.filter(w => w.type === 'RED' && !w.revealed).length;
  const blueLeft = words.filter(w => w.type === 'BLUE' && !w.revealed).length;

  const startGame = async () => {
    playSound('click');
    setLoading(true);
    setError(false);
    
    const generatedWords = await generateSecretCodeWords(lang);
    
    if (!generatedWords) {
        setLoading(false);
        setError(true);
        return;
    }

    // Assign colors
    // Standard: 9 Starting Team, 8 Second Team, 7 Neutral, 1 Assassin
    const startingTeam = Math.random() > 0.5 ? 'RED' : 'BLUE';
    setTurn(startingTeam);
    
    const shuffledTypes: ('RED' | 'BLUE' | 'NEUTRAL' | 'ASSASSIN')[] = [
        ...Array(startingTeam === 'RED' ? 9 : 8).fill('RED'),
        ...Array(startingTeam === 'BLUE' ? 9 : 8).fill('BLUE'),
        ...Array(7).fill('NEUTRAL'),
        'ASSASSIN'
    ];

    // Fisher-Yates shuffle types
    for (let i = shuffledTypes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTypes[i], shuffledTypes[j]] = [shuffledTypes[j], shuffledTypes[i]];
    }

    const gameBoard: SecretCodeWord[] = generatedWords.map((word, idx) => ({
        word,
        type: shuffledTypes[idx],
        revealed: false
    }));

    setWords(gameBoard);
    setLoading(false);
    setPhase('GAME');
    playSound('start');
  };

  const handleCardClick = (index: number) => {
    // Only allow clicking in player view during game
    if (phase !== 'GAME' || viewMode === 'SPYMASTER') return;
    if (words[index].revealed) return;

    playSound('click');
    
    const clickedWord = words[index];
    const newWords = [...words];
    newWords[index].revealed = true;
    setWords(newWords);

    if (clickedWord.type === 'ASSASSIN') {
        playSound('error');
        setWinner(turn === 'RED' ? 'BLUE' : 'RED');
        setPhase('GAME_OVER');
    } else if (clickedWord.type === 'NEUTRAL') {
        playSound('click');
        // End turn
        setTurn(prev => prev === 'RED' ? 'BLUE' : 'RED');
    } else if (clickedWord.type !== turn) {
        playSound('error');
        // Clicked opponent's card -> End turn
        setTurn(prev => prev === 'RED' ? 'BLUE' : 'RED');
    } else {
        playSound('success');
        // Correct guess, turn continues
    }
  };

  // Check win condition after update
  React.useEffect(() => {
      if (phase === 'GAME') {
          const r = words.filter(w => w.type === 'RED' && !w.revealed).length;
          const b = words.filter(w => w.type === 'BLUE' && !w.revealed).length;
          
          if (r === 0) {
              setWinner('RED');
              setPhase('GAME_OVER');
              playSound('win');
          } else if (b === 0) {
              setWinner('BLUE');
              setPhase('GAME_OVER');
              playSound('win');
          }
      }
  }, [words, phase]);

  // Auto-assign teams on mount
  React.useEffect(() => {
     if (players.length > 0 && redTeam.length === 0) {
         const shuffled = [...players].sort(() => 0.5 - Math.random());
         const mid = Math.ceil(shuffled.length / 2);
         const r = shuffled.slice(0, mid);
         const b = shuffled.slice(mid);
         setRedTeam(r);
         setBlueTeam(b);
         if(r.length > 0) setRedSpymaster(r[0].id);
         if(b.length > 0) setBlueSpymaster(b[0].id);
     }
  }, [players]);


  if (loading) return <LoadingView message={t.loadingSecretCode} gameType={GameType.SECRET_CODE} />;
  if (error) return <ErrorView onRetry={startGame} lang={lang} />;

  if (phase === 'SETUP') {
      return (
          <div className="max-w-md mx-auto space-y-6 flex flex-col h-full animate-fade-in">
              <h2 className="text-3xl font-bold text-center">🕵️ {t.secretCodeTitle}</h2>
              <Card className="space-y-6">
                  <div className="space-y-4">
                      {/* Red Team Setup */}
                      <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/20">
                          <h3 className="text-red-400 font-bold uppercase text-xs tracking-widest mb-2">{t.redTeam}</h3>
                          <div className="flex flex-wrap gap-2">
                              {redTeam.map(p => (
                                  <div key={p.id} onClick={() => setRedSpymaster(p.id)} className={`px-2 py-1 rounded text-sm cursor-pointer border ${redSpymaster === p.id ? 'bg-red-500 text-white border-red-400 font-bold' : 'bg-black/20 text-gray-400 border-transparent'}`}>
                                      {redSpymaster === p.id && "👑 "}{p.name}
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Blue Team Setup */}
                      <div className="bg-blue-900/20 p-3 rounded-xl border border-blue-500/20">
                          <h3 className="text-blue-400 font-bold uppercase text-xs tracking-widest mb-2">{t.blueTeam}</h3>
                          <div className="flex flex-wrap gap-2">
                              {blueTeam.map(p => (
                                  <div key={p.id} onClick={() => setBlueSpymaster(p.id)} className={`px-2 py-1 rounded text-sm cursor-pointer border ${blueSpymaster === p.id ? 'bg-blue-500 text-white border-blue-400 font-bold' : 'bg-black/20 text-gray-400 border-transparent'}`}>
                                      {blueSpymaster === p.id && "👑 "}{p.name}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center italic">
                      Tap a name to make them Spymaster.
                  </div>

                  <Button onClick={startGame} className="w-full text-lg shadow-xl">{t.startPartyBtn}</Button>
              </Card>
              <div className="flex-1"></div>
              <Button variant="ghost" onClick={onExit}>{t.exitGame}</Button>
          </div>
      );
  }

  // GAME BOARD
  return (
      <div className="flex flex-col h-full pb-32">
          {/* Top Info Bar */}
          <div className="flex-none flex justify-between items-center p-3 bg-white/5 border-b border-white/5">
              <div className={`flex flex-col px-3 py-1 rounded-lg ${turn === 'RED' ? 'bg-red-500/20 border border-red-500/50' : 'opacity-50'}`}>
                  <span className="text-xs font-bold text-red-400 uppercase">Red Left</span>
                  <span className="text-2xl font-black text-red-500 leading-none">{redLeft}</span>
              </div>
              
              <div className="text-center">
                  <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${turn === 'RED' ? 'text-red-400' : 'text-blue-400'}`}>
                      {turn === 'RED' ? "Red Turn" : "Blue Turn"}
                  </div>
                  {/* Spymaster Toggle */}
                  {phase === 'GAME' && (
                      <button 
                        onClick={() => {
                            if (viewMode === 'PLAYER') setConfirmReveal(true);
                            else setViewMode('PLAYER');
                            playSound('click');
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${viewMode === 'SPYMASTER' ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-white/10 text-gray-300 border-white/10'}`}
                      >
                          {viewMode === 'SPYMASTER' ? '👁️ Spymaster' : '🔒 Player View'}
                      </button>
                  )}
              </div>

              <div className={`flex flex-col px-3 py-1 rounded-lg ${turn === 'BLUE' ? 'bg-blue-500/20 border border-blue-500/50' : 'opacity-50'}`}>
                  <span className="text-xs font-bold text-blue-400 uppercase">Blue Left</span>
                  <span className="text-2xl font-black text-blue-500 leading-none">{blueLeft}</span>
              </div>
          </div>

          {/* Confirm Reveal Overlay */}
          {confirmReveal && (
              <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{t.confirmReveal}</h3>
                  <p className="text-gray-400 mb-6">{t.revealWarning}</p>
                  <div className="flex gap-4 w-full max-w-xs">
                      <Button variant="secondary" onClick={() => setConfirmReveal(false)} className="flex-1">Cancel</Button>
                      <Button onClick={() => { setViewMode('SPYMASTER'); setConfirmReveal(false); }} className="flex-1">Reveal</Button>
                  </div>
              </div>
          )}
          
          {/* Game Over Overlay */}
          {phase === 'GAME_OVER' && (
              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className={`text-4xl font-black mb-2 ${winner === 'RED' ? 'text-red-500' : 'text-blue-500'}`}>
                      {winner === 'RED' ? t.redTeam : t.blueTeam} {t.teamWins}
                  </h2>
                  <Button onClick={() => setPhase('SETUP')} className="mt-8 w-full max-w-xs">Play Again</Button>
                  <Button variant="secondary" onClick={onExit} className="mt-4 w-full max-w-xs">Exit</Button>
              </div>
          )}

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
             <div className="grid grid-cols-5 gap-2 h-full max-h-[80vh] aspect-square mx-auto">
                 {words.map((w, idx) => {
                     const isRevealed = w.revealed || viewMode === 'SPYMASTER' || phase === 'GAME_OVER';
                     
                     let bgClass = "bg-[#1e293b] border-white/10 text-gray-200"; // Default hidden
                     
                     if (isRevealed) {
                         if (w.type === 'RED') bgClass = "bg-red-500 text-white border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
                         else if (w.type === 'BLUE') bgClass = "bg-blue-500 text-white border-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.4)]";
                         else if (w.type === 'ASSASSIN') bgClass = "bg-gray-900 text-white border-gray-700 relative overflow-hidden";
                         else bgClass = "bg-[#334155] text-gray-400 border-gray-600";
                     }

                     // Opacity for revealed cards in player view
                     if (w.revealed && viewMode === 'SPYMASTER') {
                        bgClass += " opacity-40 grayscale";
                     }

                     return (
                         <button
                            key={idx}
                            onClick={() => handleCardClick(idx)}
                            className={`
                                relative rounded-lg flex items-center justify-center p-1 text-[10px] sm:text-xs font-bold leading-tight transition-all duration-300 border-2 select-none
                                ${bgClass}
                                ${!w.revealed && phase === 'GAME' && viewMode === 'PLAYER' ? 'active:scale-95 hover:border-white/30' : ''}
                            `}
                         >
                            <span className="break-all">{w.word}</span>
                            {w.type === 'ASSASSIN' && isRevealed && <span className="absolute inset-0 flex items-center justify-center text-3xl opacity-30">☠️</span>}
                            {w.revealed && viewMode === 'PLAYER' && <span className="absolute top-0.5 right-0.5 text-[8px]">👁️</span>}
                         </button>
                     )
                 })}
             </div>
          </div>

          {/* Bottom Control */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent z-20 flex justify-center pb-24 animate-slide-up">
              {viewMode === 'PLAYER' && phase === 'GAME' && (
                  <Button variant="secondary" onClick={() => { setTurn(t => t === 'RED' ? 'BLUE' : 'RED'); playSound('click'); }}>
                      {t.passTurn}
                  </Button>
              )}
              {viewMode === 'SPYMASTER' && (
                   <div className="bg-black/80 px-4 py-2 rounded-xl text-sm font-bold text-yellow-400 border border-yellow-500/30">
                       Spymaster Mode Active
                   </div>
              )}
          </div>
      </div>
  );
};
