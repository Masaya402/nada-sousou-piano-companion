import { useState, useEffect, useRef, useCallback } from 'react';

// YouTube Player API の型定義
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
      };
      ready: (callback: () => void) => void;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubeOptions {
  videoId: string;
  onStateChange?: (state: number) => void;
  onReady?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onError?: (error: any) => void;
}

interface UseYouTubeReturn {
  player: any;
  playerState: number | null;
  currentTime: number;
  duration: number;
  isReady: boolean;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  loadVideoById: (videoId: string) => void;
}

const useYouTube = (
  containerId: string,
  options: UseYouTubeOptions
): UseYouTubeReturn => {
  const [player, setPlayer] = useState<any>(null);
  const [playerState, setPlayerState] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(100);
  
  const timeUpdateInterval = useRef<number | null>(null);
  const playerRef = useRef<any>(null);

  // Load YouTube API script
  useEffect(() => {
    // If the script is already there, don't load it again
    if (window.YT) return;
    
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    
    // This function will be called when the YouTube API is ready
    window.onYouTubeIframeAPIReady = () => {
      // We don't initialize the player here because the container might not be ready yet
      // The player will be initialized in the useEffect below
    };
    
    return () => {
      // Cleanup if needed
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, []);

  // Initialize player when API is ready and containerId is available
  useEffect(() => {
    const initializePlayer = () => {
      if (!window.YT || !window.YT.Player) {
        // If YouTube API is not ready yet, wait for it
        setTimeout(initializePlayer, 100);
        return;
      }

      const container = document.getElementById(containerId);
      if (!container) {
        // If container is not ready yet, wait for it
        setTimeout(initializePlayer, 100);
        return;
      }

      // Create player instance
      playerRef.current = new window.YT.Player(containerId, {
        videoId: options.videoId,
        playerVars: {
          controls: 0,  // Hide default controls
          disablekb: 1, // Disable keyboard controls
          fs: 0,        // Hide fullscreen button
          modestbranding: 1,
          rel: 0,       // Don't show related videos
          showinfo: 0,  // Hide video info
          iv_load_policy: 3, // Hide annotations
        },
        events: {
          onReady: () => {
            setPlayer(playerRef.current);
            setIsReady(true);
            setDuration(playerRef.current.getDuration());
            
            if (options.onReady) {
              options.onReady();
            }
          },
          onStateChange: (event: any) => {
            setPlayerState(event.data);
            
            if (options.onStateChange) {
              options.onStateChange(event.data);
            }
            
            // Start/stop time update interval based on player state
            if (event.data === window.YT.PlayerState.PLAYING) {
              // Clear any existing interval
              if (timeUpdateInterval.current) {
                window.clearInterval(timeUpdateInterval.current);
              }
              
              // Update time every 100ms while playing
              timeUpdateInterval.current = window.setInterval(() => {
                const time = playerRef.current.getCurrentTime();
                setCurrentTime(time);
                
                if (options.onTimeUpdate) {
                  options.onTimeUpdate(time);
                }
              }, 100);
            } else {
              // Clear interval when not playing
              if (timeUpdateInterval.current) {
                window.clearInterval(timeUpdateInterval.current);
                timeUpdateInterval.current = null;
              }
            }
          },
          onError: (event: any) => {
            if (options.onError) {
              options.onError(event);
            }
          }
        }
      });
    };

    initializePlayer();

    return () => {
      // Cleanup
      if (timeUpdateInterval.current) {
        window.clearInterval(timeUpdateInterval.current);
      }
      
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying YouTube player:', e);
        }
      }
    };
  }, [containerId, options.videoId]);

  // Play video function
  const playVideo = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  }, []);

  // Pause video function
  const pauseVideo = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
  }, []);

  // Seek to specific time
  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
      
      if (options.onTimeUpdate) {
        options.onTimeUpdate(seconds);
      }
    }
  }, [options]);

  // Set playback rate
  const setPlaybackRate = useCallback((rate: number) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(rate);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  }, [isMuted]);

  // Set volume
  const setVolume = useCallback((value: number) => {
    if (playerRef.current) {
      playerRef.current.setVolume(value);
      setVolumeState(value);
    }
  }, []);

  // Load a new video
  const loadVideoById = useCallback((videoId: string) => {
    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId);
    }
  }, []);

  return {
    player,
    playerState,
    currentTime,
    duration,
    isReady,
    playVideo,
    pauseVideo,
    seekTo,
    setPlaybackRate,
    isMuted,
    toggleMute,
    volume,
    setVolume,
    loadVideoById
  };
};

export default useYouTube;
