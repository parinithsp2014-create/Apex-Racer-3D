import React, { useState } from 'react';
import { CameraMode, ThemeId } from '../types/game';
import { THEMES } from '../game/themes';
import { Camera, Sun, Music, Keyboard, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface ControlsDockProps {
  cameraMode: CameraMode;
  onSelectCamera: (mode: CameraMode) => void;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  isMusicOn: boolean;
  onToggleMusic: () => void;
}

export const ControlsDock: React.FC<ControlsDockProps> = ({
  cameraMode,
  onSelectCamera,
  currentTheme,
  onSelectTheme,
  isMusicOn,
  onToggleMusic,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <>
      {/* Bottom Center Dock Container */}
      <div
        className={`fixed bottom-2 left-1/2 -translate-x-1/2 z-30 transition-transform duration-300 ease-in-out flex flex-col items-center max-w-[min(940px,96vw)] ${
          isCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse / Expand Toggle Tab */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-3 py-1 bg-slate-900/95 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-t-lg border-t border-x border-slate-700/80 shadow-md flex items-center gap-1.5 transition select-none"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Controls & Themes</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Dock (Cinema Mode)</span>
            </>
          )}
        </button>

        {/* Main Dock Bar */}
        <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-2.5 select-none text-xs">
          {/* Camera View Pills */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
            <span className="hidden sm:inline text-slate-400 font-semibold px-1.5 flex items-center gap-1">
              <Camera className="w-3 h-3 text-cyan-400" /> Cam
            </span>
            {(['chase', 'hood', 'cinematic'] as CameraMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onSelectCamera(mode)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition ${
                  cameraMode === mode
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {mode === 'chase' ? 'Chase' : mode === 'hood' ? 'Hood' : 'Action'}
              </button>
            ))}
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 overflow-x-auto">
            <span className="hidden sm:inline text-slate-400 font-semibold px-1.5 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" /> World
            </span>
            {(Object.keys(THEMES) as ThemeId[]).map((tId) => (
              <button
                key={tId}
                onClick={() => onSelectTheme(tId)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition ${
                  currentTheme === tId
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {tId}
              </button>
            ))}
          </div>

          {/* Soundtrack & Controls Guide Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleMusic}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium transition ${
                isMusicOn
                  ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle Retro Synthwave Soundtrack"
            >
              <Music className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">{isMusicOn ? 'Synth: ON' : 'Synth: OFF'}</span>
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 font-medium transition"
              title="View Keyboard Controls Guide"
            >
              <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Controls</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTROLS HELP MODAL */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400">
                <Keyboard className="w-5 h-5" /> Game Controls
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Steer Left / Right</span>
                <span className="font-mono bg-slate-800 px-2.5 py-0.5 rounded text-cyan-300 font-bold">
                  A / D or ◄ / ►
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Accelerate (Gas)</span>
                <span className="font-mono bg-slate-800 px-2.5 py-0.5 rounded text-emerald-300 font-bold">
                  W or ▲
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Brake / Reverse</span>
                <span className="font-mono bg-slate-800 px-2.5 py-0.5 rounded text-rose-300 font-bold">
                  S or ▼
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Nitro Boost</span>
                <span className="font-mono bg-slate-800 px-2.5 py-0.5 rounded text-amber-300 font-bold">
                  SPACE or SHIFT
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Honk Horn</span>
                <span className="font-mono bg-slate-800 px-2.5 py-0.5 rounded text-yellow-300 font-bold">
                  H
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Pause Game</span>
                <span className="font-mono bg-slate-800 px-2.5 py-0.5 rounded text-slate-300 font-bold">
                  ESC or P
                </span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Pro Racing Tips:
              </p>
              <p>• Overtake traffic within inches to trigger Near-Miss bonus points & refill Nitro!</p>
              <p>• Collect Shield orbs to smash through traffic unscathed.</p>
              <p>• Collect Magnets to vacuum all gold coins from the highway.</p>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm tracking-wide transition"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </>
  );
};
