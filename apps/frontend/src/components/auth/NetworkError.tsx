import ThematicContainer from '@components/ui/ThematicContainer';
import Link from 'next/link';
import React from 'react';

export interface NetworkErrorProps {
  onRetryConnection: () => void
}
const NetworkError = ({onRetryConnection}: NetworkErrorProps) => {
  return (
    <ThematicContainer
      color="nocenaPink"
      glassmorphic={true}
      asButton={false}
      rounded="2xl"
      className="p-6 text-center"
    >
      <h3 className="text-lg font-bold text-white mb-2">Network Error</h3>
      <p className="text-sm text-gray-300 mb-4">Failed to check your profile. Please try again.</p>
      <button
        onClick={onRetryConnection}
        className="text-nocenaPink hover:text-nocenaPink/80 font-medium"
      >
        Retry Connection
      </button>
    </ThematicContainer>
  )
}

export default NetworkError