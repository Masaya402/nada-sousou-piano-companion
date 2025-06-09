import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface PracticeControlsProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  activeHand: 'left' | 'right' | 'both';
  onHandChange: (hand: 'left' | 'right' | 'both') => void;
  showFingerNumbers: boolean;
  onToggleFingerNumbers: () => void;
  isLoopActive: boolean;
  loopStart: number;
  loopEnd: number;
  onLoopToggle: () => void;
  onLoopRangeChange: (start: number, end: number) => void;
  currentTime: number;
  duration: number;
  onTranspose: (semitones: number) => void;
  transposeSemitones: number;
}

const PracticeControls: React.FC<PracticeControlsProps> = ({
  tempo,
  onTempoChange,
  playbackRate,
  onPlaybackRateChange,
  activeHand,
  onHandChange,
  showFingerNumbers,
  onToggleFingerNumbers,
  isLoopActive,
  loopStart,
  loopEnd,
  onLoopToggle,
  onLoopRangeChange,
  currentTime,
  duration,
  onTranspose,
  transposeSemitones
}) => {
  const [isTempoModalOpen, setIsTempoModalOpen] = useState(false);
  const [isTransposeModalOpen, setIsTransposeModalOpen] = useState(false);
  
  // Format time (seconds) to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Calculate percentage positions for loop markers
  const startPercent = (loopStart / duration) * 100;
  const endPercent = (loopEnd / duration) * 100;
  const currentPercent = (currentTime / duration) * 100;
  
  return (
    <div className="practice-controls bg-gray-800 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tempo & Playback Rate */}
        <div className="bg-gray-700 p-3 rounded-lg">
          <h3 className="text-white text-sm font-medium mb-2">Tempo & Speed</h3>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
              onClick={() => setIsTempoModalOpen(true)}
            >
              {tempo} BPM
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">速さ:</span>
              <select
                className="bg-gray-600 text-white rounded px-2 py-1 text-sm"
                value={playbackRate}
                onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
              >
                <option value="0.5">0.5×</option>
                <option value="0.75">0.75×</option>
                <option value="1">1.0×</option>
                <option value="1.25">1.25×</option>
                <option value="1.5">1.5×</option>
                <option value="2">2.0×</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Hand Selection */}
        <div className="bg-gray-700 p-3 rounded-lg">
          <h3 className="text-white text-sm font-medium mb-2">手 (Hands)</h3>
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 rounded-md text-sm flex-1 ${
                activeHand === 'left' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
              onClick={() => onHandChange('left')}
            >
              左手 (Left)
            </button>
            <button
              className={`px-3 py-1 rounded-md text-sm flex-1 ${
                activeHand === 'right' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
              onClick={() => onHandChange('right')}
            >
              右手 (Right)
            </button>
            <button
              className={`px-3 py-1 rounded-md text-sm flex-1 ${
                activeHand === 'both' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
              onClick={() => onHandChange('both')}
            >
              両手 (Both)
            </button>
          </div>
        </div>
        
        {/* Finger Numbers */}
        <div className="bg-gray-700 p-3 rounded-lg">
          <h3 className="text-white text-sm font-medium mb-2">運指 (Fingering)</h3>
          <button
            className={`w-full px-3 py-1 rounded-md text-sm ${
              showFingerNumbers ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}
            onClick={onToggleFingerNumbers}
          >
            {showFingerNumbers ? '運指番号を非表示 (Hide)' : '運指番号を表示 (Show)'}
          </button>
        </div>
        
        {/* Transpose */}
        <div className="bg-gray-700 p-3 rounded-lg">
          <h3 className="text-white text-sm font-medium mb-2">移調 (Transpose)</h3>
          <div className="flex items-center justify-between">
            <span className="text-white">
              {transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones}
            </span>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
              onClick={() => setIsTransposeModalOpen(true)}
            >
              変更 (Change)
            </button>
          </div>
        </div>
      </div>
      
      {/* A-B Loop Controls */}
      <div className="mt-4 bg-gray-700 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white text-sm font-medium">A-B リピート (Loop)</h3>
          <button
            className={`px-3 py-1 rounded-md text-sm ${
              isLoopActive ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}
            onClick={onLoopToggle}
          >
            {isLoopActive ? 'オン' : 'オフ'}
          </button>
        </div>
        
        <div className="relative h-8 bg-gray-600 rounded-md">
          {/* Timeline */}
          <div className="absolute top-0 left-0 h-full bg-gray-500 rounded-md"
            style={{ width: `${currentPercent}%` }}
          />
          
          {/* Loop start marker */}
          <motion.div
            className="absolute top-0 w-2 h-full bg-green-500 cursor-ew-resize"
            style={{ left: `${startPercent}%` }}
            drag="x"
            dragConstraints={{ left: 0, right: endPercent }}
            dragElastic={0}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              const containerWidth = info.target.parentElement?.clientWidth || 0;
              const newStartPercent = (info.point.x / containerWidth) * 100;
              const newStart = (newStartPercent / 100) * duration;
              onLoopRangeChange(newStart, loopEnd);
            }}
          />
          
          {/* Loop end marker */}
          <motion.div
            className="absolute top-0 w-2 h-full bg-red-500 cursor-ew-resize"
            style={{ left: `${endPercent}%` }}
            drag="x"
            dragConstraints={{ left: startPercent, right: 100 }}
            dragElastic={0}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              const containerWidth = info.target.parentElement?.clientWidth || 0;
              const newEndPercent = (info.point.x / containerWidth) * 100;
              const newEnd = (newEndPercent / 100) * duration;
              onLoopRangeChange(loopStart, newEnd);
            }}
          />
        </div>
        
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{formatTime(loopStart)}</span>
          <span>{formatTime(loopEnd)}</span>
        </div>
      </div>
      
      {/* Tempo Modal */}
      {isTempoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-gray-800 p-6 rounded-lg w-80"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h2 className="text-white text-lg font-medium mb-4">テンポ設定 (Set Tempo)</h2>
            
            <div className="mb-4">
              <input
                type="range"
                min="40"
                max="200"
                value={tempo}
                onChange={(e) => onTempoChange(parseInt(e.target.value, 10))}
                className="w-full"
              />
              <div className="flex justify-between mt-2">
                <span className="text-gray-400">40</span>
                <span className="text-white font-bold">{tempo} BPM</span>
                <span className="text-gray-400">200</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                onClick={() => setIsTempoModalOpen(false)}
              >
                キャンセル (Cancel)
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                onClick={() => setIsTempoModalOpen(false)}
              >
                OK
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Transpose Modal */}
      {isTransposeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-gray-800 p-6 rounded-lg w-80"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h2 className="text-white text-lg font-medium mb-4">移調 (Transpose)</h2>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((semitones) => (
                <button
                  key={semitones}
                  className={`px-3 py-2 rounded-md ${
                    semitones === transposeSemitones
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                  onClick={() => {
                    onTranspose(semitones);
                    setIsTransposeModalOpen(false);
                  }}
                >
                  {semitones > 0 ? `+${semitones}` : semitones}
                </button>
              ))}
            </div>
            
            <button
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              onClick={() => setIsTransposeModalOpen(false)}
            >
              キャンセル (Cancel)
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PracticeControls;
