import React from 'react';

export const LoadingIndicator = () => (
  <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
    <div className="h-full bg-blue-500 animate-progressBar"></div>
  </div>
);
