# TurboModuleExample

A minimal React Native app demonstrating Turbo Native Modules with native fingerprint authentication and notifications for both iOS and Android.

## Features

- **Biometric Authentication**: Native fingerprint/Face ID authentication using:
  - iOS: LocalAuthentication framework
  - Android: BiometricPrompt API

- **Native Notifications**: Local push notifications using:
  - iOS: UserNotifications framework
  - Android: NotificationManager with NotificationChannel (Android 8.0+)

## Requirements

- Node.js >= 18
- npm >= 11.8.0
- TypeScript 5.9.3
- React Native 0.83
- Xcode 15+ (for iOS)
- Android Studio (for Android)

## Project Structure

```
TurboModuleExample/
├── specs/                              # Turbo Module TypeScript specs
│   ├── NativeFingerprintAuth.ts        # Fingerprint auth interface
│   └── NativeNotification.ts           # Notification interface
├── ios/
│   └── TurboModuleExample/
│       ├── NativeFingerprintAuth.h/mm  # iOS native implementation
│       └── NativeNotification.h/mm     # iOS native implementation
├── android/
│   └── app/src/main/java/com/turbomoduleexample/
│       ├── NativeFingerprintAuthModule.kt  # Android native implementation
│       ├── NativeNotificationModule.kt      # Android native implementation
│       ├── TurboModulePackage.kt           # Native module package
│       └── MainApplication.kt              # Application setup
├── App.tsx                             # Main React component
└── index.js                            # Entry point
```

## Installation

```bash
# Install dependencies
npm install

# iOS only: Install CocoaPods
cd ios && pod install && cd ..
```

## Running the App

### iOS

```bash
npm run ios
# or
npx react-native run-ios
```

### Android

```bash
npm run android
# or
npx react-native run-android
```

## Turbo Native Modules

This project uses the new Turbo Native Module architecture introduced in React Native 0.68+. Key features:

1. **TypeScript Specs**: Type-safe interfaces defined in `specs/` directory
2. **Native Implementations**: Platform-specific code in Kotlin (Android) and Objective-C++ (iOS)
3. **Automatic Code Generation**: React Native's codegen creates bridge code from specs

### NativeFingerprintAuth Module

```typescript
interface Spec extends TurboModule {
  isAvailable(): Promise<boolean>;
  authenticate(reason: string): Promise<boolean>;
  getBiometricType(): Promise<string>;
}
```

### NativeNotification Module

```typescript
interface Spec extends TurboModule {
  requestPermission(): Promise<boolean>;
  hasPermission(): Promise<boolean>;
  showNotification(title: string, body: string, identifier: string): Promise<boolean>;
  cancelNotification(identifier: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
}
```

## Permissions

### iOS (Info.plist)
- `NSFaceIDUsageDescription`: Required for Face ID

### Android (AndroidManifest.xml)
- `android.permission.USE_BIOMETRIC`: For biometric authentication
- `android.permission.USE_FINGERPRINT`: Legacy fingerprint support
- `android.permission.POST_NOTIFICATIONS`: For notifications (Android 13+)

## New Architecture

This project has the New Architecture enabled by default:

- **Android**: `newArchEnabled=true` in `gradle.properties`
- **iOS**: Enabled through Podfile configuration

## License

MIT
