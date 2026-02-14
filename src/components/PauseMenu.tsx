interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onRestart, onQuit }: PauseMenuProps) {
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
        
        <p className="text-gray-500 mt-6 text-sm">Press Space or Escape to resume</p>
      </div>
    </div>
  );
}
