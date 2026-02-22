
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingView } from '../components/LoadingView';
import { Player, PictionaryPrompt, Language, GameType } from '../types';
import { generatePictionaryPrompt } from '../services/geminiService';
import { translations } from '../utils/i18n';
import { playSound } from '../utils/sound';

interface PictionaryGameProps {
  players: Player[];
  updateScore: (playerId: string, points: number) => void;
  onExit: () => void;
  lang: Language;
}

// Expanded Color Palette
const COLORS = [
  '#ffffff', // White
  '#000000', // Black
  '#94a3b8', // Gray
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#78350f', // Brown
];

export const PictionaryGame: React.FC<PictionaryGameProps> = ({ players, updateScore, onExit, lang }) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [prompt, setPrompt] = useState<PictionaryPrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [roundDuration, setRoundDuration] = useState(60);
  const [timer, setTimer] = useState<number>(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<'IRL' | 'DIGITAL'>('IRL');
  
  // Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const lastPointRef = useRef<{x: number, y: number} | null>(null);
  const [historyStep, setHistoryStep] = useState(0);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [peeking, setPeeking] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const t = translations[lang];
  const currentPlayer = players[currentPlayerIdx];

  // Timer Effect
  useEffect(() => {
    let interval: number;
    if (isPlaying && timer > 0) {
      interval = window.setInterval(() => {
        setTimer(t => {
           if (t <= 4 && t > 1) playSound('tick');
           return t - 1;
        });
      }, 1000);
    } else if (timer === 0 && isPlaying) {
      playSound('error');
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timer]);

  // Canvas Resize & History Init Effect
  useEffect(() => {
      if (mode === 'DIGITAL' && showPrompt && canvasRef.current) {
          const canvas = canvasRef.current;
          const parent = canvas.parentElement;
          if (parent) {
              canvas.width = parent.clientWidth;
              canvas.height = parent.clientHeight;
              // Reset context properties after resize if needed
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
                  
                  // Initialize History with blank state
                  const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  historyRef.current = [initialState];
                  setHistoryStep(0);
              }
          }
      }
  }, [mode, showPrompt]);

  const fetchCard = async () => {
    playSound('click');
    setLoading(true);
    const newPrompt = await generatePictionaryPrompt(lang);
    setPrompt(newPrompt);
    setLoading(false);
    setShowPrompt(false);
    setIsPlaying(false);
    setTimer(roundDuration);
  };

  const startRound = () => {
    playSound('click');
    setShowPrompt(true);
    // In digital mode, timer starts immediately when they enter the canvas view
    if (mode === 'DIGITAL') {
        setIsPlaying(true);
        playSound('start');
    }
  };

  const startTimer = () => {
    playSound('start');
    setIsPlaying(true);
  };

  const handleSuccess = () => {
    playSound('success');
    updateScore(currentPlayer.id, 10); 
    nextTurn();
  };

  const handleSkip = () => {
    playSound('error');
    updateScore(currentPlayer.id, 0); // Record participation but no points
    nextTurn();
  };

  const nextTurn = () => {
    setPrompt(null);
    setShowPrompt(false);
    setIsPlaying(false);
    setTimer(roundDuration);
    setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
    // Reset canvas tools
    setBrushColor('#ffffff');
    setTool('brush');
    setBrushSize(4);
    setBrushOpacity(1);
    setConfirmClear(false);
  };

  // --- History Management ---
  const saveHistory = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
          // Optimized: Get canvas dimensions once
          const { width, height } = canvas;
          const newState = ctx.getImageData(0, 0, width, height);
          
          // If we are in the middle of history (did undo), discard future
          const newHistory = historyRef.current.slice(0, historyStep + 1);
          newHistory.push(newState);
          
          // Limit history to last 20 steps to save memory
          if (newHistory.length > 20) {
              newHistory.shift();
          }
          
          historyRef.current = newHistory;
          setHistoryStep(newHistory.length - 1);
      }
  };

  const handleUndo = () => {
      if (historyStep > 0) {
          const newStep = historyStep - 1;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx) {
              ctx.putImageData(historyRef.current[newStep], 0, 0);
              setHistoryStep(newStep);
              playSound('click');
          }
      }
  };

  const handleRedo = () => {
       if (historyStep < historyRef.current.length - 1) {
          const newStep = historyStep + 1;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx) {
              ctx.putImageData(historyRef.current[newStep], 0, 0);
              setHistoryStep(newStep);
              playSound('click');
          }
      }
  };

  // --- Canvas Drawing Logic ---
  const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    if (peeking) return; // Disable drawing while peeking
    const { x, y } = getCoordinates(e);
    lastPointRef.current = { x, y };
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = brushSize * 2; // Eraser usually bigger
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.globalAlpha = 1; // Eraser always full strength
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = brushColor;
            ctx.lineWidth = brushSize;
            ctx.globalAlpha = brushOpacity;
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw a single dot for tap
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Reset path for movement
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        setIsDrawing(true);
    }
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || peeking || !lastPointRef.current) return;
    // Prevent scrolling on mobile while drawing
    if (e.cancelable) e.preventDefault(); 
    
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        // Quadratic Curve Smoothing
        const lastPoint = lastPointRef.current;
        const midPoint = {
            x: (lastPoint.x + x) / 2,
            y: (lastPoint.y + y) / 2
        };

        // Draw curve from context's current position (last start of segment)
        // to midpoint, using lastPoint as control
        ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y);
        ctx.stroke();
        
        // Prepare for next segment
        lastPointRef.current = { x, y };
        ctx.beginPath();
        ctx.moveTo(midPoint.x, midPoint.y);
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
        setIsDrawing(false);
        lastPointRef.current = null;
        saveHistory();
    }
  };

  const handleClear = () => {
      if (!confirmClear) {
          setConfirmClear(true);
          setTimeout(() => setConfirmClear(false), 3000); // Reset after 3s
          return;
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          playSound('click');
          setConfirmClear(false);
          saveHistory();
      }
  };

  if (loading) {
      return <LoadingView message={t.loadingPictionary} gameType={GameType.PICTIONARY} />;
  }

  // SETUP PHASE
  if (!prompt) {
     return (
        <div className="max-w-md mx-auto text-center space-y-6 flex flex-col h-full">
            <h2 className="text-3xl font-bold">🎨 {t.setupPhase}</h2>
            <Card className="space-y-6">
               {/* Mode Selection */}
               <div>
                  <label className="block text-sm font-bold text-gray-400 mb-3">{t.pictionaryMode}</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-xl">
                      <button 
                        onClick={() => { setMode('IRL'); playSound('click'); }}
                        className={`py-3 rounded-lg text-sm font-bold transition-all ${mode === 'IRL' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                      >
                         📝 {t.modeIRL}
                      </button>
                      <button 
                        onClick={() => { setMode('DIGITAL'); playSound('click'); }}
                        className={`py-3 rounded-lg text-sm font-bold transition-all ${mode === 'DIGITAL' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                      >
                         📱 {t.modeDigital}
                      </button>
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-400 mb-3">{t.timerLabel}: {roundDuration}s</label>
                 <div className="flex justify-center gap-3">
                    {[30, 60, 90, 120].map(sec => (
                      <button
                        key={sec}
                        onClick={() => { setRoundDuration(sec); playSound('click'); }}
                        className={`px-4 py-2 rounded-xl border-2 font-bold transition-all ${roundDuration === sec ? 'bg-indigo-500 border-indigo-500 text-white scale-110' : 'border-white/20 hover:bg-white/10'}`}
                      >
                        {sec}s
                      </button>
                    ))}
                 </div>
               </div>

               <div className="pt-4 border-t border-white/10">
                 <p className="mb-4 text-gray-300">{t.nextPlayer}: <span className="font-bold text-indigo-400 text-xl block mt-1">{currentPlayer.name}</span></p>
                 <Button onClick={fetchCard} isLoading={loading} className="w-full text-lg shadow-xl shadow-indigo-500/20">
                    {t.drawCardBtn}
                 </Button>
               </div>
            </Card>
            <div className="flex-1"></div>
            <Button variant="ghost" onClick={onExit}>{t.exitGame}</Button>
        </div>
     )
  }

  // HANDOFF PHASE
  if (!showPrompt) {
    return (
        <div className="max-w-md mx-auto flex flex-col h-full pb-32">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-indigo-300">{t.artist}: {currentPlayer.name}</h2>
                <div className="text-4xl font-mono font-black text-white">{roundDuration}s</div>
             </div>
             <Card className="flex-1 flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[40vh]">
                <div className="space-y-6 animate-fade-in">
                    <div className="text-7xl animate-bounce">🖌️</div>
                    <p className="text-lg">{t.handDevice} <strong>{currentPlayer.name}</strong>.</p>
                    <Button onClick={startRound} size="lg" className="w-full">{t.iAm} {currentPlayer.name}, {t.revealBtn}</Button>
                </div>
             </Card>
             <div className="flex-1"></div>
        </div>
    );
  }

  // GAME PHASE: DIGITAL CANVAS
  if (mode === 'DIGITAL') {
      return (
        <div className="absolute inset-0 z-50 bg-[#0f172a] flex flex-col">
            {/* Top Bar */}
            <div className="flex-none flex items-center justify-between p-3 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">{currentPlayer.avatar}</div>
                    <div className={`text-2xl font-mono font-black ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timer}s</div>
                </div>
                
                {/* Peek Button */}
                <button
                    onPointerDown={() => setPeeking(true)}
                    onPointerUp={() => setPeeking(false)}
                    onPointerLeave={() => setPeeking(false)}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition-all select-none ${peeking ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-300'}`}
                >
                    {peeking ? `👁️ ${t.releaseToHide}` : `🔒 ${t.peekWord}`}
                </button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative overflow-hidden bg-[#1e293b] touch-none">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="absolute inset-0 w-full h-full cursor-crosshair"
                />
                
                {/* Floating Tools */}
                <div className="absolute top-4 right-4 flex flex-col gap-3 max-h-[80vh] overflow-y-auto no-scrollbar py-2">
                    
                    {/* Undo / Redo Group */}
                    <div className="flex gap-2 bg-black/40 p-1.5 rounded-full backdrop-blur-sm justify-center mb-1">
                        <button onClick={handleUndo} disabled={historyStep <= 0} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${historyStep > 0 ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'}`}>
                            ↩️
                        </button>
                        <button onClick={handleRedo} disabled={historyStep >= historyRef.current.length - 1} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${historyStep < historyRef.current.length - 1 ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'}`}>
                            ↪️
                        </button>
                    </div>

                    {/* Clear Canvas */}
                    <button onClick={handleClear} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all flex-shrink-0 self-center ${confirmClear ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-gray-300'}`} title={confirmClear ? "Tap again to clear" : t.clearCanvas}>
                        {confirmClear ? '⚠️' : '🗑️'}
                    </button>
                    
                    {/* Eraser */}
                    <button onClick={() => setTool(tool === 'eraser' ? 'brush' : 'eraser')} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all flex-shrink-0 self-center ${tool === 'eraser' ? 'bg-pink-500 text-white' : 'bg-white/10 text-gray-300'}`}>
                        🧼
                    </button>

                    {/* Size Selector */}
                    <div className="bg-black/40 p-1.5 rounded-full flex flex-col gap-2 items-center backdrop-blur-sm self-center">
                        {[2, 6, 12, 20].map(s => (
                             <button 
                                key={s} 
                                onClick={() => setBrushSize(s)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${brushSize === s ? 'scale-110' : 'opacity-50 hover:opacity-80'}`}
                             >
                                <div className={`rounded-full ${brushSize === s ? 'bg-white' : 'bg-gray-400'}`} style={{ width: Math.min(s, 20), height: Math.min(s, 20) }} />
                             </button>
                        ))}
                    </div>
                    
                    {/* Opacity Selector */}
                     <button 
                        onClick={() => setBrushOpacity(prev => prev === 1 ? 0.3 : 1)} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all text-xs font-bold flex-shrink-0 self-center ${brushOpacity < 1 ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-300'}`}
                    >
                        {brushOpacity === 1 ? '100%' : '30%'}
                    </button>

                    {/* Colors - Enhanced Grid */}
                    <div className="grid grid-cols-2 gap-2 bg-black/30 p-2 rounded-2xl self-center backdrop-blur-sm">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => { setBrushColor(c); setTool('brush'); setBrushOpacity(1); }}
                                className={`w-8 h-8 rounded-full border-2 shadow-sm transition-transform active:scale-95 ${brushColor === c && tool === 'brush' ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                {/* Peek Overlay */}
                {peeking && (
                    <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 animate-fade-in p-6 text-center select-none">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">{prompt?.category}</span>
                        <h2 className="text-5xl font-extrabold text-white mb-4">{prompt?.word}</h2>
                        <div className="text-gray-400 text-sm">{t.difficulty}: {prompt?.difficulty}</div>
                        <p className="mt-8 text-sm text-gray-500 animate-pulse">Release to return to drawing</p>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="flex-none p-4 bg-white/5 border-t border-white/5 pb-safe">
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <Button variant="danger" onClick={handleSkip} className="h-14">{t.skipBtn}</Button>
                    <Button onClick={handleSuccess} className="bg-green-600 hover:bg-green-500 h-14">{t.correctBtn}</Button>
                </div>
            </div>
        </div>
      );
  }

  // GAME PHASE: IRL (PAPER)
  return (
    <div className="max-w-md mx-auto flex flex-col h-full pb-32">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold text-indigo-300">{t.artist}: {currentPlayer.name}</h2>
         <div className={`text-4xl font-mono font-black ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timer}s
         </div>
      </div>

      <Card className="flex-1 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[40vh] animate-fade-in">
          <div className="w-full">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest mb-4 border border-white/10">
               {prompt?.category}
            </span>
            <h3 className="text-5xl font-extrabold mt-2 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 leading-tight">
                {prompt?.word}
            </h3>
            <div className="text-sm text-gray-400">
               {t.difficulty}: <span className="text-white font-bold">{prompt?.difficulty}</span>
            </div>
          </div>

          {!isPlaying && timer > 0 && (
              <div className="space-y-4 w-full">
                  <p className="text-sm text-yellow-300/80 italic">{t.drawInstr}</p>
                  <Button size="lg" onClick={startTimer} className="animate-bounce w-full shadow-2xl shadow-indigo-500/40">
                      {t.startTimer}
                  </Button>
              </div>
          )}

          {timer === 0 && (
              <div className="text-red-400 font-bold text-2xl animate-pulse">{t.timeUp}</div>
          )}
      </Card>

      {/* Sticky Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent z-20 flex justify-center pb-24 animate-slide-up">
           <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <Button variant="danger" onClick={handleSkip} className="h-16 text-lg shadow-lg shadow-red-500/20">{t.skipBtn}</Button>
                <Button onClick={handleSuccess} className="bg-green-600 hover:bg-green-500 h-16 text-lg shadow-lg shadow-green-500/20">
                    {t.correctBtn} (+10)
                </Button>
           </div>
      </div>
    </div>
  );
};
