import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CustomAlert } from '../components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';

export default function StartSurveyScreen() {
  const [hostelName, setHostelName] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
  });
  const router = useRouter();

  const showAlert = (title: string, message: string, buttons?: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => {
    setAlertConfig({ title, message, buttons: buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }] });
    setAlertVisible(true);
  };

  const handleStartSurvey = () => {
    if (!hostelName.trim()) {
      showAlert('Error', 'Please enter a hostel name');
      return;
    }

    router.push({
      pathname: '/camera',
      params: { hostelName: hostelName.trim() },
    });
  };

  const handleViewSurveys = () => {
    router.push('/list');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="business" size={48} color="#2196F3" />
            </View>
            <Text style={styles.title}>Hostel Survey</Text>
            <Text style={styles.subtitle}>Capture and document hostel information</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                <Ionicons name="home-outline" size={18} color="#666" /> Hostel Name
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter hostel name"
                  placeholderTextColor="#999"
                  value={hostelName}
                  onChangeText={setHostelName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartSurvey}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Start Survey</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleViewSurveys}
              activeOpacity={0.8}
            >
              <Ionicons name="list" size={20} color="#2196F3" style={styles.buttonIcon} />
              <Text style={styles.secondaryButtonText}>View All Surveys</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginRight: 8,
  },
});

