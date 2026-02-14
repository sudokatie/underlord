'use client';

interface GameOverProps {
  score: number;
  wave: number;
  gold: number;
  onRestart: () => void;
}

export default function GameOver({ score, wave, gold, onRestart }: GameOverProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900/95 text-white">
      <h1 className="text-5xl font-bold text-red-600 mb-4">GAME OVER</h1>
      <p className="text-xl text-gray-400 mb-8">Your dungeon heart has been destroyed!</p>
      
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Final Score</h2>
        <div className="space-y-2 text-lg">
          <div className="flex justify-between gap-8">
            <span className="text-gray-400">Waves Survived:</span>
            <span className="font-bold">{wave}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-gray-400">Gold Remaining:</span>
            <span className="font-bold text-yellow-500">{gold}</span>
          </div>
          <div className="flex justify-between gap-8 border-t border-gray-600 pt-2 mt-2">
            <span className="text-gray-400">Total Score:</span>
            <span className="font-bold text-2xl text-green-500">{score}</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={onRestart}
        className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-xl font-bold rounded-lg transition-colors"
      >
        Play Again
      </button>
    </div>
  );
}
