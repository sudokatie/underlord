'use client';

import { RoomType } from '../game/types';
import { ROOM_COSTS, ROOM_NAMES, IMP_COST } from '../game/constants';

interface SidePanelProps {
  selectedRoom: RoomType;
  gold: number;
  onSelectRoom: (type: RoomType) => void;
  onSummonImp: () => void;
}

const ROOM_TYPES: RoomType[] = [
  RoomType.LAIR,
  RoomType.HATCHERY,
  RoomType.LIBRARY,
  RoomType.TRAINING,
  RoomType.TREASURY,
  RoomType.WORKSHOP,
  RoomType.PRISON,
  RoomType.TORTURE,
];

export default function SidePanel({
  selectedRoom,
  gold,
  onSelectRoom,
  onSummonImp,
}: SidePanelProps) {
  return (
    <div className="w-48 bg-gray-800 text-white p-2 border-l border-gray-700 flex flex-col gap-2">
      <h3 className="text-lg font-bold text-center border-b border-gray-600 pb-2">
        Rooms
      </h3>
      
      {ROOM_TYPES.map((type, index) => {
        const cost = ROOM_COSTS[type];
        const canAfford = gold >= cost;
        const isSelected = selectedRoom === type;
        
        return (
          <button
            key={type}
            onClick={() => onSelectRoom(isSelected ? RoomType.NONE : type)}
            disabled={!canAfford}
            className={`
              px-2 py-1 text-left text-sm rounded transition-colors
              ${isSelected ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}
              ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex justify-between">
              <span>{index + 1}. {ROOM_NAMES[type]}</span>
              <span className="text-yellow-500">{cost}</span>
            </div>
          </button>
        );
      })}
      
      <div className="border-t border-gray-600 pt-2 mt-2">
        <button
          onClick={onSummonImp}
          disabled={gold < IMP_COST}
          className={`
            w-full px-2 py-2 text-sm rounded bg-orange-600 hover:bg-orange-700
            ${gold < IMP_COST ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex justify-between">
            <span>I. Summon Imp</span>
            <span className="text-yellow-300">{IMP_COST}</span>
          </div>
        </button>
      </div>
      
      <div className="mt-auto text-xs text-gray-500 border-t border-gray-600 pt-2">
        <p>Click dirt to dig</p>
        <p>Space to pause</p>
      </div>
    </div>
  );
}
