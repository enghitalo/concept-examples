import React, {useState, useCallback} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';

// Import Turbo Native Modules
import NativeFingerprintAuth from './specs/NativeFingerprintAuth';
import NativeNotification from './specs/NativeNotification';

interface StatusInfo {
  biometricAvailable: boolean | null;
  biometricType: string | null;
  notificationPermission: boolean | null;
}

const App: React.FC = () => {
  const [status, setStatus] = useState<StatusInfo>({
    biometricAvailable: null,
    biometricType: null,
    notificationPermission: null,
  });
  const [loading, setLoading] = useState<string | null>(null);

  const checkBiometricAvailability = useCallback(async () => {
    setLoading('biometric');
    try {
      const isAvailable = await NativeFingerprintAuth.isAvailable();
      const biometricType = await NativeFingerprintAuth.getBiometricType();
      setStatus(prev => ({
        ...prev,
        biometricAvailable: isAvailable,
        biometricType: biometricType,
      }));
      Alert.alert(
        'Biometric Status',
        `Available: ${isAvailable}\nType: ${biometricType}`,
      );
    } catch (error) {
      Alert.alert('Error', `Failed to check biometric: ${error}`);
    } finally {
      setLoading(null);
    }
  }, []);

  const authenticateWithBiometric = useCallback(async () => {
    setLoading('authenticate');
    try {
      const success = await NativeFingerprintAuth.authenticate(
        'Please authenticate to continue',
      );
      Alert.alert(
        'Authentication Result',
        success ? 'Authentication successful!' : 'Authentication failed',
      );
    } catch (error: any) {
      Alert.alert(
        'Authentication Failed',
        error.message || 'Unknown error occurred',
      );
    } finally {
      setLoading(null);
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    setLoading('permission');
    try {
      const granted = await NativeNotification.requestPermission();
      setStatus(prev => ({
        ...prev,
        notificationPermission: granted,
      }));
      Alert.alert(
        'Permission Result',
        granted ? 'Notification permission granted!' : 'Permission denied',
      );
    } catch (error: any) {
      Alert.alert('Error', `Failed to request permission: ${error.message}`);
    } finally {
      setLoading(null);
    }
  }, []);

  const checkNotificationPermission = useCallback(async () => {
    setLoading('checkPermission');
    try {
      const hasPermission = await NativeNotification.hasPermission();
      setStatus(prev => ({
        ...prev,
        notificationPermission: hasPermission,
      }));
      Alert.alert(
        'Permission Status',
        hasPermission ? 'Permission granted' : 'Permission not granted',
      );
    } catch (error: any) {
      Alert.alert('Error', `Failed to check permission: ${error.message}`);
    } finally {
      setLoading(null);
    }
  }, []);

  const showNotification = useCallback(async () => {
    setLoading('notification');
    try {
      const identifier = `notification_${Date.now()}`;
      await NativeNotification.showNotification(
        'Hello from Turbo Module!',
        'This notification was sent using a Turbo Native Module.',
        identifier,
      );
      Alert.alert('Success', 'Notification sent! Check your notification tray.');
    } catch (error: any) {
      Alert.alert('Error', `Failed to show notification: ${error.message}`);
    } finally {
      setLoading(null);
    }
  }, []);

  const cancelAllNotifications = useCallback(async () => {
    setLoading('cancel');
    try {
      await NativeNotification.cancelAllNotifications();
      Alert.alert('Success', 'All notifications cancelled');
    } catch (error: any) {
      Alert.alert('Error', `Failed to cancel notifications: ${error.message}`);
    } finally {
      setLoading(null);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Turbo Native Module Example</Text>
          <Text style={styles.subtitle}>React Native 0.83</Text>
        </View>

        {/* Biometric Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biometric Authentication</Text>

          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Available:{' '}
              {status.biometricAvailable === null
                ? 'Not checked'
                : status.biometricAvailable
                ? 'Yes'
                : 'No'}
            </Text>
            <Text style={styles.statusText}>
              Type: {status.biometricType || 'Not checked'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading === 'biometric' && styles.buttonDisabled]}
            onPress={checkBiometricAvailability}
            disabled={loading !== null}>
            <Text style={styles.buttonText}>Check Availability</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonPrimary,
              loading === 'authenticate' && styles.buttonDisabled,
            ]}
            onPress={authenticateWithBiometric}
            disabled={loading !== null}>
            <Text style={[styles.buttonText, styles.buttonTextLight]}>
              Authenticate
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notification Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Permission:{' '}
              {status.notificationPermission === null
                ? 'Not checked'
                : status.notificationPermission
                ? 'Granted'
                : 'Denied'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading === 'permission' && styles.buttonDisabled]}
            onPress={requestNotificationPermission}
            disabled={loading !== null}>
            <Text style={styles.buttonText}>Request Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              loading === 'checkPermission' && styles.buttonDisabled,
            ]}
            onPress={checkNotificationPermission}
            disabled={loading !== null}>
            <Text style={styles.buttonText}>Check Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonPrimary,
              loading === 'notification' && styles.buttonDisabled,
            ]}
            onPress={showNotification}
            disabled={loading !== null}>
            <Text style={[styles.buttonText, styles.buttonTextLight]}>
              Show Notification
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonDanger,
              loading === 'cancel' && styles.buttonDisabled,
            ]}
            onPress={cancelAllNotifications}
            disabled={loading !== null}>
            <Text style={[styles.buttonText, styles.buttonTextLight]}>
              Cancel All
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built with Turbo Native Modules
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statusContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonDanger: {
    backgroundColor: '#dc3545',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonTextLight: {
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default App;
