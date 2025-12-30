import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { formatDate, formatTime } from '../utils/dateUtils';
import { CustomAlert } from '../components/CustomAlert';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
  });
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const hostelName = params.hostelName as string;

  const showAlert = (title: string, message: string, buttons?: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => {
    setAlertConfig({ title, message, buttons: buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }] });
    setAlertVisible(true);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#2196F3" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionMessage}>
            We need your permission to access the camera to take photos of hostels.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    if (!location) {
      showAlert('Error', 'Location not available. Please enable location services.');
      return;
    }

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      const now = new Date();
      const date = formatDate(now);
      const time = formatTime(now);

      // Navigate to preview screen to stamp the image
      router.push({
        pathname: '/preview',
        params: {
          photoUri: photo.uri,
          hostelName,
          date,
          time,
          latitude: location.coords.latitude.toString(),
          longitude: location.coords.longitude.toString(),
        },
      });
    } catch (error) {
      console.error('Error capturing photo:', error);
      showAlert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        <View style={styles.overlay}>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Ionicons name="business" size={16} color="#fff" />
              <Text style={styles.infoText}>{hostelName}</Text>
            </View>
            {location && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color="#fff" />
                <Text style={styles.infoText}>
                  {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#fff" />
              <Text style={styles.infoText}>
                {formatDate(new Date())} {formatTime(new Date())}
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraFacing}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-reverse" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={isCapturing}
              activeOpacity={0.8}
            >
              {isCapturing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#000',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 16,
    marginTop: 50,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
  },
  flipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    borderWidth: 5,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2196F3',
  },
  buttonIcon: {
    marginRight: 0,
  },
});

