import * as FileSystem from 'expo-file-system/legacy';
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
  
  // Don't save to gallery - only save to app's internal storage
  return newPath;
};

// Legacy function for backward compatibility - now just saves without stamping
// Actual stamping happens in the preview screen
export const stampPhoto = async (
  photoUri: string,
  survey: Partial<Survey>
): Promise<string> => {
  const savedPath = await savePhotoToDevice(photoUri);
  
  // Don't save to gallery - only save to app's internal storage
  return savedPath;
};

export const deletePhoto = async (photoPath: string): Promise<void> => {
  const fileInfo = await FileSystem.getInfoAsync(photoPath);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(photoPath, { idempotent: true });
  }
};

