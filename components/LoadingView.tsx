
import React from 'react';
import { GameType } from '../types';

interface LoadingViewProps {
  message: string;
  gameType?: GameType;
  icon?: string; // Fallback
  className?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ message, gameType, icon = '✨', className = '' }) => {
  
  const [fact, setFact] = React.useState('');

  React.useEffect(() => {
    const facts = [
      "Did you know? The first party game was likely 'Simon Says' in ancient Rome.",
      "Fun Fact: Charades was originally a literary game in 18th century France.",
      "Trivia: The word 'trivia' comes from Roman 'tri-via' (three roads meeting).",
      "Tip: Acting silly increases your chances of winning by 200%.",
      "Loading... The AI is reading the entire internet for you.",
      "Wait for it... Greatness takes time (but not too much).",
      "Did you know? Bananas are berries, but strawberries aren't.",
      "Pro Tip: Speak clearly for the AI, but shout for dramatic effect.",
      "Fact: Laughing burns calories. This game is a workout.",
      "Generating fun... Please hold your applause."
    ];
    setFact(facts[Math.floor(Math.random() * facts.length)]);
    
    const interval = setInterval(() => {
        setFact(facts[Math.floor(Math.random() * facts.length)]);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const renderAnimation = () => {
    switch (gameType) {
      case GameType.PICTIONARY:
        return (
          <div className="relative w-24 h-24 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              <path 
                d="M 20 80 Q 50 20 80 80" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
                className="text-pink-500 opacity-50"
                strokeDasharray="10 10"
              >
                <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.5s" repeatCount="indefinite" />
              </path>
              <g className="animate-bounce">
                 <text x="30" y="60" fontSize="40">✏️</text>
              </g>
            </svg>
          </div>
        );

      case GameType.TRIVIA:
      case GameType.WHO_AM_I:
        return (
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
             <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
             <div className="text-6xl animate-bounce text-blue-400">?</div>
             <div className="absolute -right-4 -top-4 text-4xl animate-pulse delay-75">💡</div>
          </div>
        );

      case GameType.IMPOSTOR:
      case GameType.SECRET_CODE:
      case GameType.MURDER_MYSTERY:
        return (
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
             {/* Radar Sweep Effect */}
             <div className="absolute inset-0 rounded-full border-2 border-green-500/30 overflow-hidden bg-green-900/10">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-[spin_2s_linear_infinite] origin-bottom-right" style={{ transformOrigin: '50% 50%' }}></div>
             </div>
             <div className="text-5xl z-10 animate-pulse">🕵️</div>
             <div className="absolute top-2 right-6 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
          </div>
        );

      case GameType.DEBATE:
        return (
          <div className="relative w-24 h-24 mb-6 flex justify-center items-center gap-2">
             <div className="text-5xl animate-[bounce_1s_infinite]">🗣️</div>
             <div className="text-5xl animate-[bounce_1s_infinite] delay-150 scale-x-[-1]">🗣️</div>
          </div>
        );
        
      case GameType.CHARADES:
        return (
           <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <div className="text-6xl animate-[spin_3s_linear_infinite]">🎭</div>
              <div className="absolute -bottom-2 text-2xl animate-bounce">🎬</div>
           </div>
        );

      case GameType.SCATTERGORIES:
      case GameType.FORBIDDEN_WORDS:
        return (
           <div className="relative w-24 h-24 mb-6 flex items-center justify-center gap-1">
              <div className="text-4xl animate-bounce delay-0">A</div>
              <div className="text-4xl animate-bounce delay-100">B</div>
              <div className="text-4xl animate-bounce delay-200">C</div>
           </div>
        );

      default:
        // Default generic animation
        return (
          <div className="text-6xl mb-6 animate-bounce filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {icon}
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[50vh] motion-safe:animate-fade-in text-center p-6 ${className}`}>
      {renderAnimation()}
      
      <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 motion-safe:animate-pulse tracking-tight">
        {message}
      </h3>
      
      <p className="mt-4 text-sm text-gray-400 max-w-sm mx-auto font-medium opacity-80 h-10 transition-opacity duration-500">
        {fact}
      </p>

      {/* Loading Dots */}
      <div className="mt-8 flex gap-2 justify-center opacity-80">
         <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full motion-safe:animate-bounce" style={{ animationDelay: '0s' }}></div>
         <div className="w-2.5 h-2.5 bg-purple-400 rounded-full motion-safe:animate-bounce" style={{ animationDelay: '0.15s' }}></div>
         <div className="w-2.5 h-2.5 bg-pink-400 rounded-full motion-safe:animate-bounce" style={{ animationDelay: '0.3s' }}></div>
      </div>
    </div>
  );
};
