# Quick Start Guide

## Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Expo development server:**
   ```bash
   npm start
   ```

3. **Run on your device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan the QR code with Expo Go app on your physical device

## First Run

1. When you first open the app, you'll be prompted to grant permissions for:
   - Camera (to take photos)
   - Location (to capture GPS coordinates)
   - Media Library (to save photos)

2. Grant all permissions to use all features.

## Using the App

1. **Start a Survey:**
   - Enter a hostel name
   - Tap "Start Survey"

2. **Take Photo:**
   - The camera will open
   - GPS coordinates and timestamp are automatically captured
   - Tap the capture button to take a photo

3. **Fill Details:**
   - Complete all required fields
   - Tap "Save Survey"

4. **View & Export:**
   - View all surveys in the list
   - Tap "Export to Excel" to generate and share an Excel file

## Notes

- All data is stored locally on your device
- The app works completely offline
- Photos are saved to the device's file system
- Excel exports include all survey metadata (photos are referenced by path, not embedded)

## Troubleshooting

- **Camera not working:** Check that camera permissions are granted in device settings
- **Location not captured:** Ensure location services are enabled on your device
- **Photos not displaying:** Check that media library permissions are granted
- **Export fails:** Ensure the app has storage permissions

