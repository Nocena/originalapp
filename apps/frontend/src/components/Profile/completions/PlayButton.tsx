import React from 'react';
import { Play } from 'lucide-react';

export const PlayButton: React.FC = () => {
  return (
    <div className="absolute bottom-4 right-4">
      <button className="bg-nocenaPink hover:bg-nocenaPurple text-white p-2 rounded-full transition-colors duration-200 opacity-80 hover:opacity-100">
        <Play className="w-4 h-4 fill-current" />
      </button>
    </div>
  );
};
