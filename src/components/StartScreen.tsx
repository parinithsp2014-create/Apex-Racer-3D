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

const CAR_OPTIONS: (CarConfig & { category: string; badgeColor: string })[] = [
  {
    id: 'lamborghini',
    name: 'Lamborghini V12',
    category: 'Italian V12',
    badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    tagline: 'Razor-sharp Italian wedge with signature Y-DRLs & V12 scream',
    defaultColor: 0xfacc15,
    availableColors: [
      { name: 'Giallo Orion', hex: 0xfacc15 },
      { name: 'Verde Mantis', hex: 0x22c55e },
      { name: 'Arancio Argos', hex: 0xf97316 },
      { name: 'Bianco Monocerus', hex: 0xf8fafc },
      { name: 'Nero Nemesis', hex: 0x18181b },
    ],
    maxSpeed: 245,
    acceleration: 97,
    handling: 92,
    nitroEfficiency: 94,
  },
  {
    id: 'bugatti',
    name: 'Bugatti W16',
    category: 'W16 Hypercar',
    badgeColor: 'text-sky-400 border-sky-500/40 bg-sky-500/10',
    tagline: 'French quad-turbo icon with sweeping C-line & 295 km/h peak',
    defaultColor: 0x0284c7,
    availableColors: [
      { name: 'French Racing Blue', hex: 0x0284c7 },
      { name: 'Atlantic Navy', hex: 0x0f172a },
      { name: 'Noir Pur', hex: 0x111315 },
      { name: 'Cabernet Red', hex: 0x881337 },
      { name: 'Pure White', hex: 0xf8fafc },
    ],
    maxSpeed: 265,
    acceleration: 99,
    handling: 88,
    nitroEfficiency: 98,
  },
  {
    id: 'ferrari',
    name: 'Ferrari F8',
    category: 'Scuderia',
    badgeColor: 'text-red-400 border-red-500/40 bg-red-500/10',
    tagline: 'Maranello thoroughbred with S-Duct aero & twin exhaust pipes',
    defaultColor: 0xdc2626,
    availableColors: [
      { name: 'Rosso Corsa', hex: 0xdc2626 },
      { name: 'Giallo Modena', hex: 0xfacc15 },
      { name: 'Blu Tour de France', hex: 0x1d4ed8 },
      { name: 'Bianco Avus', hex: 0xf8fafc },
      { name: 'Grigio Silverstone', hex: 0x475569 },
    ],
    maxSpeed: 250,
    acceleration: 96,
    handling: 95,
    nitroEfficiency: 92,
  },
  {
    id: 'thar',
    name: 'Mahindra Thar',
    category: '4x4 Off-Road',
    badgeColor: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    tagline: 'Iconic lifted 4x4 with 7-slot grille & tailgate spare wheel',
    defaultColor: 0xd4b483,
    availableColors: [
      { name: 'Rocky Beige', hex: 0xd4b483 },
      { name: 'Napoli Black', hex: 0x17191d },
      { name: 'Red Rage', hex: 0xb91c1c },
      { name: 'Aquamarine', hex: 0x0284c7 },
      { name: 'Everest White', hex: 0xf1f5f9 },
    ],
    maxSpeed: 200,
    acceleration: 84,
    handling: 86,
    nitroEfficiency: 85,
  },
  {
    id: 'supercar',
    name: 'Apex GT',
    category: 'Track GT',
    badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    tagline: 'High-downforce aerodynamic track monster with wide diffuser',
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
    category: 'Electric Cyber',
    badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
    tagline: 'Faceted electric hypercar with neon underglow & lightbars',
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
    category: 'Supercharged V8',
    badgeColor: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
    tagline: 'Raw American supercharged V8 muscle with shaker hood scoop',
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
    category: 'Police Special',
    badgeColor: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
    tagline: 'Armored highway pursuit cruiser with heavy ramming bullbar',
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

  const handleSelectCar = (car: typeof CAR_OPTIONS[number]) => {
    onSelectModel(car.id);
    const hasCurrentColor = car.availableColors.some((c) => c.hex === selectedColor);
    if (!hasCurrentColor) {
      onSelectColor(car.defaultColor);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/70 flex flex-col justify-between p-3 sm:p-5 md:p-6 pointer-events-auto">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between w-full">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-black tracking-widest uppercase">
              Three.js Arcade 3D
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
              8 Iconic Machines
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black italic tracking-tighter text-white drop-shadow-lg mt-1">
            APEX <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300">RACER</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Avoid traffic, unleash nitro boost, and race as far as you can!
          </p>
        </div>

        {highScore > 0 && (
          <div className="bg-slate-900/90 border border-amber-500/50 rounded-2xl p-2.5 sm:p-3.5 flex items-center gap-3 shadow-xl">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                High Score
              </span>
              <span className="text-base sm:text-xl font-black text-amber-400 font-mono">
                {highScore.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CENTER EMPTY: 3D CAR SHOWCASE IN BACKGROUND */}
      <div className="my-auto pointer-events-none" />

      {/* BOTTOM PANEL: VEHICLE SELECTOR & START RACE */}
      <div className="w-full max-w-5xl mx-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-md">
        {/* Car Models Tabs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Select Machine ({CAR_OPTIONS.length} Cars Available)
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
              Click any car to rotate & inspect in 3D
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 sm:max-h-none overflow-y-auto sm:overflow-visible pr-1 sm:pr-0">
            {CAR_OPTIONS.map((car) => {
              const active = car.id === selectedModel;
              return (
                <button
                  key={car.id}
                  onClick={() => handleSelectCar(car)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer relative overflow-hidden group ${
                    active
                      ? 'bg-gradient-to-br from-slate-800 to-slate-850 border-cyan-400 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${car.badgeColor}`}>
                      {car.category}
                    </span>
                    {active && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <div className="mt-1.5">
                    <span className={`font-black text-sm block leading-tight ${active ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {car.name}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-medium">
                      {car.tagline}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette & Vehicle Spec Bars */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-800">
          {/* Colors */}
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Paint Finish
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentCar.availableColors.map((col) => {
                  const isSelected = selectedColor === col.hex;
                  return (
                    <button
                      key={col.hex}
                      onClick={() => onSelectColor(col.hex)}
                      title={col.name}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 transition active:scale-90 cursor-pointer ${
                        isSelected
                          ? 'border-white scale-110 shadow-lg shadow-white/20 ring-2 ring-cyan-400'
                          : 'border-slate-700 opacity-75 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: `#${col.hex.toString(16).padStart(6, '0')}` }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="hidden md:block pl-2 border-l border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Color Name</span>
              <span className="text-xs font-bold text-slate-200 font-mono">
                {currentCar.availableColors.find(c => c.hex === selectedColor)?.name || 'Custom'}
              </span>
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
              <span className="text-[10px] text-slate-400 uppercase block">Grip</span>
              <span className="font-bold text-emerald-400 text-sm">{currentCar.handling}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Nitro</span>
              <span className="font-bold text-amber-400 text-sm">{currentCar.nitroEfficiency}%</span>
            </div>
          </div>

          {/* Start Race Big Button */}
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-500 hover:via-orange-400 hover:to-amber-400 text-white font-black text-base sm:text-lg uppercase tracking-wider shadow-xl shadow-orange-950 border border-amber-300 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Flame className="w-5 h-5" /> START RACE
          </button>
        </div>
      </div>
    </div>
  );
};
