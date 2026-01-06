import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllSurveys, deleteSurvey, clearAllSurveys } from '../db/database';
import { Survey } from '../types/survey';
import { exportSurveysFromSupabase, shareExcelFile as shareSupabaseExcelFile } from '../utils/supabaseExport';
import { uploadSurveysToSupabase, isSupabaseConfigured } from '../services/supabaseService';
import { getSurveysWithSyncStatus, getUnsyncedCount, SurveyWithSyncStatus } from '../utils/syncUtils';
import { CustomAlert } from '../components/CustomAlert';
import { ImageViewer } from '../components/ImageViewer';

export default function ListScreen() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveysWithSyncStatus, setSurveysWithSyncStatus] = useState<SurveyWithSyncStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
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
      
      // Update sync status
      if (isSupabaseConfigured()) {
        const withStatus = await getSurveysWithSyncStatus(data);
        setSurveysWithSyncStatus(withStatus);
        const count = await getUnsyncedCount(data);
        setUnsyncedCount(count);
      } else {
        setSurveysWithSyncStatus(data.map(s => ({ ...s, isSynced: false })));
        setUnsyncedCount(data.length);
      }
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

  const handleSync = async () => {
    if (surveys.length === 0) {
      showAlert('No Data', 'There are no surveys to sync');
      return;
    }

    if (!isSupabaseConfigured()) {
      showAlert(
        'Configuration Required',
        'Please configure Supabase credentials in config/supabase.ts before syncing.'
      );
      return;
    }

    // Check if surveys are out of sync
    const currentUnsyncedCount = await getUnsyncedCount(surveys);
    
    if (currentUnsyncedCount === 0) {
      showAlert('In Sync', 'All surveys are already synced with Supabase.');
      return;
    }

    // Show alert if out of sync
    showAlert(
      'Surveys Out of Sync',
      `You have ${currentUnsyncedCount} unsynced survey(s). Would you like to sync them now?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setAlertVisible(false),
        },
        // {
        //   text: 'Export from Supabase',
        //   onPress: () => {
        //     setAlertVisible(false);
        //     handleExportFromSupabase();
        //   },
        // },
        {
          text: 'Sync Now',
          onPress: async () => {
            setAlertVisible(false);
            await performSync();
          },
        },
      ]
    );
  };

  const performSync = async () => {
    setIsUploading(true);

    try {
      // Get only unsynced surveys
      const { getUnsyncedSurveys } = await import('../utils/syncUtils');
      const unsyncedSurveys = await getUnsyncedSurveys(surveys);
      
      if (unsyncedSurveys.length === 0) {
        showAlert('In Sync', 'All surveys are already synced.');
        setIsUploading(false);
        return;
      }

      const result = await uploadSurveysToSupabase(unsyncedSurveys);
      if (result.failed === 0) {
        showAlert(
          'Success',
          `All ${result.success} survey(s) synced to Supabase successfully!`
        );
        // Reload to update sync status
        await loadSurveys();
      } else {
        showAlert(
          'Partial Success',
          `${result.success} survey(s) synced, ${result.failed} failed.\n\nErrors:\n${result.errors.slice(0, 5).join('\n')}${result.errors.length > 5 ? '\n...' : ''}`
        );
        await loadSurveys();
      }
    } catch (error: any) {
      console.error('Error syncing to Supabase:', error);
      showAlert('Error', `Failed to sync surveys: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportFromSupabase = async () => {
    if (!isSupabaseConfigured()) {
      showAlert(
        'Configuration Required',
        'Please configure Supabase credentials in config/supabase.ts before exporting.'
      );
      return;
    }

    setIsExporting(true);

    try {
      const fileUri = await exportSurveysFromSupabase();
      await shareSupabaseExcelFile(fileUri);
      showAlert('Success', 'Excel file exported from Supabase with image links!');
    } catch (error: any) {
      console.error('Error exporting from Supabase:', error);
      showAlert('Error', `Failed to export from Supabase: ${error.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  

  const handleClearLocal = () => {
    if (surveys.length === 0) {
      showAlert('No Data', 'There are no local surveys to clear');
      return;
    }

    showAlert(
      'Clear Local Surveys',
      `Are you sure you want to delete all ${surveys.length} local survey(s)? This will only delete local data and will not affect Supabase. This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setAlertVisible(false),
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setAlertVisible(false);
            try {
              // Delete all photos first
              const { deletePhoto } = await import('../utils/photoUtils');
              for (const survey of surveys) {
                if (survey.photoPath) {
                  try {
                    await deletePhoto(survey.photoPath);
                  } catch (error) {
                    console.error(`Error deleting photo for ${survey.hostelName}:`, error);
                  }
                }
              }
              
              // Clear all surveys from local database
              await clearAllSurveys();
              await loadSurveys();
              showAlert('Success', 'All local surveys have been cleared successfully');
            } catch (error) {
              console.error('Error clearing surveys:', error);
              showAlert('Error', 'Failed to clear surveys. Please try again.');
            }
          },
        },
      ]
    );
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
    // Find sync status for this survey
    const surveyWithStatus = surveysWithSyncStatus.find(s => s.id === item.id);
    const isSynced = surveyWithStatus?.isSynced || false;
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
            {isSupabaseConfigured() && (
              <View style={[styles.syncBadge, isSynced ? styles.syncedBadge : styles.unsyncedBadge]}>
                <Ionicons 
                  name={isSynced ? "checkmark-circle" : "sync-outline"} 
                  size={14} 
                  color="#fff" 
                />
                <Text style={styles.syncBadgeText}>
                  {isSynced ? 'Synced' : 'Unsynced'}
                </Text>
              </View>
            )}
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
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.clearButton, surveys.length === 0 && styles.buttonDisabled]}
            onPress={handleClearLocal}
            disabled={surveys.length === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.clearButtonText}>Clear Local</Text>
          </TouchableOpacity>
          {isSupabaseConfigured() && (
            <TouchableOpacity
              style={[
                styles.syncButton,
                (isUploading || surveys.length === 0 || unsyncedCount === 0) && styles.buttonDisabled
              ]}
              onPress={handleSync}
              disabled={isUploading || surveys.length === 0 || unsyncedCount === 0}
              activeOpacity={0.7}
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : unsyncedCount === 0 ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.syncButtonText}>Surveys in Sync</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sync-outline" size={18} color="#fff" />
                  <Text style={styles.syncButtonText}>Sync ({unsyncedCount})</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <View>
            <TouchableOpacity
              style={[styles.exportButton, (isExporting || !isSupabaseConfigured() || surveys.length === 0) && styles.exportButtonDisabled]}
              onPress={handleExportFromSupabase}
              disabled={isExporting || !isSupabaseConfigured() || surveys.length === 0}
              activeOpacity={0.7}
            >
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.exportButtonText}>export</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flexDirection: 'column',
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  syncButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  exportDropdownContainer: {
    position: 'relative',
  },
  exportDropdownOverlay: {
    position: 'absolute',
    top: 120, // Below header (header is ~100px)
    right: 20,
    zIndex: 10000,
    elevation: 10,
  },
  exportDropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  exportDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exportDropdownText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  syncedBadge: {
    backgroundColor: '#4CAF50',
  },
  unsyncedBadge: {
    backgroundColor: '#FF9800',
  },
  syncBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.6,
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
