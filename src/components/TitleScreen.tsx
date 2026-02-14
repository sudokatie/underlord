'use client';

interface TitleScreenProps {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white">
      <h1 className="text-6xl font-bold text-red-500 mb-4">UNDERLORD</h1>
      <p className="text-xl text-gray-400 mb-8">Build your dungeon. Attract monsters. Repel heroes.</p>
      
      <button
        onClick={onStart}
        className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-2xl font-bold rounded-lg transition-colors"
      >
        Start Game
      </button>
      
      <div className="mt-12 text-gray-500 text-sm">
        <p>Controls:</p>
        <p>Click to dig | 1-8 Select room | Space Pause | I Summon imp</p>
      </div>
    </div>
  );
}
