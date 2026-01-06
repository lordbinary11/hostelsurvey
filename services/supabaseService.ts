import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';
import { SUPABASE_CONFIG, STORAGE_BUCKET } from '../config/supabase';
import { Survey } from '../types/survey';

// Initialize Supabase client
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Database table name
const TABLE_NAME = 'surveys';

export interface SupabaseSurvey extends Omit<Survey, 'photoPath'> {
  id?: number;
  photo_url?: string;
  uploaded_at?: string;
  local_id?: number; // Reference to local SQLite ID
}

/**
 * Upload an image to Supabase Storage
 * Uses base64 with proper conversion for React Native
 */
export const uploadImageToSupabase = async (
  localImagePath: string,
  surveyId: number
): Promise<string> => {
  try {
    // Read the image file
    const fileInfo = await FileSystem.getInfoAsync(localImagePath);
    if (!fileInfo.exists) {
      throw new Error('Image file does not exist');
    }

    // Create filename
    const filename = `survey_${surveyId}_${Date.now()}.jpg`;
    const filePath = `${filename}`;

    // Ensure the path has file:// prefix for React Native
    let fileUri = localImagePath;
    if (!fileUri.startsWith('file://') && !fileUri.startsWith('http')) {
      fileUri = `file://${fileUri}`;
    }

    // Log file info to verify size
    console.log(`File info: ${JSON.stringify(fileInfo)}`);

    // Use FormData with file URI - this is the most reliable method for React Native
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: 'image/jpeg',
    } as any);

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || SUPABASE_CONFIG.anonKey;

    // Upload using Supabase Storage REST API directly
    // This is more reliable than using the client's upload method
    const uploadUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/${STORAGE_BUCKET}/${filePath}`;
    
    console.log(`Uploading to: ${uploadUrl}`);
    console.log(`File URI: ${fileUri}, Filename: ${filename}`);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_CONFIG.anonKey,
        // Don't set Content-Type - FormData will set it with boundary
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload error response:', errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('Upload successful:', uploadResult);
    
    // Verify the upload by getting file metadata
    const { data: fileList, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', {
        search: filename,
      });
    
    if (listError) {
      console.warn('Could not verify upload:', listError);
    } else if (fileList && fileList.length > 0) {
      console.log('Verified file in storage:', fileList[0]);
      console.log('File size in storage:', fileList[0].metadata?.size || 'unknown');
    }

    // Verify upload was successful
    const { data: verifyData, error: verifyError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(filePath.split('/')[0] || '', {
        limit: 100,
        search: filename,
      });

    if (verifyError) {
      console.warn('Could not verify upload:', verifyError);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }
};

/**
 * Upload a survey to Supabase
 */
export const uploadSurveyToSupabase = async (
  survey: Survey
): Promise<SupabaseSurvey> => {
  try {
    let photoUrl: string | undefined;

    // Upload image if it exists
    if (survey.photoPath) {
      try {
        photoUrl = await uploadImageToSupabase(survey.photoPath, survey.id || Date.now());
      } catch (error) {
        console.error('Error uploading image, continuing without image:', error);
        // Continue without image if upload fails
      }
    }

    // Prepare survey data for Supabase (using snake_case for database columns)
    const supabaseSurvey = {
      hostel_name: survey.hostelName,
      date: survey.date,
      time: survey.time,
      latitude: survey.latitude,
      longitude: survey.longitude,
      number_of_floors: survey.numberOfFloors,
      number_of_rooms: survey.numberOfRooms,
      number_of_residents: survey.numberOfResidents,
      manager_name: survey.managerName,
      manager_phone: survey.managerPhone,
      has_wifi: survey.hasWifi,
      completion_status: survey.completionStatus,
      created_at: survey.createdAt || new Date().toISOString(),
      photo_url: photoUrl,
      local_id: survey.id,
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([supabaseSurvey])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Convert snake_case to camelCase for return type
    return {
      id: data.id,
      hostelName: data.hostel_name,
      date: data.date,
      time: data.time,
      latitude: data.latitude,
      longitude: data.longitude,
      numberOfFloors: data.number_of_floors,
      numberOfRooms: data.number_of_rooms,
      numberOfResidents: data.number_of_residents,
      managerName: data.manager_name,
      managerPhone: data.manager_phone,
      hasWifi: data.has_wifi,
      completionStatus: data.completion_status,
      createdAt: data.created_at,
      photo_url: data.photo_url,
      uploaded_at: data.uploaded_at,
      local_id: data.local_id,
    };
  } catch (error) {
    console.error('Error uploading survey to Supabase:', error);
    throw error;
  }
};

/**
 * Upload multiple surveys to Supabase
 */
export const uploadSurveysToSupabase = async (
  surveys: Survey[]
): Promise<{ success: number; failed: number; errors: string[] }> => {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const survey of surveys) {
    try {
      await uploadSurveyToSupabase(survey);
      success++;
    } catch (error: any) {
      failed++;
      errors.push(`${survey.hostelName}: ${error.message || 'Unknown error'}`);
      console.error(`Failed to upload survey for ${survey.hostelName}:`, error);
    }
  }

  return { success, failed, errors };
};

/**
 * Get all surveys from Supabase
 */
export const getSurveysFromSupabase = async (): Promise<SupabaseSurvey[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Convert snake_case to camelCase for TypeScript
    return (data || []).map((row: any) => {
      const mapped = {
        id: row.id,
        hostelName: row.hostel_name,
        date: row.date,
        time: row.time,
        latitude: row.latitude,
        longitude: row.longitude,
        numberOfFloors: row.number_of_floors,
        numberOfRooms: row.number_of_rooms,
        numberOfResidents: row.number_of_residents,
        managerName: row.manager_name,
        managerPhone: row.manager_phone,
        hasWifi: row.has_wifi,
        completionStatus: row.completion_status,
        createdAt: row.created_at,
        photo_url: row.photo_url || null,
        uploaded_at: row.uploaded_at,
        local_id: row.local_id,
      };
      
      // Debug log to verify photo_url is being mapped
      if (mapped.photo_url) {
        console.log(`Mapped photo_url for ${mapped.hostelName}:`, mapped.photo_url);
      }
      
      return mapped;
    });
  } catch (error) {
    console.error('Error fetching surveys from Supabase:', error);
    throw error;
  }
};

/**
 * Download image from Supabase Storage URL
 */
export const downloadImageFromSupabase = async (
  imageUrl: string
): Promise<string> => {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // For React Native, we can use response.text() with base64 encoding
    // or convert the blob to base64
    const blob = await response.blob();
    
    // Convert blob to base64 using FileReader
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64Data = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64Data);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image data'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error downloading image from Supabase:', error);
    throw error;
  }
};

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' &&
    SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
    SUPABASE_CONFIG.url.length > 0 &&
    SUPABASE_CONFIG.anonKey.length > 0
  );
};

