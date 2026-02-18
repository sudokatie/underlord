'use client';

import { memo, useEffect, useState } from 'react';

interface VirtualControlsProps {
  paused: boolean;
  onPause: () => void;
  onSummonImp: () => void;
  onRoomSelect: (index: number) => void;
  selectedRoom: number | null;
}

const ROOM_LABELS = ['Lair', 'Hatch', 'Lib', 'Train', 'Vault', 'Work', 'Jail', 'Tort'];

function VirtualControls({
  paused,
  onPause,
  onSummonImp,
  onRoomSelect,
  selectedRoom,
}: VirtualControlsProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showRooms, setShowRooms] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
      {/* Room selector (expandable) */}
      {showRooms && (
        <div className="flex gap-1 flex-wrap justify-center max-w-xs bg-gray-900/80 p-2 rounded-lg">
          {ROOM_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => {
                onRoomSelect(i);
                setShowRooms(false);
              }}
              className={`px-2 py-1 rounded text-xs font-medium touch-manipulation
                ${selectedRoom === i 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-700 text-gray-200 active:bg-gray-500'}`}
            >
              {i + 1}:{label}
            </button>
          ))}
        </div>
      )}

      {/* Main controls */}
      <div className="flex gap-2">
        {/* Room toggle */}
        <button
          onClick={() => setShowRooms(!showRooms)}
          className={`w-14 h-12 rounded-full text-white text-xs font-medium touch-manipulation
            ${showRooms ? 'bg-yellow-700/80' : 'bg-gray-800/80 active:bg-gray-600'}`}
          aria-label="Toggle room menu"
        >
          Rooms
        </button>

        {/* Pause button */}
        <button
          onClick={onPause}
          className="w-14 h-12 rounded-full bg-blue-700/80 text-white text-sm font-medium
                     active:bg-blue-500 touch-manipulation"
          aria-label={paused ? 'Resume' : 'Pause'}
        >
          {paused ? '▶' : '⏸'}
        </button>

        {/* Summon Imp */}
        <button
          onClick={onSummonImp}
          className="w-14 h-12 rounded-full bg-purple-700/80 text-white text-xs font-medium
                     active:bg-purple-500 touch-manipulation"
          aria-label="Summon Imp"
        >
          Imp
        </button>
      </div>
    </div>
  );
}

export default memo(VirtualControls);
