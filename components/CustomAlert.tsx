import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', onPress: () => {} }],
  onClose,
}) => {
  const handleButtonPress = (buttonOnPress: () => void) => {
    buttonOnPress();
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.message}>{message}</Text>
          </View>
          <View style={styles.footer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'destructive' && styles.destructiveButton,
                  button.style === 'cancel' && styles.cancelButton,
                  buttons.length > 1 && index < buttons.length - 1 && styles.buttonMargin,
                ]}
                onPress={() => handleButtonPress(button.onPress)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                    button.style === 'cancel' && styles.cancelButtonText,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: SCREEN_WIDTH - 80,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  body: {
    padding: 20,
    paddingVertical: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#2196F3',
  },
  buttonMargin: {
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  destructiveButton: {
    backgroundColor: '#fff',
  },
  destructiveButtonText: {
    color: '#f44336',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
  },
});

