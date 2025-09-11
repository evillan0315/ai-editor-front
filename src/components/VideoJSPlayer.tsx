// src/components/VideoJSPlayer.tsx
import React, { useEffect, useRef } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";

import "video.js/dist/video-js.css";

type VideoJSPlayerProps = {
  options: Record<string, any>;
  onReady?: (player: Player) => void;
};

export default function VideoJSPlayer({ options, onReady }: VideoJSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const player = videojs(videoRef.current, options, () => {
      onReady?.(player);
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [options, onReady]);

  return (
    <div data-vjs-player>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered vjs-default-skin"
      />
    </div>
  );
}
