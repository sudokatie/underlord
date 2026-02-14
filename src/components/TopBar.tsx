'use client';

interface TopBarProps {
  gold: number;
  maxGold: number;
  creatureCount: number;
  wave: number;
  waveTimer: number;
  waveInterval: number;
  paused: boolean;
}

export default function TopBar({
  gold,
  maxGold,
  creatureCount,
  wave,
  waveTimer,
  waveInterval,
  paused,
}: TopBarProps) {
  const timeTilWave = Math.max(0, waveInterval - waveTimer);
  const minutes = Math.floor(timeTilWave / 60);
  const seconds = Math.floor(timeTilWave % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white border-b border-gray-700">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">Gold:</span>
          <span className="font-bold">{gold}</span>
          <span className="text-gray-500">/ {maxGold}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-green-500">Creatures:</span>
          <span className="font-bold">{creatureCount}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-red-500">Wave {wave}</span>
          <span className="text-gray-400">Next: {timeStr}</span>
        </div>
        
        {paused && (
          <span className="px-2 py-1 bg-yellow-600 text-black font-bold rounded">
            PAUSED
          </span>
        )}
      </div>
    </div>
  );
}
