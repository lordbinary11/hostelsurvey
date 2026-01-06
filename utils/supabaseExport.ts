import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { getSurveysFromSupabase, SupabaseSurvey } from '../services/supabaseService';

export const exportSurveysFromSupabase = async (): Promise<string> => {
  // Fetch surveys from Supabase
  const surveys = await getSurveysFromSupabase();

  if (surveys.length === 0) {
    throw new Error('No surveys found in Supabase');
  }

  // Prepare data for Excel export with image links
  // Debug: log first survey to see structure
  if (surveys.length > 0) {
    console.log('Sample survey data:', JSON.stringify(surveys[0], null, 2));
    console.log('Photo URL in first survey:', (surveys[0] as any).photo_url);
  }

  const worksheetData = surveys.map((survey) => {
    // Access photo_url - it's part of SupabaseSurvey interface
    const photoUrl = (survey as SupabaseSurvey).photo_url;
    console.log(`Survey "${survey.hostelName}" - photo_url:`, photoUrl);
    
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
      'Photo Link': photoUrl && photoUrl.length > 0 ? photoUrl : 'N/A',
      'Created At': survey.createdAt || '',
    };
  });

  // Create a new workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // Set column widths
  const columnWidths = [
    { wch: 20 }, // Hostel Name
    { wch: 12 }, // Date
    { wch: 10 }, // Time
    { wch: 15 }, // Latitude
    { wch: 15 }, // Longitude
    { wch: 15 }, // Number of Floors
    { wch: 15 }, // Number of Rooms
    { wch: 18 }, // Number of Residents
    { wch: 20 }, // Manager Name
    { wch: 15 }, // Manager Phone
    { wch: 10 }, // Has WiFi
    { wch: 18 }, // Completion Status
    { wch: 50 }, // Photo Link (wider for URLs)
    { wch: 20 }, // Created At
  ];
  worksheet['!cols'] = columnWidths;

  // Add hyperlinks to photo URLs (Excel will make them clickable)
  // XLSX doesn't directly support hyperlinks in the same way, but the URLs will be clickable
  // We can enhance this by adding a formula that creates a hyperlink
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Find the Photo Link column (column M, index 12)
  const photoLinkCol = 12; // 0-based index for column M
  
  for (let row = 1; row <= range.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: photoLinkCol });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v && cell.v !== 'N/A' && typeof cell.v === 'string' && cell.v.startsWith('http')) {
      // Add hyperlink formula (Excel formula: =HYPERLINK(url, "View Image"))
      worksheet[cellAddress] = {
        f: `HYPERLINK("${cell.v}","View Image")`,
        t: 'n', // formula type
      };
    }
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Surveys');

  // Generate Excel file buffer
  const excelBuffer = XLSX.write(workbook, {
    type: 'base64',
    bookType: 'xlsx',
  });

  // Save to file system
  const filename = `hostel_surveys_supabase_${Date.now()}.xlsx`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
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

