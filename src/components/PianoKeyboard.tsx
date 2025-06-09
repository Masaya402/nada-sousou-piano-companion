import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface PianoKeyboardProps {
  activeNotes: number[]; // MIDI note numbers (e.g., C4 = 60)
  midiInputNotes?: number[]; // Optional MIDI input notes for highlighting
  startNote?: number; // Starting MIDI note (default: 21, A0)
  endNote?: number; // Ending MIDI note (default: 108, C8)
  onNoteClick?: (note: number) => void;
}

// Key dimensions
const WHITE_KEY_WIDTH = 24;
const WHITE_KEY_HEIGHT = 120;
const BLACK_KEY_WIDTH = 14;
const BLACK_KEY_HEIGHT = 80;

const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  activeNotes,
  midiInputNotes = [],
  startNote = 21, // A0
  endNote = 108, // C8
  onNoteClick
}) => {
  // Generate piano keys
  const keys = useMemo(() => {
    const pianoKeys = [];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    for (let note = startNote; note <= endNote; note++) {
      const noteName = noteNames[note % 12];
      const octave = Math.floor(note / 12) - 1;
      const isBlackKey = noteName.includes('#');
      
      pianoKeys.push({
        note,
        noteName: `${noteName}${octave}`,
        isBlackKey
      });
    }
    
    return pianoKeys;
  }, [startNote, endNote]);
  
  // Calculate total width
  const whiteKeyCount = keys.filter(key => !key.isBlackKey).length;
  const totalWidth = whiteKeyCount * WHITE_KEY_WIDTH;
  
  // Determine if a note is active
  const isNoteActive = (note: number) => activeNotes.includes(note);
  
  // Determine if a note is being played via MIDI input
  const isNotePlayed = (note: number) => midiInputNotes.includes(note);
  
  // Get key color based on state
  const getKeyColor = (note: number, isBlackKey: boolean) => {
    if (isNotePlayed(note)) {
      return 'bg-green-500'; // MIDI input highlight
    }
    if (isNoteActive(note)) {
      return isBlackKey ? 'bg-blue-700' : 'bg-blue-500'; // Active note highlight
    }
    return isBlackKey ? 'bg-gray-800' : 'bg-white'; // Default colors
  };
  
  // Calculate position for black keys
  const getBlackKeyPosition = (note: number) => {
    const notePosition = note % 12;
    
    // Find the white key index this black key is attached to
    let whiteKeyIndex = 0;
    for (let i = startNote; i < note; i++) {
      if (!['C#', 'D#', 'F#', 'G#', 'A#'].includes((['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])[i % 12])) {
        whiteKeyIndex++;
      }
    }
    
    // Adjust position based on which black key it is
    let offset = 0;
    if (notePosition === 1) offset = WHITE_KEY_WIDTH * 0.7; // C#
    else if (notePosition === 3) offset = WHITE_KEY_WIDTH * 0.8; // D#
    else if (notePosition === 6) offset = WHITE_KEY_WIDTH * 0.7; // F#
    else if (notePosition === 8) offset = WHITE_KEY_WIDTH * 0.8; // G#
    else if (notePosition === 10) offset = WHITE_KEY_WIDTH * 0.8; // A#
    
    return whiteKeyIndex * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2 + offset;
  };
  
  // Handle key click
  const handleKeyClick = (note: number) => {
    if (onNoteClick) {
      onNoteClick(note);
    }
  };
  
  return (
    <div className="piano-keyboard-container relative w-full overflow-x-auto">
      <div 
        className="piano-keyboard-inner relative"
        style={{ 
          width: totalWidth, 
          height: WHITE_KEY_HEIGHT,
          margin: '0 auto'
        }}
      >
        {/* White keys */}
        {keys.filter(key => !key.isBlackKey).map((key) => (
          <motion.div
            key={`white-${key.note}`}
            className={`absolute border border-gray-300 rounded-b-sm ${getKeyColor(key.note, false)}`}
            style={{
              width: WHITE_KEY_WIDTH,
              height: WHITE_KEY_HEIGHT,
              left: (keys.filter(k => !k.isBlackKey && k.note < key.note).length) * WHITE_KEY_WIDTH,
              zIndex: 1
            }}
            whileTap={{ y: 2 }}
            onClick={() => handleKeyClick(key.note)}
            initial={{ y: 0 }}
            animate={{ 
              y: isNotePlayed(key.note) ? 2 : 0,
              transition: { duration: 0.1 }
            }}
          >
            {/* Optional note name at bottom of key */}
            <div className="absolute bottom-1 w-full text-center text-xs text-gray-500">
              {key.noteName}
            </div>
          </motion.div>
        ))}
        
        {/* Black keys */}
        {keys.filter(key => key.isBlackKey).map((key) => (
          <motion.div
            key={`black-${key.note}`}
            className={`absolute border border-gray-800 rounded-b-sm ${getKeyColor(key.note, true)}`}
            style={{
              width: BLACK_KEY_WIDTH,
              height: BLACK_KEY_HEIGHT,
              left: getBlackKeyPosition(key.note),
              zIndex: 2
            }}
            whileTap={{ y: 2 }}
            onClick={() => handleKeyClick(key.note)}
            initial={{ y: 0 }}
            animate={{ 
              y: isNotePlayed(key.note) ? 2 : 0,
              transition: { duration: 0.1 }
            }}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center mt-2 space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 mr-1"></div>
          <span>Score Notes</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 mr-1"></div>
          <span>MIDI Input</span>
        </div>
      </div>
    </div>
  );
};

export default PianoKeyboard;
