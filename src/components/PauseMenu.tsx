'use client';

import { useState } from 'react';
import { Music } from '@/game/Music';
import { Sound } from '@/game/Sound';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onRestart, onQuit }: PauseMenuProps) {
  const [musicVolume, setMusicVolume] = useState(Music.getVolume());
  const [soundVolume, setSoundVolume] = useState(Sound.getVolume());
  const [musicEnabled, setMusicEnabled] = useState(Music.isEnabled());
  const [soundEnabled, setSoundEnabled] = useState(Sound.isEnabled());

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setMusicVolume(vol);
    Music.setVolume(vol);
  };

  const handleSoundVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setSoundVolume(vol);
    Sound.setVolume(vol);
  };

  const toggleMusic = () => {
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    Music.setEnabled(newState);
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    Sound.setEnabled(newState);
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-purple-600 p-8 rounded-lg text-center">
        <h2 className="text-3xl font-bold text-purple-400 mb-8">PAUSED</h2>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={onResume}
            className="px-8 py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded transition-colors"
          >
            Resume
          </button>
          
          <button
            onClick={onRestart}
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded transition-colors"
          >
            Restart
          </button>
          
          <button
            onClick={onQuit}
            className="px-8 py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded transition-colors"
          >
            Quit to Title
          </button>
        </div>
        
        {/* Audio Settings */}
        <div className="mt-6 pt-4 border-t border-purple-800">
          <h3 className="text-sm font-medium text-purple-400 mb-3">Audio</h3>
          
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-400">Music</label>
              <button
                onClick={toggleMusic}
                className={`px-2 py-0.5 rounded text-xs ${
                  musicEnabled ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
              >
                {musicEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={handleMusicVolumeChange}
              disabled={!musicEnabled}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-400">Sound</label>
              <button
                onClick={toggleSound}
                className={`px-2 py-0.5 rounded text-xs ${
                  soundEnabled ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
              >
                {soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={soundVolume}
              onChange={handleSoundVolumeChange}
              disabled={!soundEnabled}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50"
            />
          </div>
        </div>

        <p className="text-gray-500 mt-6 text-sm">Press Space or Escape to resume</p>
      </div>
    </div>
  );
}
