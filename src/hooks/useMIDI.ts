import { useState, useEffect, useCallback } from 'react';

interface MIDINote {
  note: number;
  velocity: number;
  timestamp: number;
}

interface MIDIAccuracy {
  noteId: string;
  expectedNote: number;
  actualNote: number;
  timingOffset: number; // in milliseconds
  isCorrect: boolean;
}

interface UseMIDIReturn {
  midiSupported: boolean;
  midiAccess: WebMidi.MIDIAccess | null;
  midiInputs: WebMidi.MIDIInput[];
  activeNotes: MIDINote[];
  selectedInput: WebMidi.MIDIInput | null;
  selectInput: (inputId: string) => void;
  accuracy: MIDIAccuracy[];
  accuracyPercentage: number;
  averageTimingOffset: number;
  resetStats: () => void;
  errorMessage: string | null;
}

interface UseMIDIOptions {
  expectedNotes?: Array<{ id: string; pitch: number; start: number; end: number }>;
  currentTime?: number;
}

const useMIDI = (options: UseMIDIOptions = {}): UseMIDIReturn => {
  const [midiSupported, setMidiSupported] = useState<boolean>(false);
  const [midiAccess, setMidiAccess] = useState<WebMidi.MIDIAccess | null>(null);
  const [midiInputs, setMidiInputs] = useState<WebMidi.MIDIInput[]>([]);
  const [selectedInput, setSelectedInput] = useState<WebMidi.MIDIInput | null>(null);
  const [activeNotes, setActiveNotes] = useState<MIDINote[]>([]);
  const [accuracy, setAccuracy] = useState<MIDIAccuracy[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate accuracy percentage
  const accuracyPercentage = accuracy.length > 0
    ? Math.round((accuracy.filter(a => a.isCorrect).length / accuracy.length) * 100)
    : 0;

  // Calculate average timing offset
  const averageTimingOffset = accuracy.length > 0
    ? Math.round(accuracy.reduce((sum, a) => sum + Math.abs(a.timingOffset), 0) / accuracy.length)
    : 0;

  // Initialize MIDI
  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setMidiSupported(false);
      setErrorMessage('WebMIDI is not supported in this browser');
      return;
    }

    const initMIDI = async () => {
      try {
        const access = await navigator.requestMIDIAccess();
        setMidiAccess(access);
        setMidiSupported(true);
        
        // Get available inputs
        const inputs: WebMidi.MIDIInput[] = [];
        access.inputs.forEach(input => {
          inputs.push(input);
        });
        
        setMidiInputs(inputs);
        
        // Auto-select first input if available
        if (inputs.length > 0 && !selectedInput) {
          setSelectedInput(inputs[0]);
        }
        
        // Listen for MIDI device connections/disconnections
        access.onstatechange = (e) => {
          const inputs: WebMidi.MIDIInput[] = [];
          access.inputs.forEach(input => {
            inputs.push(input);
          });
          setMidiInputs(inputs);
          
          // Check if the selected input is still available
          if (selectedInput && !inputs.some(input => input.id === selectedInput.id)) {
            setSelectedInput(inputs.length > 0 ? inputs[0] : null);
          }
        };
      } catch (err) {
        console.error('Failed to get MIDI access:', err);
        setMidiSupported(false);
        setErrorMessage(err instanceof Error ? err.message : 'Failed to get MIDI access');
      }
    };

    initMIDI();
  }, []);

  // Handle MIDI message from selected input
  useEffect(() => {
    if (!selectedInput) return;
    
    const handleMIDIMessage = (message: WebMidi.MIDIMessageEvent) => {
      const [command, note, velocity] = message.data;
      
      // Note on (144-159) with velocity > 0
      if ((command >= 144 && command <= 159) && velocity > 0) {
        const timestamp = performance.now();
        
        // Add to active notes
        setActiveNotes(prev => [...prev, { note, velocity, timestamp }]);
        
        // Compare with expected notes if provided
        if (options.expectedNotes && options.currentTime !== undefined) {
          const currentTime = options.currentTime;
          
          // Find the closest expected note
          const expectedNote = options.expectedNotes.find(n => 
            Math.abs(n.start - currentTime) < 1 && // Within 1 second of expected start time
            n.pitch === note
          );
          
          if (expectedNote) {
            // Calculate timing offset
            const timingOffset = Math.round((timestamp - expectedNote.start) * 1000); // Convert to ms
            
            // Add to accuracy stats
            setAccuracy(prev => [...prev, {
              noteId: expectedNote.id,
              expectedNote: expectedNote.pitch,
              actualNote: note,
              timingOffset,
              isCorrect: true
            }]);
          } else {
            // No matching expected note found - wrong note
            setAccuracy(prev => [...prev, {
              noteId: `wrong-${Date.now()}`,
              expectedNote: -1, // Unknown
              actualNote: note,
              timingOffset: 0,
              isCorrect: false
            }]);
          }
        }
      }
      // Note off (128-143) or note on with velocity 0
      else if ((command >= 128 && command <= 143) || 
               (command >= 144 && command <= 159 && velocity === 0)) {
        // Remove from active notes
        setActiveNotes(prev => prev.filter(n => n.note !== note));
      }
    };
    
    selectedInput.onmidimessage = handleMIDIMessage;
    
    return () => {
      selectedInput.onmidimessage = null;
    };
  }, [selectedInput, options.expectedNotes, options.currentTime]);

  // Select a MIDI input by ID
  const selectInput = useCallback((inputId: string) => {
    const input = midiInputs.find(input => input.id === inputId);
    if (input) {
      setSelectedInput(input);
    }
  }, [midiInputs]);

  // Reset accuracy stats
  const resetStats = useCallback(() => {
    setAccuracy([]);
  }, []);

  return {
    midiSupported,
    midiAccess,
    midiInputs,
    activeNotes,
    selectedInput,
    selectInput,
    accuracy,
    accuracyPercentage,
    averageTimingOffset,
    resetStats,
    errorMessage
  };
};

export default useMIDI;
