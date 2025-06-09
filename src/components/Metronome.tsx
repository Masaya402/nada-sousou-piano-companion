import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useMetronome from '../hooks/useMetronome';

interface MetronomeProps {
  tempo: number;
  isPlaying: boolean;
  beatsPerMeasure?: number;
  onTempoChange?: (tempo: number) => void;
}

const Metronome: React.FC<MetronomeProps> = ({
  tempo,
  isPlaying,
  beatsPerMeasure = 4,
  onTempoChange
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { start, stop, currentBeat } = useMetronome(tempo, beatsPerMeasure);
  
  // Start/stop metronome based on isPlaying prop
  useEffect(() => {
    if (isPlaying && isVisible) {
      start();
    } else {
      stop();
    }
    
    return () => {
      stop();
    };
  }, [isPlaying, isVisible, start, stop]);
  
  // Update metronome tempo when tempo prop changes
  useEffect(() => {
    stop();
    if (isPlaying && isVisible) {
      start();
    }
  }, [tempo, start, stop, isPlaying, isVisible]);
  
  // Toggle metronome visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    if (!isVisible && isPlaying) {
      // Will start on next render due to useEffect
    } else if (isVisible) {
      stop();
    }
  };
  
  // Handle tempo change
  const handleTempoChange = (newTempo: number) => {
    if (onTempoChange) {
      onTempoChange(newTempo);
    }
  };
  
  return (
    <div className="metronome-container">
      {/* Toggle button */}
      <button
        className={`fixed bottom-4 left-4 p-3 rounded-full shadow-lg z-10 ${
          isVisible ? 'bg-blue-600' : 'bg-gray-700'
        }`}
        onClick={toggleVisibility}
        title={isVisible ? 'Hide Metronome' : 'Show Metronome'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
      
      {/* Metronome panel */}
      {isVisible && (
        <motion.div
          className="fixed bottom-20 left-4 bg-gray-800 p-4 rounded-lg shadow-lg z-10 w-64"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <h3 className="text-white text-lg font-medium mb-3">メトロノーム</h3>
          
          {/* Tempo display and controls */}
          <div className="flex items-center justify-between mb-4">
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-full"
              onClick={() => handleTempoChange(Math.max(40, tempo - 5))}
            >
              -
            </button>
            
            <div className="text-white text-xl font-bold">
              {tempo} <span className="text-sm">BPM</span>
            </div>
            
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-full"
              onClick={() => handleTempoChange(Math.min(220, tempo + 5))}
            >
              +
            </button>
          </div>
          
          {/* Tempo slider */}
          <input
            type="range"
            min="40"
            max="220"
            value={tempo}
            onChange={(e) => handleTempoChange(parseInt(e.target.value, 10))}
            className="w-full mb-4"
          />
          
          {/* Beat visualization */}
          <div className="flex justify-between mb-2">
            {Array.from({ length: beatsPerMeasure }).map((_, index) => (
              <motion.div
                key={index}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentBeat === index + 1
                    ? index + 1 === 1
                      ? 'bg-red-500' // First beat (accent)
                      : 'bg-blue-500' // Other beats
                    : 'bg-gray-700'
                }`}
                animate={{
                  scale: currentBeat === index + 1 ? [1, 1.2, 1] : 1
                }}
                transition={{
                  duration: 0.2
                }}
              >
                <span className="text-white">{index + 1}</span>
              </motion.div>
            ))}
          </div>
          
          {/* Common tempo presets */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[60, 80, 100, 120, 140, 160].map((presetTempo) => (
              <button
                key={presetTempo}
                className={`px-2 py-1 rounded ${
                  tempo === presetTempo
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
                onClick={() => handleTempoChange(presetTempo)}
              >
                {presetTempo}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Metronome;
