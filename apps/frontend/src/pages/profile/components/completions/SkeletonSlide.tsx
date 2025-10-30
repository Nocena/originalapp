import React from 'react';

export const SkeletonSlide: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
      {/* Skeleton Image */}
      <div className="aspect-video bg-gray-700 rounded-t-lg"></div>

      {/* Skeleton Info Section */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          {/* Skeleton Token Amount */}
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-700 rounded"></div>
            <div className="w-8 h-4 bg-gray-700 rounded"></div>
            <div className="w-6 h-3 bg-gray-700 rounded"></div>
          </div>

          {/* Skeleton Avatar */}
          <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
        </div>

        {/* Skeleton Title */}
        <div className="w-3/4 h-4 bg-gray-700 rounded"></div>
      </div>
    </div>
  );
};