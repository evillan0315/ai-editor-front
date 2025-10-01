import React, { RefObject } from 'react';
import { Box } from '@mui/material';
import { AppScreenSize } from '@/types/preview';

interface AppPreviewContentProps {
  currentUrl: string; // Added this property as it was missing
  screenSize: AppScreenSize;
  iframeRef: RefObject<HTMLIFrameElement | null>;
}

const AppPreviewContent: React.FC<AppPreviewContentProps> = ({
  currentUrl,
  screenSize,
  iframeRef,
}) => {
  const getSizeClasses = (size: AppScreenSize) => {
    switch (size) {
      case 'mobile':
        return 'w-[375px] h-[667px]'; // iPhone 8 dimensions
      case 'tablet':
        return 'w-[768px] h-[1024px]'; // iPad dimensions
      case 'desktop':
      default:
        return 'w-full h-full';
    }
  };

  const responsiveClasses = getSizeClasses(screenSize);

  return (
    <Box
      className={`relative flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 ${
        screenSize !== 'desktop' ? 'flex-shrink-0' : 'flex-grow'
      } transition-all duration-300 ease-in-out`}
    >
      <Box
        className={`relative border-8 border-gray-300 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden ${responsiveClasses}`}
      >
        <iframe
          ref={iframeRef}
          src={currentUrl}
          title="App Preview"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
          className="w-full h-full border-none"
        />
        {/* Optional: Add an overlay for loading or interaction blocking */}
      </Box>
    </Box>
  );
};

export default AppPreviewContent;
