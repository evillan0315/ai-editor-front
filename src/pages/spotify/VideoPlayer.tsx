// src/components/spotify/VideoPlayer.tsx
import React, { useEffect } from "react";
import VideoJSPlayer from "@/components/VideoJSPlayer";
import type Player from "video.js/dist/types/player";

type VideoPlayerProps = {
  src: string;
  mediaElementRef: React.MutableRefObject<HTMLMediaElement | null>;
  options: Record<string, any>;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, mediaElementRef, options }) => {
  // Ensure the video element from video.js is assigned to your shared ref
  const handleReady = (player: Player) => {
    mediaElementRef.current = player.el() as HTMLVideoElement;
  };

  return (
    <VideoJSPlayer
      options={{
        ...options,
        sources: [
          {
            src,
            type: options?.sources?.[0]?.type || "video/mp4",
          },
        ],
      }}
      onReady={handleReady}
    />
  );
};

export default VideoPlayer;
