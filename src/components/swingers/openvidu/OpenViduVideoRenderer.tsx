import React from 'react';
import { Card, Typography } from '@mui/material';
import { StreamManager } from 'openvidu-browser';

import { IOpenViduPublisher, IOpenViduSubscriber } from '@/components/swingers/types';

// --- Interfaces ---
interface OpenViduVideoRendererProps {
  streamManager: IOpenViduPublisher | IOpenViduSubscriber;
  isLocal: boolean;
}

// --- Styles ---
const videoCardSx = {
  position: 'relative',
  width: '100%',
  paddingTop: '75%', // 4:3 aspect ratio
  backgroundColor: 'black',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  overflow: 'hidden',
  '& video': {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '8px',
  },
};

const videoLabelSx = {
  position: 'absolute',
  bottom: '8px',
  left: '8px',
  backgroundColor: 'rgba(0,0,0,0.6)',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
};

export const OpenViduVideoRenderer: React.FC<OpenViduVideoRendererProps> = ({
  streamManager,
  isLocal,
}) => {
  const videoId = `video-stream-${streamManager.streamId}`;
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current) {
      // Ensure the video element is attached when component mounts or stream changes
      streamManager.addVideoElement(videoRef.current);
    }
    return () => {
      // This cleanup logic might be tricky for OpenVidu, usually OpenVidu itself handles removing elements
      // on streamDestroyed. We explicitly remove only if we manage the DOM elements manually.
      // For now, relying on OpenVidu's internal handling on streamDestroyed.
    };
  }, [streamManager]); // Rerun effect if streamManager object changes

  let displayName = 'Guest';

  // Add null/undefined checks for stream and connection before accessing data
  if (streamManager.stream?.connection) {
    const connectionData = streamManager.stream.connection.data; // This is typically a JSON string
    try {
      const clientData = JSON.parse(connectionData);
      displayName = clientData.USERNAME || 'Guest';
    } catch (e) {
      // If parsing fails, or if it's an older format, attempt simple string extraction
      console.warn('Failed to parse connectionData as JSON, falling back to string extraction:', e, connectionData);
      // Attempt to extract from a non-JSON format like 'clientData_USERNAME'
      displayName = connectionData.replace('clientData_', '') || 'Guest';
    }
    // If connection data is available and it's a local stream, append "(You)"
    if (isLocal) {
      displayName = `${displayName} (You)`;
    }
  } else if (isLocal) {
    // If it's a local stream but connection data is not yet available (e.g., in preview state)
    displayName = 'You (Preview)';
  } else {
    // If it's a remote stream but connection data is not yet available (e.g., connecting)
    displayName = 'Remote User (Connecting...)';
  }

  return (
    <Card key={streamManager.streamId} sx={videoCardSx}>
      <video
        ref={videoRef}
        id={videoId}
        autoPlay={true}
        muted={isLocal} // Mute local video to prevent echo
      />
      <Typography sx={videoLabelSx}>
        {displayName}
      </Typography>
    </Card>
  );
};
