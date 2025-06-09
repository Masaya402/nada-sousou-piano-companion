import { useState, useEffect } from 'react';
import { Midi } from '@tonejs/midi';

// Define types for our parsed music data
export interface Note {
  id: string;
  pitch: number; // MIDI note number (e.g., C4 = 60)
  start: number; // Time in seconds
  end: number; // Time in seconds
  duration: number; // Duration in seconds
  measure: number; // Measure number
  hand: 'left' | 'right' | 'both'; // Which hand plays this note
  finger?: number; // Finger number (1-5) if available
}

export interface MeasureTimestamp {
  measure: number;
  start: number; // Start time in seconds
  end: number; // End time in seconds
}

export interface MusicData {
  notes: Note[];
  measures: MeasureTimestamp[];
  title: string;
  composer: string;
  tempo: number;
}

const useMusicXML = (xmlPath: string) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [musicData, setMusicData] = useState<MusicData | null>(null);

  useEffect(() => {
    const fetchAndParseMusicXML = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the MusicXML file
        const response = await fetch(xmlPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch MusicXML: ${response.statusText}`);
        }

        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Extract basic metadata
        const title = xmlDoc.querySelector('work-title')?.textContent || 'Untitled';
        const composer = xmlDoc.querySelector('creator[type="composer"]')?.textContent || 'Unknown';
        
        // Extract tempo
        const tempoElement = xmlDoc.querySelector('sound[tempo]');
        const tempo = tempoElement ? parseInt(tempoElement.getAttribute('tempo') || '74', 10) : 74;

        // We'll use @tonejs/midi for more accurate timing information
        // First convert MusicXML to a simplified MIDI representation
        // This is a simplified approach - in a real app, you'd want a more robust MusicXML parser
        
        // For demo purposes, we'll create a simplified data structure
        const notes: Note[] = [];
        const measures: MeasureTimestamp[] = [];
        
        // Process measures and notes
        const measureElements = xmlDoc.querySelectorAll('measure');
        let currentTime = 0;
        let measureStartTime = 0;
        
        measureElements.forEach((measureEl) => {
          const measureNumber = parseInt(measureEl.getAttribute('number') || '1', 10);
          measureStartTime = currentTime;
          
          // Get divisions per quarter note for this measure
          const divisionsElement = measureEl.querySelector('divisions');
          const divisions = divisionsElement 
            ? parseInt(divisionsElement.textContent || '4', 10) 
            : 4; // Default to 4 divisions per quarter note
          
          // Process notes in this measure
          const noteElements = measureEl.querySelectorAll('note');
          noteElements.forEach((noteEl, noteIndex) => {
            // Skip if it's a rest
            if (noteEl.querySelector('rest')) return;
            
            // Get pitch information
            const step = noteEl.querySelector('step')?.textContent;
            const octave = noteEl.querySelector('octave')?.textContent;
            const alter = noteEl.querySelector('alter')?.textContent; // For sharps/flats
            
            if (!step || !octave) return;
            
            // Convert to MIDI note number
            const pitchMap: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
            const baseNote = pitchMap[step] + (parseInt(octave, 10) * 12);
            const alterValue = alter ? parseInt(alter, 10) : 0;
            const pitch = baseNote + alterValue;
            
            // Get duration
            const durationEl = noteEl.querySelector('duration');
            if (!durationEl?.textContent) return;
            
            const durationInDivisions = parseInt(durationEl.textContent, 10);
            const durationInQuarters = durationInDivisions / divisions;
            const durationInSeconds = durationInQuarters * (60 / tempo);
            
            // Get finger number if available
            const fingeringEl = noteEl.querySelector('technical > fingering');
            const finger = fingeringEl?.textContent 
              ? parseInt(fingeringEl.textContent, 10) 
              : undefined;
            
            // Determine which hand (simplified logic - in reality would need more context)
            // For demo, we'll say notes below middle C (MIDI 60) are left hand
            const hand = pitch < 60 ? 'left' : 'right';
            
            // Create note object
            const note: Note = {
              id: `note-${measureNumber}-${noteIndex}`,
              pitch,
              start: currentTime,
              duration: durationInSeconds,
              end: currentTime + durationInSeconds,
              measure: measureNumber,
              hand,
              finger
            };
            
            notes.push(note);
            currentTime += durationInSeconds;
          });
          
          // Record measure timestamp
          measures.push({
            measure: measureNumber,
            start: measureStartTime,
            end: currentTime
          });
        });
        
        setMusicData({
          notes,
          measures,
          title,
          composer,
          tempo
        });
      } catch (err) {
        console.error('Error parsing MusicXML:', err);
        setError(err instanceof Error ? err.message : 'Unknown error parsing MusicXML');
      } finally {
        setLoading(false);
      }
    };

    if (xmlPath) {
      fetchAndParseMusicXML();
    }
  }, [xmlPath]);

  // Function to get notes that should be active at a specific time
  const getActiveNotesAtTime = (time: number) => {
    if (!musicData) return [];
    return musicData.notes.filter(note => time >= note.start && time <= note.end);
  };

  // Function to get the current measure at a specific time
  const getCurrentMeasureAtTime = (time: number) => {
    if (!musicData) return 1;
    const currentMeasure = musicData.measures.find(m => time >= m.start && time <= m.end);
    return currentMeasure?.measure || 1;
  };

  // Function to filter notes by hand
  const getNotesByHand = (hand: 'left' | 'right' | 'both') => {
    if (!musicData) return [];
    if (hand === 'both') return musicData.notes;
    return musicData.notes.filter(note => note.hand === hand);
  };

  return {
    loading,
    error,
    musicData,
    getActiveNotesAtTime,
    getCurrentMeasureAtTime,
    getNotesByHand
  };
};

export default useMusicXML;
