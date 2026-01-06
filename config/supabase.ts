// Supabase configuration
// Replace these with your actual Supabase project credentials
// You can find these in your Supabase project settings > API

export const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://djjbmodzjqwozozzuckk.supabase.co',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqamJtb2R6anF3b3pvenp1Y2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMzYxNjQsImV4cCI6MjA4MjgxMjE2NH0.MR1RyoAJxSrAT769Ii2Eh_1Q1tNaWvywtyRbpMBK9Qg',
};

// Storage bucket name for images
export const STORAGE_BUCKET = 'hostel-survey-images';

