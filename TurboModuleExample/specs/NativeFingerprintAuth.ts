import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Check if biometric authentication is available on the device
   */
  isAvailable(): Promise<boolean>;

  /**
   * Authenticate user using biometrics (fingerprint/face)
   * @param reason - The reason shown to user for authentication
   * @returns Promise that resolves to true if successful, rejects on failure
   */
  authenticate(reason: string): Promise<boolean>;

  /**
   * Get the type of biometric available (fingerprint, face, none)
   */
  getBiometricType(): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeFingerprintAuth');
