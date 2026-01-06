# Supabase Setup Guide

This guide will help you set up Supabase for your Hostel Survey app.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `hostel-survey` (or your preferred name)
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
5. Click "Create new project"

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")

## Step 3: Configure the App

1. Open `config/supabase.ts`
2. Replace the placeholder values:
   ```typescript
   export const SUPABASE_CONFIG = {
     url: 'YOUR_SUPABASE_URL', // Replace with your Project URL
     anonKey: 'YOUR_SUPABASE_ANON_KEY', // Replace with your anon key
   };
   ```

   Or use environment variables (recommended):
   
   Create a `.env` file in your project root:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## Step 4: Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Run the following SQL to create the surveys table:

```sql
-- Create surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id BIGSERIAL PRIMARY KEY,
  hostel_name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  number_of_floors INTEGER NOT NULL,
  number_of_rooms INTEGER NOT NULL,
  number_of_residents INTEGER NOT NULL,
  manager_name TEXT NOT NULL,
  manager_phone TEXT NOT NULL,
  has_wifi BOOLEAN NOT NULL,
  completion_status TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  local_id INTEGER
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_surveys_local_id ON surveys(local_id);
```

## Step 5: Create Storage Bucket for Images

1. In your Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Name: `hostel-survey-images`
4. Make it **Public** (so images can be accessed via URL)
5. Click "Create bucket"

### Set up Storage Policies (Important!)

1. Go to **Storage** → **Policies** for the `hostel-survey-images` bucket
2. Click "New Policy"
3. Create a policy for **INSERT**:
   - Policy name: `Allow public uploads`
   - Allowed operation: `INSERT`
   - Policy definition:
   ```sql
   (bucket_id = 'hostel-survey-images'::text)
   ```
   - Click "Save policy"

4. Create a policy for **SELECT** (read):
   - Policy name: `Allow public reads`
   - Allowed operation: `SELECT`
   - Policy definition:
   ```sql
   (bucket_id = 'hostel-survey-images'::text)
   ```
   - Click "Save policy"

## Step 6: Install Dependencies

Run the following command in your project directory:

```bash
npm install @supabase/supabase-js
```

## Step 7: Test the Setup

1. Start your app: `npm start`
2. Create a survey with a photo
3. Go to the list screen
4. Click "Upload to Supabase"
5. Check your Supabase dashboard:
   - **Table Editor** → `surveys` table should show your data
   - **Storage** → `hostel-survey-images` bucket should show uploaded images

## Troubleshooting

### "Configuration Required" error
- Make sure you've updated `config/supabase.ts` with your credentials
- Or set up environment variables correctly

### Upload fails
- Check that your Supabase project is active
- Verify the table and bucket names match exactly
- Check Storage policies are set correctly
- Look at the Supabase logs in the dashboard

### Images not showing in export
- Make sure the storage bucket is public
- Verify the SELECT policy allows public reads
- Check that image URLs are being generated correctly

## Security Notes

- The `anon` key is safe to use in client-side code
- For production, consider using Row Level Security (RLS) policies
- The current setup allows public uploads - you may want to restrict this in production

## Next Steps

- Set up Row Level Security (RLS) for better data protection
- Add authentication if you want user-specific surveys
- Set up automatic backups
- Configure webhooks for real-time updates

