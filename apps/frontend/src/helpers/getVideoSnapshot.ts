/**
 * Capture a snapshot from a video blob
 * @param videoBlob - The video Blob
 * @param captureTime - Time in seconds to capture the snapshot (default: 0)
 * @param type - Image type, e.g. "image/png" or "image/jpeg"
 * @param quality - Image quality (0-1) for JPEG/WebP
 * @returns Promise<Blob> - snapshot image blob
 */
export const getVideoSnapshot = async (
  videoBlob: Blob,
  captureTime = 0,
  type: string = 'image/png',
  quality = 0.92
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(videoBlob);
    const video = document.createElement('video');

    video.preload = 'metadata';
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    video.addEventListener('loadedmetadata', () => {
      // Clamp capture time to video duration
      video.currentTime = Math.min(captureTime, video.duration);
    });

    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Cannot get canvas context'));

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create snapshot blob'));
          URL.revokeObjectURL(url);
        },
        type,
        quality
      );
    });

    video.addEventListener('error', (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    });
  });
};
