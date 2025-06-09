import { useState, useEffect, useRef, useCallback } from 'react';

interface UseMetronomeOptions {
  tempo: number;
  audioSrc: string;
  enabled?: boolean;
  onTick?: (beat: number) => void;
}

interface UseMetronomeReturn {
  isPlaying: boolean;
  start: () => void;
  stop: () => void;
  setTempo: (tempo: number) => void;
  currentBeat: number;
  bpm: number;
}

const useMetronome = (options: UseMetronomeOptions): UseMetronomeReturn => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(options.tempo || 74);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);
  
  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(options.audioSrc);
    audioRef.current.preload = 'auto';
    
    // Clean up audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [options.audioSrc]);
  
  // Update tempo when options change
  useEffect(() => {
    setBpm(options.tempo);
  }, [options.tempo]);
  
  // Handle auto-start/stop based on enabled prop
  useEffect(() => {
    if (options.enabled === true && !isPlaying) {
      start();
    } else if (options.enabled === false && isPlaying) {
      stop();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [options.enabled]);
  
  // Calculate interval in milliseconds from BPM
  const calculateInterval = useCallback((tempo: number): number => {
    return 60000 / tempo; // Convert BPM to milliseconds
  }, []);
  
  // Start the metronome
  const start = useCallback(() => {
    if (isPlaying || !audioRef.current) return;
    
    setIsPlaying(true);
    setCurrentBeat(0);
    
    const interval = calculateInterval(bpm);
    lastTickTimeRef.current = performance.now();
    
    // Use setInterval for regular ticks
    intervalRef.current = window.setInterval(() => {
      if (!audioRef.current) return;
      
      // Play the click sound
      const clickSound = audioRef.current.cloneNode() as HTMLAudioElement;
      clickSound.play().catch(err => console.error('Error playing metronome:', err));
      
      // Update beat counter
      setCurrentBeat(prev => (prev + 1) % 4); // Assuming 4/4 time signature
      
      // Call onTick callback if provided
      if (options.onTick) {
        options.onTick(currentBeat);
      }
      
      lastTickTimeRef.current = performance.now();
    }, interval);
    
  }, [bpm, isPlaying, options.onTick, calculateInterval, currentBeat]);
  
  // Stop the metronome
  const stop = useCallback(() => {
    if (!isPlaying) return;
    
    setIsPlaying(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isPlaying]);
  
  // Set a new tempo
  const setTempo = useCallback((newTempo: number) => {
    setBpm(newTempo);
    
    // If currently playing, restart with new tempo
    if (isPlaying && intervalRef.current) {
      clearInterval(intervalRef.current);
      
      const interval = calculateInterval(newTempo);
      lastTickTimeRef.current = performance.now();
      
      intervalRef.current = window.setInterval(() => {
        if (!audioRef.current) return;
        
        // Play the click sound
        const clickSound = audioRef.current.cloneNode() as HTMLAudioElement;
        clickSound.play().catch(err => console.error('Error playing metronome:', err));
        
        // Update beat counter
        setCurrentBeat(prev => (prev + 1) % 4);
        
        // Call onTick callback if provided
        if (options.onTick) {
          options.onTick(currentBeat);
        }
        
        lastTickTimeRef.current = performance.now();
      }, interval);
    }
  }, [isPlaying, calculateInterval, options.onTick, currentBeat]);
  
  return {
    isPlaying,
    start,
    stop,
    setTempo,
    currentBeat,
    bpm
  };
};

export default useMetronome;
