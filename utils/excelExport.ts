import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
import { Survey } from '../types/survey';

// Helper function to delay execution (prevents stack overflow)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const exportSurveysToExcel = async (surveys: Survey[]): Promise<string> => {
  try {
    return await exportWithExcelJS(surveys);
  } catch (error) {
    console.error('ExcelJS export failed:', error);
    // If ExcelJS fails, throw error with helpful message
    throw new Error('Failed to export with embedded images. Please try again or contact support.');
  }
};

const exportWithExcelJS = async (surveys: Survey[]): Promise<string> => {
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Surveys');

  // Set column headers
  worksheet.columns = [
    { header: 'Hostel Name', key: 'hostelName', width: 20 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Latitude', key: 'latitude', width: 15 },
    { header: 'Longitude', key: 'longitude', width: 15 },
    { header: 'Number of Floors', key: 'numberOfFloors', width: 15 },
    { header: 'Number of Rooms', key: 'numberOfRooms', width: 15 },
    { header: 'Number of Residents', key: 'numberOfResidents', width: 18 },
    { header: 'Manager Name', key: 'managerName', width: 20 },
    { header: 'Manager Phone', key: 'managerPhone', width: 15 },
    { header: 'Has WiFi', key: 'hasWifi', width: 10 },
    { header: 'Completion Status', key: 'completionStatus', width: 18 },
    { header: 'Photo', key: 'photo', width: 20 },
    { header: 'Created At', key: 'createdAt', width: 20 },
  ];

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2196F3' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Process each survey sequentially to avoid stack overflow
  for (let i = 0; i < surveys.length; i++) {
    const survey = surveys[i];
    const rowNumber = i + 2; // +2 because row 1 is header

    // Add data row first
    worksheet.addRow({
      hostelName: survey.hostelName,
      date: survey.date,
      time: survey.time,
      latitude: survey.latitude,
      longitude: survey.longitude,
      numberOfFloors: survey.numberOfFloors,
      numberOfRooms: survey.numberOfRooms,
      numberOfResidents: survey.numberOfResidents,
      managerName: survey.managerName,
      managerPhone: survey.managerPhone,
      hasWifi: survey.hasWifi ? 'Yes' : 'No',
      completionStatus: survey.completionStatus,
      photo: survey.photoPath ? '' : 'N/A',
      createdAt: survey.createdAt || '',
    });

    // Process image separately with delay to prevent stack overflow
    if (survey.photoPath) {
      try {
        // Add small delay between image processing
        if (i > 0) {
          await delay(50); // 50ms delay between images
        }

        const fileInfo = await FileSystem.getInfoAsync(survey.photoPath);
        if (fileInfo.exists) {
          // Read image as base64
          const imageBase64 = await FileSystem.readAsStringAsync(survey.photoPath, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Convert base64 to buffer - use Uint8Array instead of Buffer if needed
          let imageBuffer: Uint8Array;
          try {
            // Try using Buffer first
            imageBuffer = Buffer.from(imageBase64, 'base64') as any;
          } catch (bufferError) {
            // Fallback: convert base64 string to Uint8Array manually
            const binaryString = atob(imageBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              bytes[j] = binaryString.charCodeAt(j);
            }
            imageBuffer = bytes;
          }

          // Add image to workbook
          const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'jpeg',
          });

          // Get the photo column (column M, index 13)
          const photoColNumber = 13;

          // Insert image in the photo column
          worksheet.addImage(imageId, {
            tl: { col: photoColNumber - 1, row: rowNumber - 1 },
            ext: { width: 150, height: 150 },
          });

          // Adjust row height to accommodate image
          worksheet.getRow(rowNumber).height = 120;
        }
      } catch (imageError) {
        console.error(`Error embedding image for ${survey.hostelName}:`, imageError);
        // Continue without image if embedding fails
      }
    }
  }

  // Auto-fit columns (except photo column which has images)
  worksheet.columns.forEach((column, index) => {
    if (index !== 12) { // Not the photo column
      const maxLength = Math.max(
        column.header?.length || 10,
        ...surveys.map((s) => {
          const value = (s as any)[column.key || ''];
          return value ? String(value).length : 0;
        })
      );
      column.width = Math.max(maxLength + 2, 10);
    }
  });

  // Generate Excel file buffer with timeout protection
  let buffer: ArrayBuffer;
  try {
    // Use Promise.race to add timeout protection
    const writePromise = workbook.xlsx.writeBuffer();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Excel generation timeout')), 30000)
    );
    
    buffer = await Promise.race([writePromise, timeoutPromise]);
  } catch (writeError) {
    console.error('Error writing Excel buffer:', writeError);
    throw new Error('Failed to generate Excel file. The file may be too large or contain too many images.');
  }

  // Convert buffer to base64
  let base64: string;
  try {
    if (buffer instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(buffer);
      base64 = Buffer.from(uint8Array).toString('base64');
    } else {
      base64 = Buffer.from(buffer as any).toString('base64');
    }
  } catch (base64Error) {
    console.error('Error converting buffer to base64:', base64Error);
    throw new Error('Failed to process Excel file data.');
  }

  // Save to file system
  const filename = `hostel_surveys_${Date.now()}.xlsx`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
};

export const shareExcelFile = async (fileUri: string): Promise<void> => {
  const isAvailable = await Sharing.isAvailableAsync();
  
  if (isAvailable) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Share Hostel Survey Data',
      UTI: 'com.microsoft.excel.xlsx',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
};
