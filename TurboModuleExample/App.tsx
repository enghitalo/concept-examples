/**
 * React Native Turbo Module Example
 * Demonstrates native biometric authentication and notifications
 */

import React, {useState, useEffect} from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import NativeBiometrics from './specs/NativeBiometrics';
import NativeNotifications from './specs/NativeNotifications';

type BiometricType = 'fingerprint' | 'faceId' | 'iris' | 'none';
type PermissionStatus = 'granted' | 'denied' | 'notDetermined';

function App() {
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(
    null,
  );
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [authResult, setAuthResult] = useState<string>('');
  const [notificationPermission, setNotificationPermission] =
    useState<PermissionStatus>('notDetermined');

  useEffect(() => {
    checkBiometricStatus();
    checkNotificationPermission();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const available = await NativeBiometrics.isAvailable();
      setBiometricAvailable(available);

      if (available) {
        const type = await NativeBiometrics.getBiometricType();
        setBiometricType(type);
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
      setBiometricAvailable(false);
    }
  };

  const checkNotificationPermission = async () => {
    try {
      const status = await NativeNotifications.getPermissionStatus();
      setNotificationPermission(status);
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      setAuthResult('Authenticating...');
      const result = await NativeBiometrics.authenticate(
        'Please authenticate to continue',
      );

      if (result.success) {
        setAuthResult(`Authentication successful! (${result.biometricType})`);
      } else {
        setAuthResult(`Authentication failed: ${result.error}`);
      }
    } catch (error) {
      setAuthResult(`Error: ${error}`);
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const status = await NativeNotifications.requestPermission();
      setNotificationPermission(status);

      if (status === 'granted') {
        Alert.alert('Success', 'Notification permission granted!');
      } else if (status === 'denied') {
        Alert.alert(
          'Denied',
          'Notification permission denied. Please enable in Settings.',
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleShowNotification = async () => {
    try {
      // Create channel for Android (no-op on iOS)
      if (Platform.OS === 'android') {
        await NativeNotifications.createChannel(
          'demo_channel',
          'Demo Channel',
          'Channel for demo notifications',
        );
      }

      const success = await NativeNotifications.showNotification({
        title: 'Hello from Turbo Module!',
        body: 'This notification was sent using a native Turbo Module.',
        channelId: 'demo_channel',
      });

      if (success) {
        Alert.alert('Success', 'Notification sent!');
      } else {
        Alert.alert(
          'Failed',
          'Could not send notification. Check permissions.',
        );
      }
    } catch (error) {
      console.error('Error showing notification:', error);
      Alert.alert('Error', `Failed to show notification: ${error}`);
    }
  };

  const getBiometricLabel = () => {
    switch (biometricType) {
      case 'faceId':
        return 'Face ID';
      case 'fingerprint':
        return 'Fingerprint';
      case 'iris':
        return 'Iris Scanner';
      default:
        return 'Not Available';
    }
  };

  const getPermissionLabel = () => {
    switch (notificationPermission) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      default:
        return 'Not Determined';
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Turbo Native Modules</Text>
          <Text style={styles.subtitle}>
            React Native ({Platform.OS})
          </Text>

          {/* Biometrics Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biometric Authentication</Text>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Available:</Text>
              <Text
                style={[
                  styles.statusValue,
                  {color: biometricAvailable ? '#4CAF50' : '#F44336'},
                ]}>
                {biometricAvailable === null
                  ? 'Checking...'
                  : biometricAvailable
                    ? 'Yes'
                    : 'No'}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Type:</Text>
              <Text style={styles.statusValue}>{getBiometricLabel()}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                !biometricAvailable && styles.buttonDisabled,
              ]}
              onPress={handleBiometricAuth}
              disabled={!biometricAvailable}>
              <Text style={styles.buttonText}>Authenticate</Text>
            </TouchableOpacity>

            {authResult ? (
              <Text style={styles.resultText}>{authResult}</Text>
            ) : null}
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Native Notifications</Text>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Permission:</Text>
              <Text
                style={[
                  styles.statusValue,
                  {
                    color:
                      notificationPermission === 'granted'
                        ? '#4CAF50'
                        : notificationPermission === 'denied'
                          ? '#F44336'
                          : '#FF9800',
                  },
                ]}>
                {getPermissionLabel()}
              </Text>
            </View>

            {notificationPermission !== 'granted' && (
              <TouchableOpacity
                style={styles.button}
                onPress={handleRequestNotificationPermission}>
                <Text style={styles.buttonText}>Request Permission</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonSecondary,
                notificationPermission !== 'granted' && styles.buttonDisabled,
              ]}
              onPress={handleShowNotification}
              disabled={notificationPermission !== 'granted'}>
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Send Test Notification
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>About</Text>
            <Text style={styles.infoText}>
              This example demonstrates Turbo Native Modules for biometric
              authentication and notifications.
            </Text>
            <Text style={styles.infoText}>
              - iOS: Uses LocalAuthentication and UserNotifications frameworks
            </Text>
            <Text style={styles.infoText}>
              - Android: Uses BiometricPrompt and NotificationManager APIs
            </Text>
            <Text style={styles.infoText}>
              - Web: Uses Web Authentication and Notifications APIs
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#757575',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
    borderColor: '#BDBDBD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#2196F3',
  },
  resultText: {
    marginTop: 12,
    fontSize: 14,
    color: '#424242',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    marginBottom: 4,
    lineHeight: 18,
  },
});

export default App;
