import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { Survey } from '../types/survey';

export const exportLocalSurveysAsZip = async (surveys: Survey[]): Promise<string> => {
  // Create Excel file (without images)
  const worksheetData = surveys.map((survey) => ({
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
    'Photo Path': survey.photoPath || 'N/A',
    'Created At': survey.createdAt || '',
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  const columnWidths = [
    { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 15 },
    { wch: 10 }, { wch: 18 }, { wch: 30 }, { wch: 20 },
  ];
  worksheet['!cols'] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Surveys');

  // Generate Excel as base64
  const excelBase64 = XLSX.write(workbook, {
    type: 'base64',
    bookType: 'xlsx',
  });

  // Create ZIP file
  const zip = new JSZip();

  // Add Excel file to zip
  zip.file('surveys.xlsx', excelBase64, { base64: true });

  // Add images folder
  const imagesFolder = zip.folder('images');
  if (imagesFolder) {
    for (const survey of surveys) {
      if (survey.photoPath) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(survey.photoPath);
          if (fileInfo.exists) {
            // Read image as base64
            const imageBase64 = await FileSystem.readAsStringAsync(survey.photoPath, {
              encoding: FileSystem.EncodingType.Base64,
            });

            // Extract filename from path
            const filename = survey.photoPath.split('/').pop() || `survey_${survey.id}.jpg`;
            imagesFolder.file(filename, imageBase64, { base64: true });
          }
        } catch (error) {
          console.error(`Error adding image for ${survey.hostelName}:`, error);
        }
      }
    }
  }

  // Generate ZIP file as base64
  const zipBase64 = await zip.generateAsync({ type: 'base64' });

  // Save ZIP to file system
  const filename = `hostel_surveys_${Date.now()}.zip`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, zipBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
};

export const shareZipFile = async (fileUri: string): Promise<void> => {
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

