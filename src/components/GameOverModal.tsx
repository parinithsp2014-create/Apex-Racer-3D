import React, { useEffect } from 'react';
import { GameTelemetry } from '../types/game';
import { Trophy, RefreshCw, Flag, Gauge, Zap, Coins, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  stats: GameTelemetry;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart, onBackToMenu }) => {
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;

  useEffect(() => {
    if (isNewHighScore) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // canvas-confetti fallback
      }
    }
  }, [isNewHighScore]);

  // Restart on Space or Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  return (
    <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Header Badge */}
        <div className="flex flex-col items-center">
          <span className="text-4xl sm:text-5xl mb-2">🏁</span>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white">
            RACE OVER
          </h2>
          {isNewHighScore ? (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 text-xs font-black uppercase tracking-wider animate-pulse">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> NEW PERSONAL BEST!
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1">Great run! Better luck dodging the next truck.</p>
          )}
        </div>

        {/* Primary Score Board */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            Total Score
          </span>
          <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono mt-1">
            {stats.score.toLocaleString()}
          </div>
        </div>

        {/* Race Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Distance</span>
            <span className="text-base font-bold text-white font-mono mt-0.5 block">
              {(stats.distance / 1000).toFixed(2)} km
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Top Speed</span>
            <span className="text-base font-bold text-cyan-400 font-mono mt-0.5 block">
              {stats.topSpeed} km/h
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Near Misses</span>
            <span className="text-base font-bold text-orange-400 font-mono mt-0.5 block">
              {stats.nearMisses}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Coins</span>
            <span className="text-base font-bold text-yellow-400 font-mono mt-0.5 block">
              {stats.coins}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-500 hover:via-orange-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-950 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> PLAY AGAIN (SPACE)
          </button>

          <button
            onClick={onBackToMenu}
            className="py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm tracking-wide transition border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Garage
          </button>
        </div>
      </div>
    </div>
  );
};
