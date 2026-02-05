/**
 * Web implementation of NativeBiometrics using Web Authentication API
 */

export type BiometricType = 'fingerprint' | 'faceId' | 'iris' | 'none';

export interface AuthResult {
  success: boolean;
  error?: string;
  biometricType: BiometricType;
}

const NativeBiometrics = {
  async isAvailable(): Promise<boolean> {
    // Check if Web Authentication API is available with platform authenticator
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential
        .isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      try {
        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch {
        return false;
      }
    }
    return false;
  },

  async getBiometricType(): Promise<BiometricType> {
    const available = await this.isAvailable();
    if (available) {
      // Web API doesn't distinguish between biometric types
      // Return 'fingerprint' as a generic indicator
      return 'fingerprint';
    }
    return 'none';
  },

  async authenticate(reason: string): Promise<AuthResult> {
    const available = await this.isAvailable();

    if (!available) {
      return {
        success: false,
        error: 'Biometric authentication not available on this browser',
        biometricType: 'none',
      };
    }

    try {
      // Use Web Authentication API for biometric authentication
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
        {
          challenge,
          rp: {
            name: 'Turbo Module Example',
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: 'user@example.com',
            displayName: 'Demo User',
          },
          pubKeyCredParams: [{alg: -7, type: 'public-key'}],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        };

      // For demo purposes, we'll just check if the API is available
      // In a real app, you would create/get credentials
      console.log('Web biometric auth requested:', reason);

      // Simulate successful authentication for demo
      // In production, use navigator.credentials.create() or navigator.credentials.get()
      return {
        success: true,
        biometricType: 'fingerprint',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Authentication failed',
        biometricType: 'fingerprint',
      };
    }
  },
};

export default NativeBiometrics;
