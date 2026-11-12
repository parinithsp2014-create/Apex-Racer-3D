import React from 'react';
import { CarModelId, CarConfig } from '../types/game';
import { Trophy, Zap, Shield, Flame, Gauge, Sparkles } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  selectedModel: CarModelId;
  onSelectModel: (model: CarModelId) => void;
  selectedColor: number;
  onSelectColor: (hex: number) => void;
  highScore: number;
}

const CAR_OPTIONS: CarConfig[] = [
  {
    id: 'supercar',
    name: 'Apex GT',
    tagline: 'High-downforce aerodynamic track monster',
    defaultColor: 0xee1122,
    availableColors: [
      { name: 'Racing Red', hex: 0xee1122 },
      { name: 'Monaco Blue', hex: 0x1d4ed8 },
      { name: 'Solar Yellow', hex: 0xeab308 },
      { name: 'Acid Green', hex: 0x22c55e },
      { name: 'Stealth Black', hex: 0x18181b },
    ],
    maxSpeed: 230,
    acceleration: 95,
    handling: 90,
    nitroEfficiency: 88,
  },
  {
    id: 'cyber',
    name: 'Cyber Phantom',
    tagline: 'Stealth-faceted electric hypercar with neon underglow',
    defaultColor: 0x090e17,
    availableColors: [
      { name: 'Obsidian', hex: 0x090e17 },
      { name: 'Cyber Cyan', hex: 0x06b6d4 },
      { name: 'Neon Purple', hex: 0x9333ea },
      { name: 'Silver Storm', hex: 0x94a3b8 },
    ],
    maxSpeed: 245,
    acceleration: 98,
    handling: 85,
    nitroEfficiency: 95,
  },
  {
    id: 'muscle',
    name: 'Thunder V8',
    tagline: 'Raw American supercharged V8 muscle power',
    defaultColor: 0xca8a04,
    availableColors: [
      { name: 'Bumblebee Gold', hex: 0xca8a04 },
      { name: 'Cherry Red', hex: 0xb91c1c },
      { name: 'Deep Navy', hex: 0x1e3a8a },
      { name: 'Matte Grey', hex: 0x475569 },
    ],
    maxSpeed: 220,
    acceleration: 90,
    handling: 78,
    nitroEfficiency: 82,
  },
  {
    id: 'interceptor',
    name: 'Interceptor Pursuit',
    tagline: 'Armored highway patrol cruiser with ramming bullbar',
    defaultColor: 0x0a0c10,
    availableColors: [
      { name: 'Patrol Black', hex: 0x0a0c10 },
      { name: 'Steel Blue', hex: 0x334155 },
      { name: 'Ghost White', hex: 0xf8fafc },
    ],
    maxSpeed: 215,
    acceleration: 85,
    handling: 82,
    nitroEfficiency: 85,
  },
];

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  selectedModel,
  onSelectModel,
  selectedColor,
  onSelectColor,
  highScore,
}) => {
  const currentCar = CAR_OPTIONS.find((c) => c.id === selectedModel) || CAR_OPTIONS[0];

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/70 flex flex-col justify-between p-4 sm:p-6 md:p-8 pointer-events-auto">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between w-full">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-black tracking-widest uppercase">
              Three.js Arcade 3D
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic tracking-tighter text-white drop-shadow-lg mt-1">
            APEX <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300">RACER</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Avoid traffic, unleash nitro boost, and race as far as you can!
          </p>
        </div>

        {highScore > 0 && (
          <div className="bg-slate-900/90 border border-amber-500/50 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-xl">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider block font-bold">
                High Score
              </span>
              <span className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
                {highScore.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CENTER EMPTY: 3D CAR SHOWCASE IN BACKGROUND */}
      <div className="my-auto pointer-events-none" />

      {/* BOTTOM PANEL: VEHICLE SELECTOR & START RACE */}
      <div className="w-full max-w-4xl mx-auto bg-slate-900/90 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Car Models Tabs */}
        <div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-2">
            Select Machine
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CAR_OPTIONS.map((car) => {
              const active = car.id === selectedModel;
              return (
                <button
                  key={car.id}
                  onClick={() => onSelectModel(car.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    active
                      ? 'bg-slate-800 border-cyan-400 shadow-md shadow-cyan-950 ring-1 ring-cyan-400'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`font-black text-sm ${active ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {car.name}
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {car.tagline}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette & Vehicle Spec Bars */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
          {/* Colors */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Paint Finish
            </span>
            <div className="flex items-center gap-2">
              {currentCar.availableColors.map((col) => (
                <button
                  key={col.hex}
                  onClick={() => onSelectColor(col.hex)}
                  title={col.name}
                  className={`w-7 h-7 rounded-full border-2 transition active:scale-90 ${
                    selectedColor === col.hex
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: `#${col.hex.toString(16).padStart(6, '0')}` }}
                />
              ))}
            </div>
          </div>

          {/* Quick Specs */}
          <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Top Speed</span>
              <span className="font-bold text-white text-sm">{currentCar.maxSpeed} km/h</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Accel</span>
              <span className="font-bold text-cyan-400 text-sm">{currentCar.acceleration}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Aero Grip</span>
              <span className="font-bold text-emerald-400 text-sm">{currentCar.handling}%</span>
            </div>
          </div>

          {/* Start Race Big Button */}
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-500 hover:via-orange-400 hover:to-amber-400 text-white font-black text-lg uppercase tracking-wider shadow-xl shadow-orange-950 border border-amber-300 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Flame className="w-5 h-5" /> START RACE
          </button>
        </div>
      </div>
    </div>
  );
};
