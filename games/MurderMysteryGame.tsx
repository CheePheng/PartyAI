
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingView } from '../components/LoadingView';
import { PassPhoneScreen } from '../components/PassPhoneScreen';
import { ErrorView } from '../components/ErrorView';
import { Player, MurderMysteryScenario, Language, GameType, RoundResult, PartySettings } from '../types';
import { generateMurderMystery } from '../services/geminiService';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface MurderMysteryGameProps {
  players: Player[];
  onUpdateScore: (playerId: string, points: number) => void;
  onRoundComplete: (result: RoundResult) => void;
  onExit: () => void;
  settings: PartySettings;
}

export const MurderMysteryGame: React.FC<MurderMysteryGameProps> = ({ players, onUpdateScore, onRoundComplete, onExit, settings }) => {
  const [scenario, setScenario] = useState<MurderMysteryScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingIndex, setViewingIndex] = useState(-1);
  const [isRevealed, setIsRevealed] = useState(false);
  const [phase, setPhase] = useState<'SETUP' | 'ROLES' | 'PLAY' | 'ACCUSE' | 'REVEAL'>('SETUP');
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  
  const lang = settings.language;
  const t = translations[lang];

  const start = async () => {
    playSound('click');
    setLoading(true);
    setError(null);
    const response = await generateMurderMystery(players.length, settings);
    const data = response.ok ? response.data : null;

    if (!data) {
        setLoading(false);
        setError("Failed to generate scenario. Please try again.");
        return;
    }

    setScenario(data);
    setLoading(false);
    setPhase('ROLES');
    setViewingIndex(0);
  };

  const nextPlayer = () => {
    playSound('click');
    setIsRevealed(false);
    setViewingIndex(prev => prev + 1);
    if (viewingIndex + 1 >= players.length) {
      setPhase('PLAY');
      playSound('start');
    }
  };

  const handleAccusation = (suspectId: string) => {
      setSelectedSuspect(suspectId);
      setPhase('REVEAL');
      playSound('click');

      if (!scenario) return;

      const killerIndex = scenario.characters.findIndex(c => c.role === 'Killer');
      const killer = players[killerIndex];
      const isCorrect = players[killerIndex].id === suspectId;
      
      const innocents = players.filter(p => p.id !== killer.id);

      let result: RoundResult;

      if (isCorrect) {
          // Innocents win
          result = {
              gameType: GameType.MURDER_MYSTERY,
              winners: innocents.map(p => p.id),
              scores: {
                  ...innocents.reduce((acc, p) => ({ ...acc, [p.id]: 10 }), {}),
                  [killer.id]: 0
              },
              timestamp: Date.now()
          };
      } else {
          // Killer wins
          result = {
              gameType: GameType.MURDER_MYSTERY,
              winners: [killer.id],
              scores: {
                  [killer.id]: 10,
                  ...innocents.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
              },
              timestamp: Date.now()
          };
      }
      onRoundComplete(result);
  };

  if (loading) return <LoadingView message={t.loadingMurder} gameType={GameType.MURDER_MYSTERY} />;

  if (error) {
      return <ErrorView onRetry={start} lang={settings.language} message={error} />;
  }

  if (phase === 'SETUP') {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 flex flex-col h-full">
        <h2 className="text-3xl font-bold text-red-600">🩸 {t.setupPhase}</h2>
        <Card className="space-y-4">
          <p className="text-gray-300">{t.murderIntro}</p>
          <div className="text-sm text-yellow-500 bg-yellow-500/10 p-2 rounded">
             ⚠️ 4+ Players
          </div>
          <Button onClick={start} isLoading={loading} className="w-full">
            {t.murderStart}
          </Button>
        </Card>
        <div className="flex-1"></div>
        <Button variant="ghost" onClick={onExit}>{t.exitGame}</Button>
      </div>
    );
  }

  if (phase === 'ROLES' && scenario) {
    const currentPlayer = players[viewingIndex];
    const character = scenario.characters[viewingIndex];

    if (!isRevealed) {
      return (
        <PassPhoneScreen 
          playerName={currentPlayer.name} 
          onConfirm={() => { setIsRevealed(true); playSound('click'); }} 
          title={`${t.handDevice} ${currentPlayer.name}`}
          buttonText={t.revealBtn}
        />
      );
    }

    return (
      <div className="max-w-md mx-auto space-y-6 text-center">
        <h3 className="text-xl text-gray-400">{t.nextPlayer} {viewingIndex + 1} / {players.length}</h3>
        <h2 className="text-3xl font-bold">{currentPlayer.name}</h2>

        <Card className="min-h-[300px] flex flex-col justify-center items-center">
            <div className="space-y-6 animate-fade-in text-left w-full">
              <div className="text-center">
                 <span className="text-xs uppercase tracking-widest text-gray-500">{t.impostorRole}</span>
                 <h3 className="text-2xl font-bold text-indigo-300">{character.name}</h3>
                 <div className={`inline-block px-3 py-1 rounded-full text-sm mt-2 font-bold ${
                   character.role === 'Killer' ? 'bg-red-500/20 text-red-400' :
                   character.role === 'Detective' ? 'bg-blue-500/20 text-blue-400' :
                   'bg-gray-500/20 text-gray-400'
                 }`}>
                   {character.role}
                 </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl">
                <h4 className="font-bold text-gray-300 mb-1">{t.publicBio}</h4>
                <p className="text-sm text-gray-400">{character.publicBio}</p>
              </div>

              <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl">
                <h4 className="font-bold text-red-300 mb-1">{t.secretInfo} 🤫</h4>
                <p className="text-sm text-red-200">{character.secretInfo}</p>
              </div>

              <Button onClick={nextPlayer} className="w-full mt-4">
                {viewingIndex < players.length - 1 ? t.nextPlayer : t.investigateBtn}
              </Button>
            </div>
        </Card>
      </div>
    );
  }

  // GAME LOOP
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in flex flex-col h-full pb-32">
       {phase === 'PLAY' && (
           <Card className="text-center bg-red-950/30 border-red-900/50">
              <h2 className="text-2xl font-bold text-red-400 mb-2">{scenario?.title}</h2>
              <p className="text-gray-300 italic">"{scenario?.intro}"</p>
              <div className="mt-4 p-2 bg-red-500/10 rounded-lg text-sm text-red-200">
                {t.detectiveInstr}
              </div>
           </Card>
       )}

       {phase === 'ACCUSE' && (
           <div className="text-center mb-4 animate-fade-in">
               <h2 className="text-2xl font-bold text-white mb-2">Who is the Killer?</h2>
               <p className="text-gray-400 text-sm">Tap the suspect to accuse.</p>
           </div>
       )}

       {phase === 'REVEAL' && selectedSuspect && scenario && (
           <Card className="text-center animate-slide-up bg-black/60 backdrop-blur-xl border-2 border-white/20 p-8 z-50">
               {scenario.characters[players.findIndex(p => p.id === selectedSuspect)].role === 'Killer' ? (
                   <div className="space-y-4">
                       <div className="text-6xl animate-bounce">⚖️</div>
                       <h2 className="text-4xl font-black text-green-400">JUSTICE SERVED!</h2>
                       <p className="text-xl text-gray-200">You caught the killer!</p>
                       <div className="p-4 bg-white/10 rounded-xl mt-4">
                           <p className="font-bold text-red-400 text-lg">The Killer was:</p>
                           <p className="text-2xl">{players.find(p => p.id === selectedSuspect)?.name}</p>
                       </div>
                   </div>
               ) : (
                   <div className="space-y-4">
                       <div className="text-6xl animate-shake">🔪</div>
                       <h2 className="text-4xl font-black text-red-500">WRONG SUSPECT!</h2>
                       <p className="text-xl text-gray-200">The killer escaped...</p>
                       <div className="p-4 bg-white/10 rounded-xl mt-4">
                           <p className="font-bold text-green-400 text-lg">The Innocent:</p>
                           <p className="text-2xl text-gray-400 line-through">{players.find(p => p.id === selectedSuspect)?.name}</p>
                           <p className="font-bold text-red-400 text-lg mt-4">Real Killer:</p>
                           <p className="text-2xl">{players[scenario.characters.findIndex(c => c.role === 'Killer')].name}</p>
                       </div>
                   </div>
               )}
               <Button onClick={() => { setPhase('SETUP'); setScenario(null); }} className="w-full mt-8">Play Again</Button>
           </Card>
       )}

       {/* Suspect Grid */}
       <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${phase === 'REVEAL' ? 'opacity-20 pointer-events-none' : ''}`}>
          {players.map((p, idx) => {
             const char = scenario?.characters[idx];
             return (
               <button 
                  key={p.id} 
                  disabled={phase !== 'ACCUSE' && phase !== 'PLAY'}
                  onClick={() => phase === 'ACCUSE' ? handleAccusation(p.id) : null}
                  className={`text-left bg-white/5 p-4 rounded-xl border transition-all relative overflow-hidden group
                    ${phase === 'ACCUSE' ? 'hover:bg-red-500/20 hover:border-red-500/50 cursor-pointer active:scale-95' : 'border-white/5'}
                  `}
               >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{p.avatar}</span>
                    <span className="font-bold text-lg">{p.name}</span>
                  </div>
                  <div className="text-sm text-indigo-300 font-bold mb-1">{char?.name}</div>
                  <div className="text-xs text-gray-400 leading-relaxed">{char?.publicBio}</div>
                  
                  {phase === 'ACCUSE' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="font-black text-red-500 text-xl tracking-widest border-2 border-red-500 px-4 py-1 rounded rotate-[-10deg]">ACCUSE</span>
                      </div>
                  )}
               </button>
             );
          })}
       </div>

       {phase === 'PLAY' && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent z-20 flex justify-center pb-24 animate-slide-up">
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <Button variant="secondary" onClick={() => { setPhase('SETUP'); setScenario(null); playSound('click'); }}>Abort</Button>
                <Button variant="danger" onClick={() => { setPhase('ACCUSE'); playSound('click'); }} className="shadow-lg shadow-red-500/20">
                    Make Accusation
                </Button>
            </div>
         </div>
       )}
       
       {phase === 'ACCUSE' && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent z-20 flex justify-center pb-24 animate-slide-up">
             <Button variant="secondary" onClick={() => { setPhase('PLAY'); playSound('click'); }} className="w-full max-w-md">Cancel Accusation</Button>
          </div>
       )}
    </div>
  );
};
