'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, GameScreen, RoomType } from '../game/types';
import {
  createGame,
  startGame,
  updateGame,
  designateDig,
  tryPlaceRoom,
  summonImp,
  togglePause,
  calculateScore,
} from '../game/Game';
import { renderGame } from './Renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, ROOM_COSTS } from '../game/constants';
import { canPlaceRoom } from '../game/Room';
import { Sound } from '../game/Sound';
import { Music } from '../game/Music';
import TitleScreen from './TitleScreen';
import TopBar from './TopBar';
import SidePanel from './SidePanel';
import MessageLog from './MessageLog';
import GameOver from './GameOver';
import PauseMenu from './PauseMenu';
import VirtualControls from './VirtualControls';

const WAVE_INTERVAL = 120; // seconds

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(() => createGame());
  const lastTimeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const dt = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    setGameState((prevState) => {
      const newState = { ...prevState };
      updateGame(newState, dt);
      return newState;
    });

    // Render
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      renderGame(ctx, gameState);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  // Start/stop game loop
  useEffect(() => {
    if (gameState.screen === GameScreen.PLAYING) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.screen, gameLoop]);

  // Switch music track based on game screen
  useEffect(() => {
    switch (gameState.screen) {
      case GameScreen.TITLE:
      case GameScreen.PAUSED:
        Music.play('menu');
        break;
      case GameScreen.PLAYING:
        Music.play('gameplay');
        break;
      case GameScreen.GAME_OVER:
        Music.play('gameover');
        break;
    }
  }, [gameState.screen]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.screen !== GameScreen.PLAYING) return;

      // Room selection (1-8)
      if (e.key >= '1' && e.key <= '8') {
        const roomTypes = [
          RoomType.LAIR,
          RoomType.HATCHERY,
          RoomType.LIBRARY,
          RoomType.TRAINING,
          RoomType.TREASURY,
          RoomType.WORKSHOP,
          RoomType.PRISON,
          RoomType.TORTURE,
        ];
        const index = parseInt(e.key) - 1;
        setGameState((prev) => ({
          ...prev,
          selectedRoom: prev.selectedRoom === roomTypes[index] ? RoomType.NONE : roomTypes[index],
        }));
      }

      // Pause
      if (e.key === ' ') {
        e.preventDefault();
        setGameState((prev) => {
          const newState = { ...prev };
          togglePause(newState);
          return newState;
        });
      }

      // Summon imp
      if (e.key.toLowerCase() === 'i') {
        Sound.play('spawn');
        setGameState((prev) => {
          const newState = { ...prev };
          summonImp(newState);
          return newState;
        });
      }

      // Escape: toggle pause menu (or deselect if room selected)
      if (e.key === 'Escape') {
        setGameState((prev) => {
          if (prev.selectedRoom !== RoomType.NONE) {
            // Deselect room first
            return { ...prev, selectedRoom: RoomType.NONE };
          }
          // Toggle pause menu
          const newState = { ...prev };
          togglePause(newState);
          return newState;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.screen]);

  // Mouse handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState.screen !== GameScreen.PLAYING || gameState.paused) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

    setGameState((prev) => {
      const newState = { ...prev };

      if (prev.selectedRoom !== RoomType.NONE) {
        // Try to place room
        const prevRoomCount = prev.rooms.length;
        tryPlaceRoom(newState, { x, y }, prev.selectedRoom);
        if (newState.rooms.length > prevRoomCount) {
          Sound.play('build');
        }
      } else {
        // Try to designate dig
        Sound.play('dig');
        designateDig(newState, { x, y });
      }

      return newState;
    });
  };

  // Right-click to cancel/deselect
  const handleCanvasRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setGameState((prev) => ({
      ...prev,
      selectedRoom: RoomType.NONE,
      hoverPos: null,
      placementValid: false,
    }));
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState.screen !== GameScreen.PLAYING) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

    setGameState((prev) => {
      if (prev.selectedRoom === RoomType.NONE) {
        return { ...prev, hoverPos: null, placementValid: false };
      }

      const valid = canPlaceRoom(prev.grid, prev.rooms, { x, y }, prev.selectedRoom) &&
                    prev.gold >= ROOM_COSTS[prev.selectedRoom];

      return {
        ...prev,
        hoverPos: { x, y },
        placementValid: valid,
      };
    });
  };

  const handleStart = () => {
    setGameState((prev) => {
      const newState = { ...prev };
      startGame(newState);
      return newState;
    });
  };

  const handleRestart = () => {
    setGameState(createGame());
    setTimeout(() => {
      setGameState((prev) => {
        const newState = { ...prev };
        startGame(newState);
        return newState;
      });
    }, 0);
  };

  const handleSelectRoom = (type: RoomType) => {
    setGameState((prev) => ({
      ...prev,
      selectedRoom: type,
    }));
  };

  const handleSummonImp = () => {
    setGameState((prev) => {
      const newState = { ...prev };
      summonImp(newState);
      return newState;
    });
  };

  const handleResume = () => {
    setGameState((prev) => {
      const newState = { ...prev };
      togglePause(newState);
      return newState;
    });
  };

  const handleQuitToTitle = () => {
    setGameState(createGame());
  };

  // Render based on game state
  if (gameState.screen === GameScreen.TITLE) {
    return (
      <div style={{ width: CANVAS_WIDTH + 192, height: CANVAS_HEIGHT + 48 }}>
        <TitleScreen onStart={handleStart} />
      </div>
    );
  }

  if (gameState.screen === GameScreen.GAME_OVER) {
    return (
      <div style={{ width: CANVAS_WIDTH + 192, height: CANVAS_HEIGHT + 48 }}>
        <GameOver
          score={calculateScore(gameState)}
          wave={gameState.wave}
          gold={gameState.gold}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-900 relative">
      <TopBar
        gold={gameState.gold}
        maxGold={gameState.maxGold}
        creatureCount={gameState.creatures.length}
        wave={gameState.wave}
        waveTimer={gameState.waveTimer}
        waveInterval={WAVE_INTERVAL}
        paused={gameState.paused}
      />
      
      <div className="flex relative">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasRightClick}
            onMouseMove={handleCanvasMouseMove}
            className="bg-black cursor-crosshair"
          />
          <MessageLog messages={gameState.messages} />
        </div>
        
        <SidePanel
          selectedRoom={gameState.selectedRoom}
          gold={gameState.gold}
          onSelectRoom={handleSelectRoom}
          onSummonImp={handleSummonImp}
        />
      </div>
      
      {gameState.paused && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onQuit={handleQuitToTitle}
        />
      )}
      
      <VirtualControls
        paused={gameState.paused}
        onPause={handleResume}
        onSummonImp={() => {
          Sound.play('spawn');
          handleSummonImp();
        }}
        onRoomSelect={(index) => {
          const roomTypes = [
            RoomType.LAIR,
            RoomType.HATCHERY,
            RoomType.LIBRARY,
            RoomType.TRAINING,
            RoomType.TREASURY,
            RoomType.WORKSHOP,
            RoomType.PRISON,
            RoomType.TORTURE,
          ];
          handleSelectRoom(roomTypes[index]);
        }}
        selectedRoom={gameState.selectedRoom === RoomType.NONE ? null : [
          RoomType.LAIR,
          RoomType.HATCHERY,
          RoomType.LIBRARY,
          RoomType.TRAINING,
          RoomType.TREASURY,
          RoomType.WORKSHOP,
          RoomType.PRISON,
          RoomType.TORTURE,
        ].indexOf(gameState.selectedRoom)}
      />
    </div>
  );
}
