/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RacingEngine } from './game/racingEngine';
import { HUD } from './components/HUD';
import { ControlsDock } from './components/ControlsDock';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { CarModelId, CameraMode, GameStatus, GameTelemetry, NearMissEvent, ThemeId } from './types/game';
import { sound } from './audio/soundEngine';

const initialTelemetry: GameTelemetry = {
  speed: 0,
  rpm: 0,
  gear: 1,
  nitro: 100,
  score: 0,
  highScore: 0,
  distance: 0,
  coins: 0,
  nearMisses: 0,
  topSpeed: 0,
  multiplier: 1,
  shieldRemaining: 0,
  magnetRemaining: 0,
  health: 100,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RacingEngine | null>(null);

  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [telemetry, setTelemetry] = useState<GameTelemetry>(initialTelemetry);
  const [nearMisses, setNearMisses] = useState<NearMissEvent[]>([]);

  const [selectedModel, setSelectedModel] = useState<CarModelId>('supercar');
  const [selectedColor, setSelectedColor] = useState<number>(0xee1122);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('sunset');
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicOn, setIsMusicOn] = useState<boolean>(true);

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new RacingEngine(mountRef.current);
    engineRef.current = engine;

    engine.onTelemetryUpdate = (data) => {
      setTelemetry({ ...data });
    };

    engine.onNearMiss = (event) => {
      setNearMisses((prev) => [...prev.slice(-3), event]);
      setTimeout(() => {
        setNearMisses((prev) => prev.filter((e) => e.id !== event.id));
      }, 1500);
    };

    engine.onGameOver = (finalStats) => {
      setTelemetry({ ...finalStats });
      setGameStatus('gameover');
    };

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      sound.ensureContext();
      const key = e.key.toLowerCase();
      const code = e.code;
      const engine = engineRef.current;
      if (!engine) return;

      if (code === 'Space') {
        if (gameStatus === 'idle') {
          handleStartGame();
          return;
        } else if (gameStatus === 'playing') {
          engine.inputs.nitro = true;
        }
      }

      if (code === 'Escape' || key === 'p') {
        if (gameStatus === 'playing') {
          handlePause();
        } else if (gameStatus === 'paused') {
          handleResume();
        }
      }

      if (key === 'w' || code === 'ArrowUp') engine.inputs.up = true;
      if (key === 's' || code === 'ArrowDown') engine.inputs.down = true;
      if (key === 'a' || code === 'ArrowLeft') engine.inputs.left = true;
      if (key === 'd' || code === 'ArrowRight') engine.inputs.right = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') engine.inputs.nitro = true;
      if (key === 'h') sound.playHorn();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const code = e.code;
      const engine = engineRef.current;
      if (!engine) return;

      if (key === 'w' || code === 'ArrowUp') engine.inputs.up = false;
      if (key === 's' || code === 'ArrowDown') engine.inputs.down = false;
      if (key === 'a' || code === 'ArrowLeft') engine.inputs.left = false;
      if (key === 'd' || code === 'ArrowRight') engine.inputs.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'Space') engine.inputs.nitro = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStatus]);

  // Handlers
  const handleStartGame = useCallback(() => {
    sound.ensureContext();
    if (engineRef.current) {
      engineRef.current.startGame();
    }
    setGameStatus('playing');
  }, []);

  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
    setGameStatus('paused');
  }, []);

  const handleResume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
    setGameStatus('playing');
  }, []);

  const handleRestart = useCallback(() => {
    sound.ensureContext();
    if (engineRef.current) {
      engineRef.current.restartGame();
    }
    setGameStatus('playing');
  }, []);

  const handleBackToMenu = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.isRunning = false;
    }
    setGameStatus('idle');
  }, []);

  const handleSelectModel = useCallback((model: CarModelId) => {
    setSelectedModel(model);
    if (engineRef.current) {
      engineRef.current.selectCar(model);
    }
  }, []);

  const handleSelectColor = useCallback((hex: number) => {
    setSelectedColor(hex);
    if (engineRef.current) {
      engineRef.current.setCarColor(hex);
    }
  }, []);

  const handleSelectTheme = useCallback((theme: ThemeId) => {
    setCurrentTheme(theme);
    if (engineRef.current) {
      engineRef.current.applyTheme(theme);
    }
  }, []);

  const handleSelectCamera = useCallback((mode: CameraMode) => {
    setCameraMode(mode);
    if (engineRef.current) {
      engineRef.current.setCameraMode(mode);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.setMuted(nextMute);
  }, [isMuted]);

  const handleToggleMusic = useCallback(() => {
    const nextMusic = !isMusicOn;
    setIsMusicOn(nextMusic);
    sound.toggleMusic(nextMusic);
  }, [isMusicOn]);

  // Touch Input Handlers for Mobile
  const handleSteerLeft = (active: boolean) => {
    if (engineRef.current) engineRef.current.inputs.left = active;
  };
  const handleSteerRight = (active: boolean) => {
    if (engineRef.current) engineRef.current.inputs.right = active;
  };
  const handleAccelerate = (active: boolean) => {
    if (engineRef.current) engineRef.current.inputs.up = active;
  };
  const handleBrake = (active: boolean) => {
    if (engineRef.current) engineRef.current.inputs.down = active;
  };
  const handleNitro = (active: boolean) => {
    if (engineRef.current) engineRef.current.inputs.nitro = active;
  };
  const handleHorn = () => {
    sound.playHorn();
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WEBGL CANVAS MOUNT (Always mounted once, never torn down) */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* START SCREEN / GARAGE SHOWCASE */}
      {gameStatus === 'idle' && (
        <StartScreen
          onStart={handleStartGame}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          selectedColor={selectedColor}
          onSelectColor={handleSelectColor}
          highScore={telemetry.highScore}
        />
      )}

      {/* ACTIVE RACING HUD OVERLAY */}
      {gameStatus === 'playing' && (
        <HUD
          telemetry={telemetry}
          nearMisses={nearMisses}
          onPause={handlePause}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onSteerLeft={handleSteerLeft}
          onSteerRight={handleSteerRight}
          onAccelerate={handleAccelerate}
          onBrake={handleBrake}
          onNitro={handleNitro}
          onHorn={handleHorn}
        />
      )}

      {/* COLLAPSIBLE BOTTOM DOCK (Pinned to bottom center, zero viewport occlusion) */}
      <ControlsDock
        cameraMode={cameraMode}
        onSelectCamera={handleSelectCamera}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        isMusicOn={isMusicOn}
        onToggleMusic={handleToggleMusic}
      />

      {/* PAUSE MODAL */}
      {gameStatus === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* GAME OVER MODAL */}
      {gameStatus === 'gameover' && (
        <GameOverModal
          stats={telemetry}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}
