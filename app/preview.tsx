import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import { saveStampedPhoto } from '../utils/photoUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const viewRef = useRef<View>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const imageUri = params.photoUri as string;
  const hostelName = params.hostelName as string;
  const date = params.date as string;
  const time = params.time as string;
  const latitude = parseFloat(params.latitude as string);
  const longitude = parseFloat(params.longitude as string);

  useEffect(() => {
    // Auto-stamp the image when screen loads
    handleStamp();
  }, []);

  const handleStamp = async () => {
    if (!viewRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      // Wait a bit for the view to render
      await new Promise(resolve => setTimeout(resolve, 300));

      // Capture the view with text overlay
      const stampedUri = await captureRef(viewRef.current, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      });

      // Save the stamped photo
      const savedPath = await saveStampedPhoto(stampedUri);

      // Navigate to details screen with stamped photo
      router.replace({
        pathname: '/details',
        params: {
          hostelName,
          photoPath: savedPath,
          date,
          time,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        },
      });
    } catch (error) {
      console.error('Error stamping photo:', error);
      Alert.alert(
        'Error',
        'Failed to stamp photo. Using original image.',
        [
          {
            text: 'Continue',
            onPress: () => {
              router.replace({
                pathname: '/details',
                params: {
                  hostelName,
                  photoPath: imageUri,
                  date,
                  time,
                  latitude: latitude.toString(),
                  longitude: longitude.toString(),
                },
              });
            },
          },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const gpsText = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

  return (
    <View style={styles.container}>
      <View ref={viewRef} style={styles.stampContainer} collapsable={false}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        <View style={styles.overlay}>
          <View style={styles.textContainer}>
            <Text style={styles.text}>{hostelName}</Text>
            <Text style={styles.text}>
              {date} {time}
            </Text>
            <Text style={styles.text}>{gpsText}</Text>
          </View>
        </View>
      </View>

      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.processingText}>Stamping image...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampContainer: {
    width: SCREEN_WIDTH,
    aspectRatio: 4 / 3,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  processingContainer: {
    position: 'absolute',
    top: '50%',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});

