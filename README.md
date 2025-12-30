# HostelSurvey

A cross-platform React Native Expo app built with TypeScript for surveying hostels/buildings. The app allows users to capture photos, GPS coordinates, and detailed information about hostels, storing everything locally using SQLite.

## Features

- 📸 **Camera Integration**: Take photos of hostels with automatic GPS and timestamp capture
- 📍 **Location Services**: Automatically capture GPS coordinates
- 💾 **Local Storage**: All data stored locally using SQLite
- 📊 **Excel Export**: Export all survey data to Excel format
- 📤 **Share Functionality**: Share exported Excel files
- 🔄 **Offline First**: Fully functional without internet connection

## Tech Stack

- **React Native** with **Expo**
- **TypeScript**
- **Expo Router** for navigation
- **SQLite** for local database
- **XLSX** for Excel file generation

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS) or Android Emulator (for Android), or Expo Go app on your physical device

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your device

## App Structure

```
├── app/                 # Expo Router screens
│   ├── _layout.tsx     # Root layout with navigation
│   ├── index.tsx       # Start Survey screen
│   ├── camera.tsx      # Camera screen
│   ├── details.tsx     # Hostel Details form
│   └── list.tsx        # Survey List screen
├── db/                 # Database utilities
│   └── database.ts     # SQLite setup and queries
├── utils/              # Utility functions
│   ├── dateUtils.ts    # Date formatting
│   ├── excelExport.ts  # Excel export functionality
│   └── photoUtils.ts   # Photo management
└── types/               # TypeScript type definitions
    └── survey.ts       # Survey data types
```

## Usage

1. **Start a Survey**: Enter a hostel name and tap "Start Survey"
2. **Take Photo**: Use the camera to capture a photo of the hostel. GPS coordinates and timestamp are automatically captured
3. **Fill Details**: Complete the hostel details form with:
   - Number of floors
   - Number of rooms
   - Number of residents
   - Manager information
   - WiFi availability
   - Completion status
4. **View Surveys**: Access all saved surveys from the list screen
5. **Export Data**: Export all surveys to Excel format and share

## Permissions

The app requires the following permissions:
- **Camera**: To take photos of hostels
- **Location**: To capture GPS coordinates
- **Media Library**: To save photos to device gallery
- **Storage**: To save survey data and export files

## Database Schema

The SQLite database stores surveys with the following fields:
- Hostel name
- Photo path
- Date and time
- GPS coordinates (latitude, longitude)
- Number of floors, rooms, and residents
- Manager name and phone
- WiFi availability
- Completion status
- Created timestamp

## Export Format

Exported Excel files include all survey metadata. Photo paths are included as references (photos are not embedded in the Excel file).

## Development

- The app uses Expo Router for file-based routing
- All screens are functional components using React Hooks
- TypeScript ensures type safety throughout the codebase
- SQLite database is initialized on app startup

## License

This project is created for data collection purposes.

