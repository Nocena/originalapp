import React from 'react';

interface HoverOverlayProps {
  onClick: () => void;
}

export const HoverOverlay: React.FC<HoverOverlayProps> = ({ onClick }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
      <button
        onClick={onClick}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-nocenaPink hover:bg-nocenaPurple text-white px-4 py-2 rounded-lg font-semibold"
      >
        View
      </button>
    </div>
  );
};