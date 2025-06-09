import React, { useEffect, useRef, useState } from 'react';
import { ReactSVGPanZoom, TOOL_PAN } from 'react-svg-pan-zoom';
import { Vex } from 'vexflow';
import { MusicData, MeasureTimestamp } from '../hooks/useMusicXML';
import { motion } from 'framer-motion';

interface SheetViewerProps {
  musicData: MusicData | null;
  currentTime: number;
  showFingerNumbers: boolean;
  activeHand: 'left' | 'right' | 'both';
  onMeasureClick?: (measure: number) => void;
}

const SheetViewer: React.FC<SheetViewerProps> = ({
  musicData,
  currentTime,
  showFingerNumbers,
  activeHand,
  onMeasureClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewerRef = useRef<any>(null);
  const [svgWidth, setSvgWidth] = useState(800);
  const [svgHeight, setSvgHeight] = useState(600);
  const [currentMeasure, setCurrentMeasure] = useState(1);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  
  // Render sheet music using VexFlow
  useEffect(() => {
    if (!musicData || !svgRef.current) return;
    
    // Clear previous content
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }
    
    try {
      // Initialize VexFlow renderer
      const renderer = new Vex.Flow.Renderer(
        svgRef.current,
        Vex.Flow.Renderer.Backends.SVG
      );
      
      renderer.resize(svgWidth, svgHeight);
      const context = renderer.getContext();
      context.setFont('Arial', 10);
      
      // Calculate how many measures to put in each line
      const measuresPerLine = 4;
      const totalMeasures = musicData.measures.length;
      const lines = Math.ceil(totalMeasures / measuresPerLine);
      
      // Calculate dimensions
      const lineHeight = svgHeight / (lines + 1);
      const measureWidth = (svgWidth - 50) / measuresPerLine;
      
      // Group notes by measure
      const notesByMeasure: Record<number, Array<{ pitch: number; duration: string; finger?: number }>> = {};
      
      musicData.notes.forEach(note => {
        // Skip notes that don't match the active hand filter
        if (activeHand !== 'both' && note.hand !== activeHand) return;
        
        if (!notesByMeasure[note.measure]) {
          notesByMeasure[note.measure] = [];
        }
        
        // Convert duration to VexFlow format (simplified)
        let duration = 'q'; // Default to quarter note
        if (note.duration >= 1) duration = 'w'; // Whole note
        else if (note.duration >= 0.5) duration = 'h'; // Half note
        else if (note.duration >= 0.25) duration = 'q'; // Quarter note
        else if (note.duration >= 0.125) duration = '8'; // Eighth note
        else duration = '16'; // Sixteenth note
        
        // Convert MIDI pitch to note name
        const octave = Math.floor(note.pitch / 12) - 1;
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteName = noteNames[note.pitch % 12];
        
        notesByMeasure[note.measure].push({
          pitch: note.pitch,
          duration,
          finger: note.finger
        });
      });
      
      // Draw each line of music
      for (let line = 0; line < lines; line++) {
        const y = 50 + line * lineHeight;
        
        // Create a stave for each measure in this line
        for (let i = 0; i < measuresPerLine; i++) {
          const measureIndex = line * measuresPerLine + i;
          const measureNumber = measureIndex + 1;
          
          // Break if we've drawn all measures
          if (measureNumber > totalMeasures) break;
          
          const x = 10 + i * measureWidth;
          const stave = new Vex.Flow.Stave(x, y, measureWidth - 10);
          
          // Add measure number
          if (i === 0) {
            stave.addClef('treble');
          }
          
          stave.setMeasure(measureNumber);
          stave.setContext(context).draw();
          
          // Add notes for this measure
          const notes = notesByMeasure[measureNumber] || [];
          if (notes.length > 0) {
            const vfNotes = notes.map(note => {
              // Convert MIDI pitch to VexFlow note
              const octave = Math.floor(note.pitch / 12) - 1;
              const noteNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
              const noteName = noteNames[note.pitch % 12];
              
              const vfNote = new Vex.Flow.StaveNote({
                clef: 'treble',
                keys: [`${noteName}/${octave}`],
                duration: note.duration
              });
              
              // Add accidental if needed
              if (noteName.includes('#')) {
                vfNote.addAccidental(0, new Vex.Flow.Accidental('#'));
              }
              
              // Add finger number if available and enabled
              if (showFingerNumbers && note.finger) {
                vfNote.addAnnotation(0, new Vex.Flow.Annotation(note.finger.toString())
                  .setVerticalJustification(Vex.Flow.Annotation.VerticalJustify.BOTTOM)
                );
              }
              
              return vfNote;
            });
            
            // Create a voice and add notes
            const voice = new Vex.Flow.Voice({
              num_beats: 4, // Assuming 4/4 time signature
              beat_value: 4
            }).setStrict(false); // Allow incomplete measures
            
            voice.addTickables(vfNotes);
            
            // Format and draw
            new Vex.Flow.Formatter()
              .joinVoices([voice])
              .format([voice], measureWidth - 20);
            
            voice.draw(context, stave);
            
            // Add measure number for debugging/navigation
            context.save();
            context.setFont('Arial', 10, 'bold');
            context.fillText(`${measureNumber}`, x + 5, y - 10);
            context.restore();
            
            // Add click handler for measure navigation
            if (onMeasureClick) {
              // Create a transparent rectangle over the measure for click detection
              const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              rect.setAttribute('x', x.toString());
              rect.setAttribute('y', y.toString());
              rect.setAttribute('width', measureWidth.toString());
              rect.setAttribute('height', '100');
              rect.setAttribute('fill', 'transparent');
              rect.setAttribute('data-measure', measureNumber.toString());
              rect.style.cursor = 'pointer';
              
              rect.addEventListener('click', () => {
                onMeasureClick(measureNumber);
              });
              
              svgRef.current?.appendChild(rect);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error rendering sheet music:', error);
    }
  }, [musicData, svgWidth, svgHeight, showFingerNumbers, activeHand, onMeasureClick]);
  
  // Update current measure based on current time
  useEffect(() => {
    if (!musicData) return;
    
    const measure = musicData.measures.find(m => 
      currentTime >= m.start && currentTime <= m.end
    );
    
    if (measure) {
      setCurrentMeasure(measure.measure);
      
      // Auto-scroll to current measure if enabled
      if (isAutoScrolling && viewerRef.current) {
        const measureElements = svgRef.current?.querySelectorAll(`[data-measure="${measure.measure}"]`);
        if (measureElements && measureElements.length > 0) {
          const measureElement = measureElements[0];
          const x = parseFloat(measureElement.getAttribute('x') || '0');
          const y = parseFloat(measureElement.getAttribute('y') || '0');
          
          // Calculate center position for the measure
          const width = parseFloat(measureElement.getAttribute('width') || '0');
          const centerX = x + width / 2;
          const centerY = y + 50;
          
          // Smoothly pan to the measure
          viewerRef.current.setPointOnViewerCenter(centerX, centerY, true);
        }
      }
    }
  }, [currentTime, musicData, isAutoScrolling]);
  
  // Adjust SVG dimensions on container resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSvgWidth(width);
      setSvgHeight(height);
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Toggle auto-scrolling
  const toggleAutoScroll = () => {
    setIsAutoScrolling(!isAutoScrolling);
  };
  
  if (!musicData) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-800 text-white">
        <p>Loading sheet music...</p>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="relative w-full h-full bg-white">
      <ReactSVGPanZoom
        ref={viewerRef}
        width={svgWidth}
        height={svgHeight}
        tool={TOOL_PAN}
        detectAutoPan={false}
        toolbarProps={{ position: 'none' }}
        miniatureProps={{ position: 'none' }}
        background="#fff"
        SVGBackground="#fff"
        onChangeValue={() => {
          // When user manually pans/zooms, disable auto-scrolling
          if (isAutoScrolling) {
            setIsAutoScrolling(false);
          }
        }}
      >
        <svg ref={svgRef} width={svgWidth} height={svgHeight} />
      </ReactSVGPanZoom>
      
      {/* Controls overlay */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <motion.button
          className={`p-2 rounded-full ${isAutoScrolling ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}
          whileTap={{ scale: 0.95 }}
          onClick={toggleAutoScroll}
          title={isAutoScrolling ? 'Disable auto-scroll' : 'Enable auto-scroll'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </motion.button>
      </div>
      
      {/* Current measure indicator */}
      <div className="absolute top-4 left-4 bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
        Measure: {currentMeasure}
      </div>
    </div>
  );
};

export default SheetViewer;
