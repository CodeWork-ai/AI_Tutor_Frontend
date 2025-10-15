interface YT {
  Player: {
    new (
      element: HTMLIFrameElement | string,
      options: {
        events?: {
          onReady?: (event: { target: YT.Player }) => void;
          onStateChange?: (event: { data: number }) => void;
          onError?: (event: any) => void;
          onPlaybackQualityChange?: (event: any) => void;
          onPlaybackRateChange?: (event: any) => void;
          onApiChange?: (event: any) => void;
        };
        height?: string | number;
        width?: string | number;
        videoId?: string;
        playerVars?: Record<string, any>;
      }
    ): YT.Player;
  };
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

interface Window {
  YT: YT;
  onYouTubeIframeAPIReady?: () => void;
}

declare namespace YT {
  interface Player {
    addEventListener(event: string, listener: (e: any) => void): void;
    removeEventListener(event: string): void;
    getVideoData(): any;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): number;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    stopVideo(): void;
    playVideo(): void;
    pauseVideo(): void;
  }
}