import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
import { Survey } from '../types/survey';

export const exportSurveysToExcel = async (surveys: Survey[]): Promise<string> => {
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

  // Process each survey and add images
  for (let i = 0; i < surveys.length; i++) {
    const survey = surveys[i];
    const rowNumber = i + 2; // +2 because row 1 is header

    // Add data row
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

    // Embed image if available
    if (survey.photoPath) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(survey.photoPath);
        if (fileInfo.exists) {
          // Read image as base64
          const imageBase64 = await FileSystem.readAsStringAsync(survey.photoPath, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Convert base64 to buffer
          const imageBuffer = Buffer.from(imageBase64, 'base64') as any;

          // Add image to workbook
          const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'jpeg',
          });

          // Get the photo column (column M, index 13)
          const photoColNumber = 13; // Column M is the 13th column

          // Insert image in the photo column
          // Position: column M (index 12, 0-based), row i+1 (0-based)
          worksheet.addImage(imageId, {
            tl: { col: photoColNumber - 1, row: rowNumber - 1 },
            ext: { width: 150, height: 150 },
          });

          // Adjust row height to accommodate image
          worksheet.getRow(rowNumber).height = 120;
        }
      } catch (error) {
        console.error(`Error embedding image for ${survey.hostelName}:`, error);
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

  // Generate Excel file buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Convert buffer to base64
  const base64 = Buffer.from(buffer).toString('base64');

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
