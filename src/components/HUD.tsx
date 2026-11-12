import React from 'react';
import { GameTelemetry, NearMissEvent } from '../types/game';
import { Flame, Shield, Magnet, Coins, Gauge, Volume2, VolumeX, Pause } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface HUDProps {
  telemetry: GameTelemetry;
  nearMisses: NearMissEvent[];
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onSteerLeft: (active: boolean) => void;
  onSteerRight: (active: boolean) => void;
  onAccelerate: (active: boolean) => void;
  onBrake: (active: boolean) => void;
  onNitro: (active: boolean) => void;
  onHorn: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  telemetry,
  nearMisses,
  onPause,
  isMuted,
  onToggleMute,
  onSteerLeft,
  onSteerRight,
  onAccelerate,
  onBrake,
  onNitro,
  onHorn,
}) => {
  // Speedometer radial calculation
  const speed = telemetry.speed;
  const maxDialSpeed = 260;
  const speedPercent = Math.min(100, (speed / maxDialSpeed) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 overflow-hidden select-none">
      {/* TOP BAR */}
      <div className="flex items-start justify-between w-full">
        {/* Top Left: Speed & Gear Display */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/85 border border-slate-700/80 rounded-xl px-4 py-2.5 shadow-xl backdrop-blur-none flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black tracking-tighter text-white font-mono">
              {speed}
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">KM/H</span>
              <span className="text-xs font-semibold text-emerald-400">GEAR {telemetry.gear}</span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">RPM</span>
            <span className="text-cyan-400 font-bold font-mono">{telemetry.rpm.toLocaleString()}</span>
          </div>
        </div>

        {/* Top Center: Floating Near-Miss Notifications */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col items-center gap-1.5 pointer-events-none">
          {nearMisses.map(event => (
            <div
              key={event.id}
              className="animate-bounce bg-amber-500 text-slate-950 px-3.5 py-1 rounded-full font-black text-xs md:text-sm tracking-wide shadow-lg border border-amber-300"
            >
              ⚡ {event.message} +{event.points}
            </div>
          ))}

          {telemetry.multiplier > 1 && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider shadow">
              {telemetry.multiplier}x COMBO MULTIPLIER
            </div>
          )}
        </div>

        {/* Top Right: Score, Coins, Distance, Audio & Pause Controls */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/85 border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-xl flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Score</span>
            <span className="text-xl md:text-2xl font-black text-amber-400 font-mono">
              {telemetry.score.toLocaleString()}
            </span>
          </div>

          <div className="hidden md:flex bg-slate-900/85 border border-slate-700/80 rounded-xl px-3 py-2 items-center gap-2 text-yellow-400">
            <Coins className="w-4 h-4" />
            <span className="font-bold font-mono text-sm">{telemetry.coins}</span>
          </div>

          <div className="hidden md:flex bg-slate-900/85 border border-slate-700/80 rounded-xl px-3 py-2 flex-col items-end text-xs text-slate-300">
            <span className="text-[10px] text-slate-400 uppercase">Distance</span>
            <span className="font-mono font-bold">{(telemetry.distance / 1000).toFixed(2)} km</span>
          </div>

          <button
            onClick={onToggleMute}
            className="pointer-events-auto p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onPause}
            className="pointer-events-auto p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Pause Game (ESC / P)"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MID VIEWPORT: ACTIVE POWER-UP BUFFS */}
      <div className="flex flex-col gap-2 items-start mt-4">
        {telemetry.shieldRemaining > 0 && (
          <div className="flex items-center gap-2 bg-cyan-950/90 border border-cyan-500/80 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
            <Shield className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>SHIELD: {telemetry.shieldRemaining}s</span>
          </div>
        )}

        {telemetry.magnetRemaining > 0 && (
          <div className="flex items-center gap-2 bg-amber-950/90 border border-amber-500/80 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
            <Magnet className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>MAGNET: {telemetry.magnetRemaining}s</span>
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: NITRO GAUGE & ON-SCREEN MOBILE CONTROLS */}
      <div className="flex items-end justify-between w-full mb-12 sm:mb-14">
        {/* Left Side: Nitro Gauge & Mobile Steer Left/Right */}
        <div className="flex flex-col gap-3">
          <div className="bg-slate-900/85 border border-slate-700/80 rounded-xl p-3 w-44 md:w-56 shadow-xl">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1 text-cyan-400">
                <Flame className="w-3.5 h-3.5" /> NITRO BOOST
              </span>
              <span className="font-mono text-cyan-300">{telemetry.nitro}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  telemetry.nitro > 20
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${telemetry.nitro}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Hold SHIFT or SPACE to Boost</span>
          </div>

          {/* Touch Steer Buttons for Touchscreens / Mobile */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              onMouseDown={() => onSteerLeft(true)}
              onMouseUp={() => onSteerLeft(false)}
              onMouseLeave={() => onSteerLeft(false)}
              onTouchStart={(e) => { e.preventDefault(); onSteerLeft(true); }}
              onTouchEnd={(e) => { e.preventDefault(); onSteerLeft(false); }}
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-900/90 active:bg-cyan-600 text-white font-black text-xl border-2 border-slate-700 shadow-xl flex items-center justify-center transition active:scale-95"
            >
              ◀
            </button>
            <button
              onMouseDown={() => onSteerRight(true)}
              onMouseUp={() => onSteerRight(false)}
              onMouseLeave={() => onSteerRight(false)}
              onTouchStart={(e) => { e.preventDefault(); onSteerRight(true); }}
              onTouchEnd={(e) => { e.preventDefault(); onSteerRight(false); }}
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-900/90 active:bg-cyan-600 text-white font-black text-xl border-2 border-slate-700 shadow-xl flex items-center justify-center transition active:scale-95"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Right Side: Horn, Brake, Accelerate & Nitro Touch Buttons */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex gap-2">
            <button
              onClick={onHorn}
              className="px-3 py-2 rounded-xl bg-slate-900/90 active:bg-amber-600 text-xs font-bold text-amber-300 border border-slate-700 shadow-lg"
              title="Honk Horn (H)"
            >
              🎺 HORN
            </button>
            <button
              onMouseDown={() => onNitro(true)}
              onMouseUp={() => onNitro(false)}
              onMouseLeave={() => onNitro(false)}
              onTouchStart={(e) => { e.preventDefault(); onNitro(true); }}
              onTouchEnd={(e) => { e.preventDefault(); onNitro(false); }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 active:from-cyan-400 active:to-blue-400 text-xs font-black text-white uppercase tracking-wider shadow-lg border border-cyan-400 active:scale-95"
            >
              ⚡ BOOST
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onMouseDown={() => onBrake(true)}
              onMouseUp={() => onBrake(false)}
              onMouseLeave={() => onBrake(false)}
              onTouchStart={(e) => { e.preventDefault(); onBrake(true); }}
              onTouchEnd={(e) => { e.preventDefault(); onBrake(false); }}
              className="w-16 h-14 md:w-20 md:h-16 rounded-2xl bg-rose-950/90 active:bg-rose-600 text-rose-300 active:text-white font-bold text-xs uppercase border-2 border-rose-800 shadow-xl flex items-center justify-center transition active:scale-95"
            >
              BRAKE
            </button>

            <button
              onMouseDown={() => onAccelerate(true)}
              onMouseUp={() => onAccelerate(false)}
              onMouseLeave={() => onAccelerate(false)}
              onTouchStart={(e) => { e.preventDefault(); onAccelerate(true); }}
              onTouchEnd={(e) => { e.preventDefault(); onAccelerate(false); }}
              className="w-20 h-14 md:w-24 md:h-16 rounded-2xl bg-emerald-600 active:bg-emerald-400 text-white font-black text-sm uppercase tracking-wider border-2 border-emerald-400 shadow-xl flex items-center justify-center transition active:scale-95"
            >
              GAS ⬆
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
