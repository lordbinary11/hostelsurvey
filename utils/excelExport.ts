import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { Survey } from '../types/survey';

export const exportSurveysToExcel = async (surveys: Survey[]): Promise<string> => {
  const zip = new JSZip();
  const imagesFolder = zip.folder('images');
  
  // Prepare data for Excel with relative image paths
  const excelData = await Promise.all(
    surveys.map(async (survey, index) => {
      let imagePath = 'N/A';
      
      // Copy image to zip with a clean filename
      if (survey.photoPath) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(survey.photoPath);
          if (fileInfo.exists) {
            // Read image as base64
            const imageBase64 = await FileSystem.readAsStringAsync(survey.photoPath, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            // Create a clean filename based on hostel name and index
            const cleanHostelName = survey.hostelName.replace(/[^a-zA-Z0-9]/g, '_');
            const imageFilename = `${cleanHostelName}_${index + 1}.jpg`;
            imagePath = `images/${imageFilename}`;
            
            // Add image to zip
            if (imagesFolder) {
              imagesFolder.file(imageFilename, imageBase64, { base64: true });
            }
          }
        } catch (error) {
          console.error(`Error processing image for ${survey.hostelName}:`, error);
          imagePath = `Error loading image: ${survey.photoPath}`;
        }
      }
      
      return {
        'Hostel Name': survey.hostelName,
        'Date': survey.date,
        'Time': survey.time,
        'Latitude': survey.latitude,
        'Longitude': survey.longitude,
        'Number of Floors': survey.numberOfFloors,
        'Number of Rooms': survey.numberOfRooms,
        'Number of Residents': survey.numberOfResidents,
        'Manager Name': survey.managerName,
        'Manager Phone': survey.managerPhone,
        'Has WiFi': survey.hasWifi ? 'Yes' : 'No',
        'Completion Status': survey.completionStatus,
        'Photo': imagePath,
        'Photo Location': 'See images folder in this ZIP file',
        'Created At': survey.createdAt || '',
      };
    })
  );

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Surveys');

  // Generate Excel file buffer
  const excelBuffer = XLSX.write(workbook, {
    type: 'base64',
    bookType: 'xlsx',
  });

  // Add Excel file to zip
  zip.file('hostel_surveys.xlsx', excelBuffer, { base64: true });

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // Save ZIP to file system
  const filename = `hostel_surveys_${Date.now()}.zip`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  
  await FileSystem.writeAsStringAsync(fileUri, zipBlob, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
};

export const shareExcelFile = async (fileUri: string): Promise<void> => {
  const isAvailable = await Sharing.isAvailableAsync();
  
  if (isAvailable) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/zip',
      dialogTitle: 'Share Hostel Survey Data',
      UTI: 'public.zip-archive',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
};

