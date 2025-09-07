import React from 'react';

const LoadingDots: React.FC = () => {
  return (
    <div className="flex items-center space-x-1">
      <span className="animate-pulse-slow w-1.5 h-1.5 bg-current rounded-full delay-0"></span>
      <span className="animate-pulse-slow w-1.5 h-1.5 bg-current rounded-full delay-100"></span>
      <span className="animate-pulse-slow w-1.5 h-1.5 bg-current rounded-full delay-200"></span>
    </div>
  );
};

export default LoadingDots;
