import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllSurveys, deleteSurvey } from '../db/database';
import { Survey } from '../types/survey';
import { exportSurveysToExcel, shareExcelFile } from '../utils/excelExport';
import { CustomAlert } from '../components/CustomAlert';
import { ImageViewer } from '../components/ImageViewer';

export default function ListScreen() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
  });
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const router = useRouter();

  const showAlert = (title: string, message: string, buttons?: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => {
    setAlertConfig({ title, message, buttons: buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }] });
    setAlertVisible(true);
  };

  const loadSurveys = async () => {
    try {
      const data = await getAllSurveys();
      setSurveys(data);
    } catch (error) {
      console.error('Error loading surveys:', error);
      showAlert('Error', 'Failed to load surveys');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSurveys();
    }, [])
  );

  const handleDelete = (id: number, hostelName: string) => {
    showAlert(
      'Delete Survey',
      `Are you sure you want to delete the survey for "${hostelName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setAlertVisible(false),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAlertVisible(false);
            try {
              await deleteSurvey(id);
              await loadSurveys();
              showAlert('Success', 'Survey deleted successfully');
            } catch (error) {
              console.error('Error deleting survey:', error);
              showAlert('Error', 'Failed to delete survey');
            }
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    if (surveys.length === 0) {
      showAlert('No Data', 'There are no surveys to export');
      return;
    }

    setIsExporting(true);

    try {
      const fileUri = await exportSurveysToExcel(surveys);
      await shareExcelFile(fileUri);
    } catch (error) {
      console.error('Error exporting surveys:', error);
      showAlert('Error', 'Failed to export surveys. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImagePress = (photoPath: string) => {
    let photoUri = photoPath;
    if (!photoUri.startsWith('http') && !photoUri.startsWith('file://')) {
      photoUri = `file://${photoUri}`;
    }
    setSelectedImageUri(photoUri);
    setImageViewerVisible(true);
  };

  const renderSurveyItem = ({ item }: { item: Survey }) => {
    let photoUri = item.photoPath;
    if (!photoUri.startsWith('http') && !photoUri.startsWith('file://')) {
      photoUri = `file://${photoUri}`;
    }

    return (
      <View style={styles.surveyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Ionicons name="business" size={20} color="#2196F3" />
            <Text style={styles.hostelName}>{item.hostelName}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id!, item.hostelName)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {item.photoPath && (
          <TouchableOpacity
            onPress={() => handleImagePress(item.photoPath)}
            activeOpacity={0.9}
            style={styles.imageContainer}
          >
            <Image
              source={{ uri: photoUri }}
              style={styles.photo}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="expand" size={24} color="#fff" />
              <Text style={styles.tapToViewText}>Tap to view</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.cardContent}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Date: </Text>
              {item.date} {item.time}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>GPS: </Text>
              {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="layers-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Floors: </Text>
              {item.numberOfFloors} | <Text style={styles.detailLabel}>Rooms: </Text>
              {item.numberOfRooms} | <Text style={styles.detailLabel}>Residents: </Text>
              {item.numberOfResidents}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Manager: </Text>
              {item.managerName} ({item.managerPhone})
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name={item.hasWifi ? 'wifi' : 'wifi-outline'} size={16} color="#666" />
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>WiFi: </Text>
              {item.hasWifi ? 'Yes' : 'No'} | <Text style={styles.detailLabel}>Status: </Text>
              {item.completionStatus}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && surveys.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading surveys...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="list" size={24} color="#2196F3" />
          <Text style={styles.headerText}>
            {surveys.length} {surveys.length === 1 ? 'Survey' : 'Surveys'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={isExporting || surveys.length === 0}
          activeOpacity={0.7}
        >
          {isExporting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.exportButtonText}>Export</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {surveys.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No surveys yet</Text>
          <Text style={styles.emptySubtext}>Start your first survey to get started</Text>
          <TouchableOpacity
            style={styles.newSurveyButton}
            onPress={() => router.push('/')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.newSurveyButtonText}>Start New Survey</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={surveys}
          renderItem={renderSurveyItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadSurveys} tintColor="#2196F3" />
          }
        />
      )}

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />

      <ImageViewer
        visible={imageViewerVisible}
        imageUri={selectedImageUri}
        onClose={() => setImageViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  exportButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  surveyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  hostelName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tapToViewText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    flex: 1,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#bbb',
    marginBottom: 32,
    textAlign: 'center',
  },
  newSurveyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newSurveyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: 0,
  },
});
