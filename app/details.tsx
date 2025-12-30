import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { insertSurvey } from '../db/database';
import { Survey } from '../types/survey';
import { CustomAlert } from '../components/CustomAlert';

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [numberOfFloors, setNumberOfFloors] = useState('');
  const [numberOfRooms, setNumberOfRooms] = useState('');
  const [numberOfResidents, setNumberOfResidents] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [hasWifi, setHasWifi] = useState(false);
  const [completionStatus, setCompletionStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
  });

  const showAlert = (title: string, message: string, buttons?: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => {
    setAlertConfig({ title, message, buttons: buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }] });
    setAlertVisible(true);
  };

  const hostelName = params.hostelName as string;
  const photoPath = params.photoPath as string;
  const date = params.date as string;
  const time = params.time as string;
  const latitude = parseFloat(params.latitude as string);
  const longitude = parseFloat(params.longitude as string);

  const handleSave = async () => {
    // Validation
    if (!numberOfFloors.trim() || isNaN(Number(numberOfFloors)) || Number(numberOfFloors) <= 0) {
      showAlert('Error', 'Please enter a valid number of floors');
      return;
    }

    if (!numberOfRooms.trim() || isNaN(Number(numberOfRooms)) || Number(numberOfRooms) <= 0) {
      showAlert('Error', 'Please enter a valid number of rooms');
      return;
    }

    if (!numberOfResidents.trim() || isNaN(Number(numberOfResidents)) || Number(numberOfResidents) < 0) {
      showAlert('Error', 'Please enter a valid number of residents');
      return;
    }

    if (!managerName.trim()) {
      showAlert('Error', 'Please enter the manager name');
      return;
    }

    if (!managerPhone.trim()) {
      showAlert('Error', 'Please enter the manager phone number');
      return;
    }

    if (!completionStatus.trim()) {
      showAlert('Error', 'Please enter the completion status');
      return;
    }

    setIsSaving(true);

    try {
      const survey: Survey = {
        hostelName,
        photoPath,
        date,
        time,
        latitude,
        longitude,
        numberOfFloors: Number(numberOfFloors),
        numberOfRooms: Number(numberOfRooms),
        numberOfResidents: Number(numberOfResidents),
        managerName: managerName.trim(),
        managerPhone: managerPhone.trim(),
        hasWifi,
        completionStatus: completionStatus.trim() as 'Completed' | 'Uncompleted',
      };

      await insertSurvey(survey);
      
      showAlert(
        'Success',
        'Survey saved successfully!',
        [
          {
            text: 'View Surveys',
            onPress: () => {
              setAlertVisible(false);
              router.replace('/list');
            },
          },
          {
            text: 'New Survey',
            onPress: () => {
              setAlertVisible(false);
              router.replace('/');
            },
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error saving survey:', error);
      showAlert('Error', 'Failed to save survey. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="business" size={20} color="#2196F3" />
              <Text style={styles.infoLabel}>Hostel Name</Text>
            </View>
            <Text style={styles.infoValue}>{hostelName}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#2196F3" />
              <Text style={styles.infoLabel}>Date & Time</Text>
            </View>
            <Text style={styles.infoValue}>{date} {time}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#2196F3" />
              <Text style={styles.infoLabel}>GPS Coordinates</Text>
            </View>
            <Text style={styles.infoValue}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Hostel Details</Text>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="layers-outline" size={18} color="#666" />
              <Text style={styles.label}>Number of Floors *</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter number of floors"
                placeholderTextColor="#999"
                value={numberOfFloors}
                onChangeText={setNumberOfFloors}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="home-outline" size={18} color="#666" />
              <Text style={styles.label}>Number of Rooms *</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter number of rooms"
                placeholderTextColor="#999"
                value={numberOfRooms}
                onChangeText={setNumberOfRooms}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="people-outline" size={18} color="#666" />
              <Text style={styles.label}>Number of Residents *</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter number of residents"
                placeholderTextColor="#999"
                value={numberOfResidents}
                onChangeText={setNumberOfResidents}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="person-outline" size={18} color="#666" />
              <Text style={styles.label}>Manager Name *</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter manager name"
                placeholderTextColor="#999"
                value={managerName}
                onChangeText={setManagerName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="call-outline" size={18} color="#666" />
              <Text style={styles.label}>Manager Phone *</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter manager phone number"
                placeholderTextColor="#999"
                value={managerPhone}
                onChangeText={setManagerPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <View style={styles.labelRow}>
                <Ionicons name="wifi-outline" size={18} color="#666" />
                <Text style={styles.label}>Existing WiFi?</Text>
              </View>
              <Switch
                value={hasWifi}
                onValueChange={setHasWifi}
                trackColor={{ false: '#d0d0d0', true: '#81b0ff' }}
                thumbColor={hasWifi ? '#2196F3' : '#f4f3f4'}
                ios_backgroundColor="#d0d0d0"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#666" />
              <Text style={styles.label}>Completion Status *</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Completed, Uncompleted"
                placeholderTextColor="#999"
                value={completionStatus}
                onChangeText={setCompletionStatus}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.saveButtonText}>Save Survey</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderRadius: 12,
    minHeight: 52,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginRight: 8,
  },
});

