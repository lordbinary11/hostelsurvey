import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '../db/database';

export default function RootLayout() {
  useEffect(() => {
    // Initialize database on app start
    initDatabase().catch(console.error);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
        headerBackTitle: '',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Hostel Survey',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="camera"
        options={{
          title: 'Take Photo',

        }}
      />
      <Stack.Screen
        name="preview"
        options={{
          title: 'Preview',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          title: 'Hostel Details',
        }}
      />
      <Stack.Screen
        name="list"
        options={{
          title: 'Survey List',
        }}
      />
    </Stack>
  );
}

