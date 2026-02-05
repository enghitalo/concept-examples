import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export type BiometricType = 'fingerprint' | 'faceId' | 'iris' | 'none';

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometricType?: BiometricType;
}

export interface Spec extends TurboModule {
  /**
   * Check if biometric authentication is available on the device
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the type of biometric authentication available
   */
  getBiometricType(): Promise<BiometricType>;

  /**
   * Authenticate using biometrics (fingerprint, Face ID, etc.)
   */
  authenticate(reason: string): Promise<BiometricResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeBiometrics');
