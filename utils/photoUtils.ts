import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Survey } from '../types/survey';

const photosDir = `${FileSystem.documentDirectory}photos/`;

export const ensurePhotosDirectory = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(photosDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
  }
};

export const savePhotoToDevice = async (uri: string): Promise<string> => {
  await ensurePhotosDirectory();
  
  const filename = `hostel_${Date.now()}.jpg`;
  const newPath = `${photosDir}${filename}`;
  
  await FileSystem.copyAsync({
    from: uri,
    to: newPath,
  });
  
  return newPath;
};

// This function will be called from the preview screen after stamping
export const saveStampedPhoto = async (stampedUri: string): Promise<string> => {
  await ensurePhotosDirectory();
  
  const filename = `hostel_stamped_${Date.now()}.jpg`;
  const newPath = `${photosDir}${filename}`;
  
  await FileSystem.copyAsync({
    from: stampedUri,
    to: newPath,
  });
  
  // Request permission to save to media library
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status === 'granted') {
    await MediaLibrary.createAssetAsync(newPath);
  }
  
  return newPath;
};

// Legacy function for backward compatibility - now just saves without stamping
// Actual stamping happens in the preview screen
export const stampPhoto = async (
  photoUri: string,
  survey: Partial<Survey>
): Promise<string> => {
  const savedPath = await savePhotoToDevice(photoUri);
  
  // Request permission to save to media library
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status === 'granted') {
    await MediaLibrary.createAssetAsync(savedPath);
  }
  
  return savedPath;
};

export const deletePhoto = async (photoPath: string): Promise<void> => {
  const fileInfo = await FileSystem.getInfoAsync(photoPath);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(photoPath, { idempotent: true });
  }
};

