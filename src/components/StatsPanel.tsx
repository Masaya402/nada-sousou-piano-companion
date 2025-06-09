import React from 'react';
import { motion } from 'framer-motion';

interface StatsPanelProps {
  isConnected: boolean;
  deviceName?: string;
  accuracy: number;
  timingOffset: number;
  notesPlayed: number;
  notesCorrect: number;
  onRefresh?: () => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  isConnected,
  deviceName,
  accuracy,
  timingOffset,
  notesPlayed,
  notesCorrect,
  onRefresh
}) => {
  // Get color based on accuracy
  const getAccuracyColor = () => {
    if (accuracy >= 90) return 'text-green-500';
    if (accuracy >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Get color based on timing offset
  const getTimingColor = () => {
    const absOffset = Math.abs(timingOffset);
    if (absOffset <= 50) return 'text-green-500';
    if (absOffset <= 100) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Get timing description
  const getTimingDescription = () => {
    if (timingOffset === 0) return '完璧 (Perfect)';
    if (timingOffset < 0) return `${Math.abs(timingOffset)}ms 早い (Early)`;
    return `${timingOffset}ms 遅い (Late)`;
  };
  
  return (
    <motion.div
      className="bg-gray-800 rounded-lg p-4 shadow-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-medium">MIDI 演奏統計</h3>
        {onRefresh && (
          <button
            className="text-gray-400 hover:text-white"
            onClick={onRefresh}
            title="Reset Statistics"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Connection status */}
      <div className="mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-300">
            {isConnected ? 'MIDI接続中 (Connected)' : 'MIDI未接続 (Not Connected)'}
          </span>
        </div>
        {isConnected && deviceName && (
          <div className="text-gray-400 text-sm mt-1 ml-5">
            {deviceName}
          </div>
        )}
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Accuracy */}
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">正確性 (Accuracy)</div>
          <div className={`text-xl font-bold ${getAccuracyColor()}`}>
            {accuracy.toFixed(1)}%
          </div>
          <div className="text-gray-400 text-xs mt-1">
            {notesCorrect} / {notesPlayed} ノート
          </div>
        </div>
        
        {/* Timing */}
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">タイミング (Timing)</div>
          <div className={`text-xl font-bold ${getTimingColor()}`}>
            {Math.abs(timingOffset).toFixed(0)} ms
          </div>
          <div className="text-gray-400 text-xs mt-1">
            {getTimingDescription()}
          </div>
        </div>
      </div>
      
      {/* Tips based on stats */}
      {isConnected && notesPlayed > 10 && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <h4 className="text-gray-300 text-sm font-medium mb-1">アドバイス (Tips)</h4>
          <ul className="text-gray-400 text-xs list-disc list-inside">
            {accuracy < 80 && (
              <li>ノートの正確性を向上させるために、ゆっくりと練習してみましょう。</li>
            )}
            {Math.abs(timingOffset) > 50 && timingOffset > 0 && (
              <li>タイミングが遅れています。もう少し早めに弾いてみましょう。</li>
            )}
            {Math.abs(timingOffset) > 50 && timingOffset < 0 && (
              <li>タイミングが早すぎます。もう少しリラックスして弾いてみましょう。</li>
            )}
            {accuracy > 90 && Math.abs(timingOffset) <= 50 && (
              <li>素晴らしい演奏です！テンポを上げて挑戦してみましょう。</li>
            )}
          </ul>
        </div>
      )}
      
      {/* Not connected message */}
      {!isConnected && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg text-center">
          <p className="text-gray-400 text-sm">
            MIDI機器を接続すると、演奏の統計が表示されます。
          </p>
          <p className="text-gray-400 text-xs mt-1">
            (Connect a MIDI device to see your performance statistics)
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default StatsPanel;
