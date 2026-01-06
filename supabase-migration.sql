-- Supabase Migration SQL
-- Run this in your Supabase SQL Editor

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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_surveys_local_id ON surveys(local_id);
CREATE INDEX IF NOT EXISTS idx_surveys_hostel_name ON surveys(hostel_name);

-- Enable Row Level Security (optional, for better security)
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for now)
-- In production, you may want to restrict this based on user authentication
CREATE POLICY "Allow all operations on surveys" ON surveys
  FOR ALL
  USING (true)
  WITH CHECK (true);

