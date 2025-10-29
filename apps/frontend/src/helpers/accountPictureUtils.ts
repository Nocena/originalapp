import imageCompression from 'browser-image-compression';
import { uploadFileToIPFS } from './uploadToIPFS';

export const readFile = (file: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string), false);
    reader.readAsDataURL(file);
  });
};

export const uploadCroppedImage = async (image: HTMLCanvasElement): Promise<string> => {
  const blob = await new Promise((resolve) => image.toBlob(resolve));
  const file = new File([blob as Blob], 'cropped_image.png', {
    type: (blob as Blob).type,
  });
  const cleanedFile = await imageCompression(file, {
    exifOrientation: 1,
    maxSizeMB: 6,
    maxWidthOrHeight: 3000,
    useWebWorker: true,
  });
  const attachment = await uploadFileToIPFS(cleanedFile);
  const decentralizedUrl = attachment.uri;
  if (!decentralizedUrl) {
    throw new Error('uploadFileToIPFS failed');
  }

  return decentralizedUrl;
};

export const uploadImageFile = async (file: File): Promise<string> => {
  const cleanedFile = await imageCompression(file, {
    exifOrientation: 1,
    maxSizeMB: 6,
    maxWidthOrHeight: 3000,
    useWebWorker: true,
  });
  const attachment = await uploadFileToIPFS(cleanedFile);
  const decentralizedUrl = attachment.uri;
  if (!decentralizedUrl) {
    throw new Error('uploadFileToIPFS failed');
  }

  return decentralizedUrl;
};

export const uploadBlob = async (blob: Blob, type: 'photo' | 'video'): Promise<string> => {
  if (type === 'photo') {
    const file = new File([blob as Blob], 'upload_image.png', {
      type: (blob as Blob).type,
    });
    const cleanedFile = await imageCompression(file, {
      exifOrientation: 1,
      maxSizeMB: 6,
      maxWidthOrHeight: 3000,
      useWebWorker: true,
    });
    const attachment = await uploadFileToIPFS(cleanedFile);
    const decentralizedUrl = attachment.uri;
    if (!decentralizedUrl) {
      throw new Error('uploadFileToIPFS failed');
    }

    return decentralizedUrl;
  } else {
    const file = new File([blob as Blob], 'upload_video.webm', {
      type: (blob as Blob).type,
    });
    const attachment = await uploadFileToIPFS(file);
    const decentralizedUrl = attachment.uri;
    if (!decentralizedUrl) {
      throw new Error('uploadFileToIPFS failed');
    }

    return decentralizedUrl;
  }
};
