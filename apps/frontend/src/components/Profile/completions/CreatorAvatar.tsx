import React from 'react';

interface CreatorAvatarProps {
  src: string;
  alt: string;
}

export const CreatorAvatar: React.FC<CreatorAvatarProps> = ({ src, alt }) => {
  return (
    <div className="relative">
      {/* Decorative Border Ring */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-white via-nocenaPink to-nocenaBlue p-0.5">
        <div className="w-full h-full rounded-full bg-gray-800 p-0.5">
          <img src={src} alt={alt} className="w-full h-full rounded-full object-cover" />
        </div>
      </div>
    </div>
  );
};
