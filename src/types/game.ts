export type CarModelId = 'supercar' | 'muscle' | 'cyber' | 'interceptor';

export interface CarConfig {
  id: CarModelId;
  name: string;
  tagline: string;
  defaultColor: number;
  availableColors: { name: string; hex: number }[];
  maxSpeed: number; // km/h
  acceleration: number;
  handling: number;
  nitroEfficiency: number;
}

export type ThemeId = 'sunset' | 'cyber' | 'desert' | 'storm';

export interface EnvironmentTheme {
  id: ThemeId;
  name: string;
  description: string;
  skyColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  sunColor: number;
  sunIntensity: number;
  sunPosition: [number, number, number];
  hemiSkyColor: number;
  hemiGroundColor: number;
  hemiIntensity: number;
  roadColor: number;
  groundColor: number;
  hasRain?: boolean;
  neonGlow?: boolean;
}

export type CameraMode = 'chase' | 'hood' | 'cinematic';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export type PickupType = 'nitro' | 'coin' | 'shield' | 'magnet';

export interface GameTelemetry {
  speed: number; // km/h
  rpm: number;
  gear: number;
  nitro: number; // 0 - 100
  score: number;
  highScore: number;
  distance: number; // meters
  coins: number;
  nearMisses: number;
  topSpeed: number;
  multiplier: number;
  shieldRemaining: number; // seconds
  magnetRemaining: number; // seconds
  health: number; // 0 - 100
}

export interface NearMissEvent {
  id: string;
  points: number;
  multiplier: number;
  message: string;
  x: number;
  y: number;
}
