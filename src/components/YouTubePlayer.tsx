import React, { useRef, useEffect, useState } from 'react';
import useYouTube from '../hooks/useYouTube';
import { motion } from 'framer-motion';

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (currentTime: number) => void;
  onStateChange?: (state: number) => void;
  onReady?: () => void;
  playbackRate?: number;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  onTimeUpdate,
  onStateChange,
  onReady,
  playbackRate = 1
}) => {
  const playerContainerId = 'youtube-player-container';
  const containerRef = useRef<HTMLDivElement>(null);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<number | null>(null);

  // Initialize YouTube player
  const {
    isReady,
    playerState,
    currentTime,
    duration,
    playVideo,
    pauseVideo,
    seekTo,
    setPlaybackRate,
    isMuted,
    toggleMute,
    volume,
    setVolume
  } = useYouTube(playerContainerId, {
    videoId,
    onTimeUpdate,
    onStateChange,
    onReady,
    onError: (error) => console.error('YouTube player error:', error)
  });

  // Set playback rate when it changes
  useEffect(() => {
    if (isReady && playbackRate) {
      setPlaybackRate(playbackRate);
    }
  }, [isReady, playbackRate, setPlaybackRate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if this component is focused or no specific element is focused
      if (document.activeElement && 
          document.activeElement !== document.body && 
          !containerRef.current?.contains(document.activeElement)) {
        return;
      }

      switch (e.key) {
        case ' ': // Space bar
          e.preventDefault();
          if (playerState === window.YT.PlayerState.PLAYING) {
            pauseVideo();
          } else {
            playVideo();
          }
          break;
        case 'ArrowLeft': // Left arrow - seek backward 5 seconds
          e.preventDefault();
          seekTo(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight': // Right arrow - seek forward 5 seconds
          e.preventDefault();
          seekTo(Math.min(duration, currentTime + 5));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playerState, playVideo, pauseVideo, seekTo, currentTime, duration]);

  // Auto-hide controls after inactivity
  const showControls = () => {
    setIsControlsVisible(true);
    
    if (controlsTimeout) {
      window.clearTimeout(controlsTimeout);
    }
    
    const timeout = window.setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);
    
    setControlsTimeout(timeout);
  };

  useEffect(() => {
    // Show controls initially
    showControls();
    
    // Clean up timeout on unmount
    return () => {
      if (controlsTimeout) {
        window.clearTimeout(controlsTimeout);
      }
    };
  }, []);

  // Format time (seconds) to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-black aspect-video"
      onMouseMove={showControls}
      onClick={() => {
        if (playerState === window.YT.PlayerState.PLAYING) {
          pauseVideo();
        } else {
          playVideo();
        }
      }}
    >
      {/* YouTube player container */}
      <div id={playerContainerId} className="w-full h-full" />
      
      {/* Custom controls overlay */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isControlsVisible ? 1 : 0,
          y: isControlsVisible ? 0 : 20
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Progress bar */}
        <div className="relative w-full h-1 bg-gray-700 rounded-full mb-2 cursor-pointer"
          onClick={(e) => {
            // Calculate click position relative to the progress bar width
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            seekTo(pos * duration);
            e.stopPropagation();
          }}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause button */}
            <button 
              className="text-white focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                if (playerState === window.YT.PlayerState.PLAYING) {
                  pauseVideo();
                } else {
                  playVideo();
                }
              }}
            >
              {playerState === window.YT.PlayerState.PLAYING ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            
            {/* Time display */}
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Mute toggle */}
            <button 
              className="text-white focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            
            {/* Volume slider */}
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                e.stopPropagation();
                setVolume(parseInt(e.target.value, 10));
              }}
              className="w-24 accent-blue-500"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default YouTubePlayer;
