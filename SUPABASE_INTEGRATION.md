# Supabase Integration Summary

This app now supports uploading survey data and images to Supabase, and exporting Excel files with embedded images from Supabase.

## Architecture

1. **Local Storage (SQLite + File System)**
   - Surveys are saved locally in SQLite database
   - Images are stored in the app's file system
   - Works offline

2. **Supabase Cloud Storage**
   - Upload surveys and images to Supabase
   - Images stored in Supabase Storage bucket
   - Data stored in Supabase PostgreSQL database

3. **Excel Export with Images**
   - Export from local data (no images) - uses `xlsx` library
   - Export from Supabase (with images) - uses `exceljs` library
   - Supabase export downloads images and embeds them in Excel

## New Files Created

- `config/supabase.ts` - Supabase configuration
- `services/supabaseService.ts` - Supabase API service
- `utils/supabaseExport.ts` - Excel export from Supabase
- `supabase-setup.md` - Detailed setup instructions
- `supabase-migration.sql` - Database schema

## Features Added

### 1. Upload to Supabase
- Button: "Upload to Supabase" (orange button)
- Uploads all local surveys to Supabase
- Uploads images to Supabase Storage
- Shows success/failure summary

### 2. Export from Supabase
- Button: "Export from Supabase" (green button with cloud icon)
- Fetches surveys from Supabase
- Downloads images from Supabase Storage
- Generates Excel file with embedded images
- Uses `exceljs` library (works better for images)

### 3. Export Local
- Button: "Export Local" (green button)
- Exports local SQLite data
- No images (just photo paths)
- Uses `xlsx` library (more reliable in React Native)

## Setup Steps

1. **Install dependencies:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create Supabase project:**
   - Go to https://supabase.com
   - Create a new project
   - Get your URL and anon key

3. **Configure the app:**
   - Edit `config/supabase.ts`
   - Add your Supabase URL and anon key

4. **Set up database:**
   - Run the SQL in `supabase-migration.sql` in Supabase SQL Editor

5. **Set up storage:**
   - Create a bucket named `hostel-survey-images`
   - Make it public
   - Set up storage policies (see `supabase-setup.md`)

## Usage Flow

1. **Create surveys locally** - Works offline
2. **Upload to Supabase** - Syncs data to cloud
3. **Export from Supabase** - Generates Excel with images

## Benefits

- ✅ Images embedded in Excel (from Supabase export)
- ✅ Cloud backup of data
- ✅ Works offline (local storage)
- ✅ No stack overflow issues (Supabase export uses server-side images)
- ✅ Scalable (Supabase handles large datasets)

## Notes

- Local export is faster but doesn't include images
- Supabase export includes images but requires internet
- Images are stored in Supabase Storage (public URLs)
- Data is synced to Supabase but local data remains

