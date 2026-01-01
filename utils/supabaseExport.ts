import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
import { getSurveysFromSupabase, downloadImageFromSupabase, SupabaseSurvey } from '../services/supabaseService';

export const exportSurveysFromSupabase = async (): Promise<string> => {
  // Fetch surveys from Supabase
  const surveys = await getSurveysFromSupabase();

  if (surveys.length === 0) {
    throw new Error('No surveys found in Supabase');
  }

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
  const MAX_IMAGES = 100; // Limit to prevent issues
  let imageCount = 0;

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
      photo: survey.photo_url ? (imageCount < MAX_IMAGES ? 'Yes' : 'Skipped') : 'N/A',
      createdAt: survey.createdAt || survey.created_at || '',
    });

    // Embed image if available and under limit
    if (survey.photo_url && imageCount < MAX_IMAGES) {
      try {
        // Download image from Supabase
        const imageBase64 = await downloadImageFromSupabase(survey.photo_url);

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(imageBase64, 'base64') as any;

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

        imageCount++;

        // Add a small delay every 10 images to prevent issues
        if (imageCount % 10 === 0) {
          await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));
        }
      } catch (error) {
        console.error(`Error embedding image for ${survey.hostelName}:`, error);
        // Continue without image
      }
    }
  }

  // Auto-fit columns (except photo column which has images)
  worksheet.columns.forEach((column, index) => {
    if (index !== 12) {
      // Not the photo column
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
  let base64: string;
  if (buffer instanceof ArrayBuffer) {
    const uint8Array = new Uint8Array(buffer);
    base64 = Buffer.from(uint8Array).toString('base64');
  } else {
    base64 = Buffer.from(buffer as any).toString('base64');
  }

  // Save to file system
  const filename = `hostel_surveys_supabase_${Date.now()}.xlsx`;
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

