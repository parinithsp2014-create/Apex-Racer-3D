import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onBackToMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onBackToMenu,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-5">
        <h2 className="text-2xl font-black italic tracking-wider text-white">
          GAME PAUSED
        </h2>

        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm uppercase tracking-wider shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" /> RESUME RACE
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm tracking-wide transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Restart Race
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" /> Sound: Muted
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" /> Sound: Enabled
              </>
            )}
          </button>

          <button
            onClick={onBackToMenu}
            className="w-full py-2.5 px-5 rounded-xl bg-transparent hover:bg-slate-800/80 text-slate-400 hover:text-white text-xs font-semibold tracking-wide transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" /> Exit to Garage
          </button>
        </div>
      </div>
    </div>
  );
};
