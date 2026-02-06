# React Native Turbo Native Modules: Complete Implementation Guide

A comprehensive, step-by-step guide for building React Native applications with Turbo Native Modules. This guide covers biometric authentication and native notifications across iOS, Android, and Web platforms using React Native 0.83+ with the New Architecture.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Understanding the Architecture](#2-understanding-the-architecture)
3. [Project Structure](#3-project-structure)
4. [Prerequisites](#4-prerequisites)
5. [Step 1: Initialize the Project](#5-step-1-initialize-the-project)
6. [Step 2: Configure Codegen](#6-step-2-configure-codegen)
7. [Step 3: Create TypeScript Specifications](#7-step-3-create-typescript-specifications)
8. [Step 4: Implement iOS Native Modules](#8-step-4-implement-ios-native-modules)
9. [Step 5: Implement Android Native Modules](#9-step-5-implement-android-native-modules)
10. [Step 6: Add Web Platform Support](#10-step-6-add-web-platform-support)
11. [Step 7: Build the React Native UI](#11-step-7-build-the-react-native-ui)
12. [Step 8: Run and Test](#12-step-8-run-and-test)
13. [Troubleshooting](#13-troubleshooting)
14. [References](#14-references)

---

## 1. Introduction

### What This Guide Covers

This guide walks you through creating a production-ready React Native application that uses **Turbo Native Modules** to access platform-specific APIs:

| Module | iOS API | Android API | Web API |
|--------|---------|-------------|---------|
| **NativeBiometrics** | [LocalAuthentication](https://developer.apple.com/documentation/localauthentication) | [BiometricPrompt](https://developer.android.com/reference/androidx/biometric/BiometricPrompt) | [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) |
| **NativeNotifications** | [UserNotifications](https://developer.apple.com/documentation/usernotifications) | [NotificationManager](https://developer.android.com/reference/android/app/NotificationManager) | [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) |

### Why Turbo Native Modules?

Turbo Native Modules are React Native's modern approach to native code integration, replacing the legacy Bridge-based Native Modules. According to the [official React Native documentation](https://reactnative.dev/docs/turbo-native-modules-introduction):

| Feature | Legacy Native Modules | Turbo Native Modules |
|---------|----------------------|---------------------|
| **Initialization** | Eager (all at startup) | Lazy (on-demand) |
| **Communication** | Asynchronous JSON Bridge | Synchronous JSI calls |
| **Type Safety** | Runtime only | Compile-time via Codegen |
| **Performance** | Serialization overhead | Direct memory access |

> **Reference**: [Native Modules: Introduction](https://reactnative.dev/docs/turbo-native-modules-introduction) - Official React Native documentation explaining Turbo Native Modules concepts.

---

## 2. Understanding the Architecture

### How Turbo Native Modules Work

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Application                          │
├─────────────────────────────────────────────────────────────────┤
│  TypeScript Spec (specs/NativeBiometrics.ts)                    │
│  └─ Defines the contract: methods, parameters, return types     │
├─────────────────────────────────────────────────────────────────┤
│                         Codegen                                  │
│  └─ Generates platform-specific interfaces from TypeScript      │
├──────────────────────┬──────────────────────┬───────────────────┤
│   iOS (Objective-C++) │   Android (Kotlin)   │   Web (TypeScript)│
│   NativeBiometrics.mm │   NativeBiometricsModule.kt │ .web.ts  │
│   └─ Implements spec  │   └─ Implements spec │   └─ Fallback    │
├──────────────────────┴──────────────────────┴───────────────────┤
│                    JSI (JavaScript Interface)                    │
│  └─ Direct, synchronous calls between JS and native code        │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **TypeScript Spec**: Defines the API contract that both JavaScript and native code must follow
2. **Codegen**: React Native's code generation tool that creates type-safe native interfaces
3. **Native Implementation**: Platform-specific code that implements the generated interface
4. **JSI**: The JavaScript Interface that enables direct native calls without serialization

> **Reference**: [The New Architecture: Pillars - TurboModules](https://reactnative.dev/docs/next/the-new-architecture/pillars-turbomodules) - Deep dive into how TurboModules work internally.

---

## 3. Project Structure

Understanding the file organization is crucial for maintaining a Turbo Native Module project:

```
TurboModuleExample/
│
├── specs/                                  # ① TypeScript Specifications
│   ├── NativeBiometrics.ts                 #    Biometrics API contract
│   ├── NativeBiometrics.web.ts             #    Web platform fallback
│   ├── NativeNotifications.ts              #    Notifications API contract
│   └── NativeNotifications.web.ts          #    Web platform fallback
│
├── ios/TurboModuleExample/                 # ② iOS Native Implementation
│   ├── NativeBiometrics.h                  #    Header file (interface declaration)
│   ├── NativeBiometrics.mm                 #    Implementation (Objective-C++)
│   ├── NativeNotifications.h               #    Header file
│   ├── NativeNotifications.mm              #    Implementation
│   ├── AppDelegate.swift                   #    App entry point
│   └── Info.plist                          #    Permissions configuration
│
├── android/app/src/main/                   # ③ Android Native Implementation
│   ├── java/com/turbomoduleexample/
│   │   ├── MainActivity.kt                 #    Main activity
│   │   ├── MainApplication.kt              #    Package registration
│   │   ├── biometrics/
│   │   │   ├── NativeBiometricsModule.kt   #    Kotlin implementation
│   │   │   └── NativeBiometricsPackage.kt  #    TurboReactPackage wrapper
│   │   └── notifications/
│   │       ├── NativeNotificationsModule.kt
│   │       └── NativeNotificationsPackage.kt
│   └── AndroidManifest.xml                 #    Permissions configuration
│
├── web/                                    # ④ Web Platform Files
│   └── index.html                          #    HTML template
│
├── App.tsx                                 # ⑤ React Native Application
├── index.js                                #    Native entry point
├── index.web.js                            #    Web entry point
│
├── package.json                            # ⑥ Configuration
│   └── codegenConfig                       #    Codegen settings
├── webpack.config.js                       #    Web bundler config
├── metro.config.js                         #    Native bundler config
└── tsconfig.json                           #    TypeScript config
```

### Why This Structure?

| Directory | Purpose | Motivation |
|-----------|---------|------------|
| `specs/` | TypeScript specifications | Codegen looks here for `Native*.ts` files to generate native interfaces. Centralized location keeps specs organized. |
| `specs/*.web.ts` | Web fallbacks | Webpack's resolution order (`.web.ts` before `.ts`) automatically picks these for web builds. |
| `ios/*.mm` | Objective-C++ files | The `.mm` extension enables C++ features required for JSI integration with Objective-C. |
| `android/*Package.kt` | Package wrappers | React Native requires `TurboReactPackage` classes to register modules with the runtime. |

> **Reference**: [Using Codegen](https://reactnative.dev/docs/the-new-architecture/using-codegen) - Official guide on Codegen file structure requirements.

---

## 4. Prerequisites

### System Requirements

Before starting, ensure your development environment meets these requirements:

| Requirement | Minimum Version | Verification Command |
|-------------|-----------------|---------------------|
| **Node.js** | 20.x | `node --version` |
| **npm** | 10.x | `npm --version` |
| **Xcode** | 15.0 | `xcodebuild -version` |
| **CocoaPods** | 1.14.0 | `pod --version` |
| **Android Studio** | Hedgehog (2023.1.1) | Check in Android Studio |
| **JDK** | 17 | `java -version` |

### Environment Setup

Follow the official React Native environment setup guide for your platform:

- **macOS (iOS + Android)**: [Set up your environment](https://reactnative.dev/docs/set-up-your-environment?platform=ios)
- **Windows (Android only)**: [Set up your environment](https://reactnative.dev/docs/set-up-your-environment?platform=android&os=windows)
- **Linux (Android only)**: [Set up your environment](https://reactnative.dev/docs/set-up-your-environment?platform=android&os=linux)

### Android SDK Requirements

In Android Studio's SDK Manager, ensure these are installed:

- Android SDK Platform 34
- Android SDK Build-Tools 34.0.0
- Android NDK (Side by side) - latest version
- CMake 3.22.1+

> **Reference**: [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment) - Complete platform-specific setup instructions.

---

## 5. Step 1: Initialize the Project

### Why This Step?

We use the React Native Community CLI to create a new project with React Native 0.83+, which has the **New Architecture enabled by default**. This means Turbo Modules work out of the box without additional configuration.

### Commands

```bash
# Create a new React Native project with version 0.83
npx @react-native-community/cli@latest init TurboModuleExample --version 0.83

# Navigate into the project
cd TurboModuleExample
```

### What This Creates

The CLI generates a complete React Native project with:
- New Architecture enabled (`newArchEnabled=true` in `android/gradle.properties`)
- TypeScript configuration
- Metro bundler setup
- iOS and Android native projects

### Verify New Architecture

Check that the New Architecture is enabled:

```bash
# For Android - should show "newArchEnabled=true"
grep "newArchEnabled" android/gradle.properties

# For iOS - New Architecture is enabled by default in RN 0.83+
```

**Expected output:**
```
newArchEnabled=true
```

> **Reference**: [React Native 0.83 Release Notes](https://reactnative.dev/blog) - Details about New Architecture being the default.

---

## 6. Step 2: Configure Codegen

### Why This Step?

**Codegen** (Code Generator) is React Native's tool that reads your TypeScript specifications and generates:
- **iOS**: Objective-C++ protocols and JSI bindings
- **Android**: Java/Kotlin abstract classes

Without proper Codegen configuration, your native modules won't have the generated interfaces to implement.

### Configuration

Add the `codegenConfig` section to your `package.json`:

```json
{
  "name": "TurboModuleExample",
  "version": "0.0.1",
  "codegenConfig": {
    "name": "TurboModuleExampleSpec",
    "type": "all",
    "jsSrcsDir": "specs",
    "android": {
      "javaPackageName": "com.turbomoduleexample"
    }
  }
}
```

### Configuration Options Explained

| Field | Value | Purpose |
|-------|-------|---------|
| `name` | `"TurboModuleExampleSpec"` | Name prefix for generated files. Convention: `<AppName>Spec`. This becomes the header name on iOS (e.g., `TurboModuleExampleSpec.h`). |
| `type` | `"all"` | Generate code for both modules and components. Use `"modules"` for Turbo Modules only, `"components"` for Fabric components only. |
| `jsSrcsDir` | `"specs"` | Directory where Codegen looks for `Native*.ts` specification files. |
| `android.javaPackageName` | `"com.turbomoduleexample"` | Java/Kotlin package name for generated Android code. Must match your app's package structure. |

### When Does Codegen Run?

Codegen runs automatically during:
- **iOS**: `pod install` (generates code in `ios/build/generated/`)
- **Android**: Gradle build (generates code in `android/app/build/generated/`)

You can also run it manually:
```bash
# iOS
cd ios && pod install

# Android
cd android && ./gradlew generateCodegenArtifactsFromSchema
```

> **Reference**: [Using Codegen](https://reactnative.dev/docs/the-new-architecture/using-codegen) - Complete Codegen configuration guide.
>
> **Reference**: [Codegen Configuration in package.json](https://github.com/reactwg/react-native-new-architecture/blob/main/docs/codegen.md) - React Native Working Group documentation.

---

## 7. Step 3: Create TypeScript Specifications

### Why This Step?

The TypeScript specification is the **single source of truth** for your module's API. It defines:
- Method names and signatures
- Parameter types
- Return types
- Custom type definitions

Codegen uses this specification to generate type-safe native interfaces, ensuring your iOS and Android implementations match the JavaScript API exactly.

### Create the Specs Directory

```bash
mkdir specs
```

### Naming Convention (Critical!)

Codegen requires specific naming conventions:

| Requirement | Example | Reason |
|-------------|---------|--------|
| File name must start with `Native` | `NativeBiometrics.ts` | Codegen only processes files matching `Native*.ts` pattern |
| Interface must be named `Spec` | `export interface Spec extends TurboModule` | Codegen looks for this exact interface name |
| Must extend `TurboModule` | `interface Spec extends TurboModule` | Provides base Turbo Module functionality |
| Default export must use `TurboModuleRegistry` | `export default TurboModuleRegistry.getEnforcing<Spec>('NativeBiometrics')` | Registers the module with React Native's module system |

### Create `specs/NativeBiometrics.ts`

```typescript
/**
 * NativeBiometrics Turbo Module Specification
 *
 * This file defines the contract for biometric authentication across all platforms.
 * Codegen will generate native interfaces from this specification.
 *
 * @see https://reactnative.dev/docs/turbo-native-modules-introduction
 */
import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

/**
 * Supported biometric authentication types.
 * Maps to platform-specific implementations:
 * - 'fingerprint': Touch ID (iOS), Fingerprint (Android)
 * - 'faceId': Face ID (iOS), Face Recognition (Android)
 * - 'iris': Iris scanning (select Android devices)
 * - 'none': No biometric hardware available
 */
export type BiometricType = 'fingerprint' | 'faceId' | 'iris' | 'none';

/**
 * Result of a biometric authentication attempt.
 */
export interface BiometricResult {
  /** Whether authentication was successful */
  success: boolean;
  /** Error message if authentication failed */
  error?: string;
  /** The type of biometric used for authentication */
  biometricType?: BiometricType;
}

/**
 * Turbo Module specification for biometric authentication.
 *
 * IMPORTANT: The interface MUST be named "Spec" and extend TurboModule.
 * This is a Codegen requirement.
 */
export interface Spec extends TurboModule {
  /**
   * Check if biometric authentication is available on the device.
   *
   * @returns Promise resolving to true if biometrics are available and enrolled
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the type of biometric authentication available on the device.
   *
   * @returns Promise resolving to the BiometricType
   */
  getBiometricType(): Promise<BiometricType>;

  /**
   * Prompt the user to authenticate using biometrics.
   *
   * @param reason - Message explaining why authentication is needed (shown to user)
   * @returns Promise resolving to the authentication result
   */
  authenticate(reason: string): Promise<BiometricResult>;
}

/**
 * Export the Turbo Module.
 *
 * getEnforcing() throws an error if the module is not found.
 * Use get() instead if the module is optional.
 *
 * The string 'NativeBiometrics' MUST match the NAME constant in native implementations.
 */
export default TurboModuleRegistry.getEnforcing<Spec>('NativeBiometrics');
```

### Create `specs/NativeNotifications.ts`

```typescript
/**
 * NativeNotifications Turbo Module Specification
 *
 * Defines the contract for local notifications across all platforms.
 */
import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

/**
 * Notification permission states.
 * - 'granted': User has allowed notifications
 * - 'denied': User has explicitly denied notifications
 * - 'notDetermined': User hasn't been asked yet (iOS) or decision pending (Android 13+)
 */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'notDetermined';

/**
 * Options for displaying a notification.
 */
export interface NotificationOptions {
  /** Notification title (required) */
  title: string;
  /** Notification body text (required) */
  body: string;
  /** Android notification channel ID (optional, uses 'default' if not specified) */
  channelId?: string;
}

/**
 * Turbo Module specification for native notifications.
 */
export interface Spec extends TurboModule {
  /**
   * Request permission to show notifications.
   *
   * - iOS: Presents system permission dialog
   * - Android 13+: Presents system permission dialog
   * - Android <13: Returns 'granted' (permission not required)
   * - Web: Presents browser permission dialog
   */
  requestPermission(): Promise<NotificationPermissionStatus>;

  /**
   * Get current notification permission status without prompting.
   */
  getPermissionStatus(): Promise<NotificationPermissionStatus>;

  /**
   * Display a local notification immediately.
   *
   * @param options - Notification content and configuration
   * @returns Promise resolving to true if notification was shown successfully
   */
  showNotification(options: NotificationOptions): Promise<boolean>;

  /**
   * Create a notification channel (Android 8.0+ requirement).
   *
   * On iOS and Web, this is a no-op that returns true.
   *
   * @param channelId - Unique channel identifier
   * @param channelName - User-visible channel name
   * @param description - User-visible channel description
   */
  createChannel(
    channelId: string,
    channelName: string,
    description: string,
  ): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeNotifications');
```

### Understanding `getEnforcing` vs `get`

```typescript
// Option 1: getEnforcing - Throws error if module not found (use for required modules)
export default TurboModuleRegistry.getEnforcing<Spec>('NativeBiometrics');

// Option 2: get - Returns null if module not found (use for optional modules)
export default TurboModuleRegistry.get<Spec>('NativeBiometrics');
```

> **Reference**: [Native Modules: Introduction](https://reactnative.dev/docs/turbo-native-modules-introduction) - TypeScript spec requirements and conventions.
>
> **Reference**: [TurboModuleRegistry API](https://github.com/facebook/react-native/blob/main/packages/react-native/Libraries/TurboModule/TurboModuleRegistry.js) - Source code showing `get` vs `getEnforcing` behavior.

---

## 8. Step 4: Implement iOS Native Modules

### Why This Step?

iOS requires Objective-C++ (`.mm` files) for Turbo Modules because:
1. **JSI uses C++**: The JavaScript Interface requires C++ for direct memory access
2. **Objective-C interop**: Allows calling Apple's Objective-C frameworks (LocalAuthentication, UserNotifications)
3. **Codegen output**: Generated specs are C++ headers that Objective-C++ can import

### Understanding the iOS Implementation Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│ TypeScript Spec (NativeBiometrics.ts)                           │
│ └─ interface Spec extends TurboModule { ... }                   │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ Codegen generates
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Generated Header (TurboModuleExampleSpec.h)                     │
│ └─ @protocol NativeBiometricsSpec <RCTBridgeModule>             │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ Your code implements
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Your Implementation (NativeBiometrics.mm)                       │
│ └─ @interface NativeBiometrics () <NativeBiometricsSpec>        │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4.1: Create the Header File

Create `ios/TurboModuleExample/NativeBiometrics.h`:

```objc
/**
 * NativeBiometrics.h
 *
 * Header file declaring the NativeBiometrics Turbo Module.
 * This follows the standard Objective-C pattern of separating
 * interface declarations (.h) from implementations (.mm).
 */
#import <React/RCTBridgeModule.h>

/**
 * NativeBiometrics provides biometric authentication capabilities.
 *
 * Conforms to RCTBridgeModule for React Native integration.
 * The actual TurboModule protocol conformance is declared in the
 * implementation file to support conditional compilation.
 */
@interface NativeBiometrics : NSObject <RCTBridgeModule>
@end
```

**Why a separate header file?**
- Standard Objective-C practice for code organization
- Required for the `#import` statement in the implementation
- Enables other files to reference this class if needed

### Step 4.2: Create the Implementation File

Create `ios/TurboModuleExample/NativeBiometrics.mm`:

```objc
/**
 * NativeBiometrics.mm
 *
 * Turbo Native Module implementation for biometric authentication on iOS.
 * Uses Apple's LocalAuthentication framework for Touch ID and Face ID.
 *
 * File extension is .mm (Objective-C++) because:
 * 1. JSI requires C++ for the getTurboModule method
 * 2. Generated Codegen specs are C++ headers
 *
 * @see https://developer.apple.com/documentation/localauthentication
 */
#import "NativeBiometrics.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>

// Conditional import for New Architecture support
// RCT_NEW_ARCH_ENABLED is defined by React Native when New Architecture is active
#ifdef RCT_NEW_ARCH_ENABLED
#import <TurboModuleExampleSpec/TurboModuleExampleSpec.h>
#endif

/**
 * Class extension declaring protocol conformance.
 *
 * We use a class extension (anonymous category) to conditionally
 * conform to NativeBiometricsSpec only when New Architecture is enabled.
 * This allows the same code to work with both old and new architectures.
 */
@interface NativeBiometrics ()
#ifdef RCT_NEW_ARCH_ENABLED
<NativeBiometricsSpec>
#endif
@end

@implementation NativeBiometrics

/**
 * RCT_EXPORT_MODULE registers this class with React Native.
 *
 * Without arguments, it uses the class name "NativeBiometrics" as the module name.
 * This name MUST match the string in TurboModuleRegistry.getEnforcing('NativeBiometrics').
 *
 * You can optionally specify a different name: RCT_EXPORT_MODULE(CustomName)
 */
RCT_EXPORT_MODULE()

/**
 * Helper method to convert LABiometryType enum to our string type.
 *
 * LABiometryType is Apple's enum representing available biometric types:
 * - LABiometryTypeFaceID: Face ID (iPhone X and later)
 * - LABiometryTypeTouchID: Touch ID (older iPhones, some iPads)
 * - LABiometryTypeOpticID: Optic ID (Vision Pro)
 * - LABiometryTypeNone: No biometric hardware (handled by default case)
 */
- (NSString *)getBiometricTypeString:(LABiometryType)biometryType {
  switch (biometryType) {
    case LABiometryTypeFaceID:
      return @"faceId";
    case LABiometryTypeTouchID:
      return @"fingerprint";
    case LABiometryTypeOpticID:
      return @"iris";
    default:
      return @"none";
  }
}

/**
 * RCT_EXPORT_METHOD exposes this method to JavaScript.
 *
 * Method signature must match the TypeScript spec:
 * - TypeScript: isAvailable(): Promise<boolean>
 * - Objective-C: Promise methods receive resolve/reject blocks
 *
 * The method name (isAvailable) must match exactly (case-sensitive).
 */
RCT_EXPORT_METHOD(isAvailable:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  // LAContext is Apple's class for evaluating authentication policies
  LAContext *context = [[LAContext alloc] init];
  NSError *error = nil;

  // canEvaluatePolicy checks if biometric auth is available AND enrolled
  // LAPolicyDeviceOwnerAuthenticationWithBiometrics requires biometrics specifically
  // (as opposed to LAPolicyDeviceOwnerAuthentication which allows passcode fallback)
  BOOL canEvaluate = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
                                          error:&error];

  // Resolve with boolean - @(canEvaluate) boxes BOOL into NSNumber
  resolve(@(canEvaluate));
}

/**
 * Returns the type of biometric available on this device.
 */
RCT_EXPORT_METHOD(getBiometricType:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [[LAContext alloc] init];
  NSError *error = nil;

  if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
    // context.biometryType is populated after canEvaluatePolicy succeeds
    resolve([self getBiometricTypeString:context.biometryType]);
  } else {
    resolve(@"none");
  }
}

/**
 * Performs biometric authentication.
 *
 * @param reason - Displayed to user explaining why authentication is needed
 *                 This is REQUIRED by Apple's Human Interface Guidelines
 */
RCT_EXPORT_METHOD(authenticate:(NSString *)reason
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [[LAContext alloc] init];
  NSError *error = nil;

  // First check if biometrics are available
  if (![context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
    resolve(@{
      @"success": @NO,
      @"error": error.localizedDescription ?: @"Biometric authentication not available",
      @"biometricType": @"none"
    });
    return;
  }

  NSString *biometricType = [self getBiometricTypeString:context.biometryType];

  // evaluatePolicy presents the biometric prompt to the user
  // The reply block is called on an arbitrary background thread
  [context evaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
          localizedReason:reason
                    reply:^(BOOL success, NSError * _Nullable authError) {
    // IMPORTANT: Must dispatch to main queue before calling resolve/reject
    // React Native expects callbacks on the main thread
    dispatch_async(dispatch_get_main_queue(), ^{
      if (success) {
        resolve(@{
          @"success": @YES,
          @"biometricType": biometricType
        });
      } else {
        resolve(@{
          @"success": @NO,
          @"error": authError.localizedDescription ?: @"Authentication failed",
          @"biometricType": biometricType
        });
      }
    });
  }];
}

/**
 * getTurboModule is required for Turbo Module integration.
 *
 * This method is called by React Native to get the JSI binding for this module.
 * It returns a shared_ptr to the generated JSI spec class.
 *
 * The class name follows the pattern: Native<ModuleName>SpecJSI
 * - Our module name: NativeBiometrics
 * - Generated JSI class: NativeBiometricsSpecJSI
 */
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeBiometricsSpecJSI>(params);
}
#endif

@end
```

### Step 4.3: Configure iOS Permissions

Add required permissions to `ios/TurboModuleExample/Info.plist`:

```xml
<!-- Add inside the <dict> section -->

<!-- Required for Face ID - Apple requires an explanation string -->
<key>NSFaceIDUsageDescription</key>
<string>This app uses Face ID to securely authenticate you.</string>
```

**Why this permission is required:**
- Apple mandates a usage description for any biometric access
- The string is shown to users in the permission dialog
- App Store rejection will occur without this entry

### Step 4.4: Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

**What `pod install` does:**
1. Downloads and links required dependencies
2. Runs Codegen to generate native specs
3. Configures the Xcode project

> **Reference**: [Turbo Native Modules: iOS](https://reactnative.dev/docs/turbo-native-modules-ios) - Official iOS implementation guide.
>
> **Reference**: [LocalAuthentication Framework](https://developer.apple.com/documentation/localauthentication) - Apple's biometric authentication documentation.

---

## 9. Step 5: Implement Android Native Modules

### Why This Step?

Android Turbo Modules require Kotlin/Java implementations that:
1. **Extend generated spec classes**: Codegen creates abstract classes from your TypeScript specs
2. **Register via TurboReactPackage**: React Native's package system for module discovery
3. **Use Android APIs**: BiometricPrompt, NotificationManager, etc.

### Understanding the Android Implementation Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│ TypeScript Spec (NativeBiometrics.ts)                           │
│ └─ interface Spec extends TurboModule { ... }                   │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ Codegen generates
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Generated Abstract Class (NativeBiometricsSpec.kt)              │
│ └─ abstract class NativeBiometricsSpec(context) {               │
│        abstract fun isAvailable(promise: Promise)               │
│        abstract fun authenticate(reason: String, promise: Promise)│
│    }                                                            │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ Your code extends
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Your Implementation (NativeBiometricsModule.kt)                 │
│ └─ class NativeBiometricsModule(context) :                      │
│        NativeBiometricsSpec(context) { ... }                    │
└─────────────────────────────────────────────────────────────────┘
```

### Step 5.1: Add Android Dependencies

Edit `android/app/build.gradle` to add the BiometricPrompt dependency:

```gradle
dependencies {
    // ... existing dependencies ...

    // AndroidX Biometric library for fingerprint/face authentication
    // This provides BiometricPrompt which is the modern Android biometric API
    // @see https://developer.android.com/jetpack/androidx/releases/biometric
    implementation("androidx.biometric:biometric:1.1.0")
}
```

**Why BiometricPrompt?**
- Unified API for all biometric types (fingerprint, face, iris)
- Handles UI presentation automatically
- Backwards compatible to Android 6.0 (API 23)
- Recommended by Google over deprecated FingerprintManager

### Step 5.2: Add Android Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Biometric permission - required for BiometricPrompt -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <!-- Notification permission - required for Android 13+ (API 33+) -->
    <!-- On Android 12 and below, notifications are allowed by default -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application ...>
        <!-- ... existing content ... -->
    </application>
</manifest>
```

### Step 5.3: Create the Module Implementation

Create directory structure:
```bash
mkdir -p android/app/src/main/java/com/turbomoduleexample/biometrics
```

Create `android/app/src/main/java/com/turbomoduleexample/biometrics/NativeBiometricsModule.kt`:

```kotlin
/**
 * NativeBiometricsModule.kt
 *
 * Turbo Native Module implementation for biometric authentication on Android.
 * Uses AndroidX BiometricPrompt for fingerprint and face recognition.
 *
 * @see https://developer.android.com/training/sign-in/biometric-auth
 */
package com.turbomoduleexample.biometrics

import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableNativeMap
// Import the Codegen-generated spec class
// This is generated during build from specs/NativeBiometrics.ts
import com.turbomoduleexample.NativeBiometricsSpec

/**
 * NativeBiometricsModule extends NativeBiometricsSpec, which is generated by Codegen.
 *
 * IMPORTANT: The class MUST extend the generated spec class, not ReactContextBaseJavaModule.
 * This is a change from the legacy Native Module pattern.
 *
 * The generated spec class provides:
 * - Abstract method signatures matching your TypeScript spec
 * - Proper Turbo Module registration
 * - Type-safe method signatures
 */
class NativeBiometricsModule(reactContext: ReactApplicationContext) :
    NativeBiometricsSpec(reactContext) {

    companion object {
        /**
         * Module name constant.
         *
         * This MUST match the string in TurboModuleRegistry.getEnforcing('NativeBiometrics')
         * in your TypeScript spec. Case-sensitive!
         */
        const val NAME = "NativeBiometrics"
    }

    /**
     * Returns the module name for React Native registration.
     * Called by React Native during module discovery.
     */
    override fun getName(): String = NAME

    /**
     * Helper method to determine biometric type.
     *
     * Android's BiometricManager doesn't directly expose the biometric type,
     * so we default to "fingerprint" as it's most common.
     */
    private fun getBiometricTypeFromAuthenticators(): String {
        val biometricManager = BiometricManager.from(reactApplicationContext)

        val canAuthenticate = biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG
        )

        return if (canAuthenticate == BiometricManager.BIOMETRIC_SUCCESS) {
            "fingerprint" // Default to fingerprint as Android doesn't expose exact type
        } else {
            "none"
        }
    }

    /**
     * Check if biometric authentication is available.
     *
     * Implementation of: isAvailable(): Promise<boolean>
     *
     * @param promise - React Native promise to resolve with the result
     */
    override fun isAvailable(promise: Promise) {
        try {
            val biometricManager = BiometricManager.from(reactApplicationContext)

            // Check for both strong (fingerprint, face) and weak (less secure) biometrics
            val canAuthenticate = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.BIOMETRIC_WEAK
            )

            promise.resolve(canAuthenticate == BiometricManager.BIOMETRIC_SUCCESS)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    /**
     * Get the type of biometric available.
     *
     * Implementation of: getBiometricType(): Promise<BiometricType>
     */
    override fun getBiometricType(promise: Promise) {
        try {
            promise.resolve(getBiometricTypeFromAuthenticators())
        } catch (e: Exception) {
            promise.resolve("none")
        }
    }

    /**
     * Perform biometric authentication.
     *
     * Implementation of: authenticate(reason: string): Promise<BiometricResult>
     *
     * @param reason - Message shown to user explaining why auth is needed
     * @param promise - React Native promise to resolve with the result
     */
    override fun authenticate(reason: String, promise: Promise) {
        // Get the current activity - required for BiometricPrompt
        // reactApplicationContext.currentActivity returns the top-most activity
        val activity = reactApplicationContext.currentActivity

        if (activity == null) {
            val result = WritableNativeMap().apply {
                putBoolean("success", false)
                putString("error", "Activity not available")
                putString("biometricType", "none")
            }
            promise.resolve(result)
            return
        }

        // BiometricPrompt requires a FragmentActivity
        // React Native's ReactActivity extends AppCompatActivity which extends FragmentActivity
        if (activity !is FragmentActivity) {
            val result = WritableNativeMap().apply {
                putBoolean("success", false)
                putString("error", "Activity must be a FragmentActivity")
                putString("biometricType", "none")
            }
            promise.resolve(result)
            return
        }

        // Check if biometrics are available before showing prompt
        val biometricManager = BiometricManager.from(reactApplicationContext)
        val canAuthenticate = biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
            BiometricManager.Authenticators.BIOMETRIC_WEAK
        )

        if (canAuthenticate != BiometricManager.BIOMETRIC_SUCCESS) {
            val errorMessage = when (canAuthenticate) {
                BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE ->
                    "No biometric hardware available"
                BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE ->
                    "Biometric hardware unavailable"
                BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED ->
                    "No biometrics enrolled"
                BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED ->
                    "Security update required"
                else -> "Biometric authentication not available"
            }

            val result = WritableNativeMap().apply {
                putBoolean("success", false)
                putString("error", errorMessage)
                putString("biometricType", "none")
            }
            promise.resolve(result)
            return
        }

        val biometricType = getBiometricTypeFromAuthenticators()

        // Executor for callbacks - must run on main thread
        val executor = ContextCompat.getMainExecutor(reactApplicationContext)

        // Authentication callback handles success/failure
        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                val successResult = WritableNativeMap().apply {
                    putBoolean("success", true)
                    putString("biometricType", biometricType)
                }
                promise.resolve(successResult)
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                val errorResult = WritableNativeMap().apply {
                    putBoolean("success", false)
                    putString("error", errString.toString())
                    putString("biometricType", biometricType)
                }
                promise.resolve(errorResult)
            }

            override fun onAuthenticationFailed() {
                super.onAuthenticationFailed()
                // Don't resolve here - this is called for each failed attempt
                // The user can retry; final failure comes through onAuthenticationError
            }
        }

        // Build the prompt UI configuration
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Biometric Authentication")
            .setSubtitle(reason)
            .setNegativeButtonText("Cancel")
            .setAllowedAuthenticators(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.BIOMETRIC_WEAK
            )
            .build()

        // Show the biometric prompt - must be called on UI thread
        activity.runOnUiThread {
            try {
                val biometricPrompt = BiometricPrompt(activity, executor, callback)
                biometricPrompt.authenticate(promptInfo)
            } catch (e: Exception) {
                val errorResult = WritableNativeMap().apply {
                    putBoolean("success", false)
                    putString("error", e.message ?: "Authentication error")
                    putString("biometricType", biometricType)
                }
                promise.resolve(errorResult)
            }
        }
    }
}
```

### Step 5.4: Create the Package Wrapper

Create `android/app/src/main/java/com/turbomoduleexample/biometrics/NativeBiometricsPackage.kt`:

```kotlin
/**
 * NativeBiometricsPackage.kt
 *
 * TurboReactPackage implementation that registers NativeBiometricsModule
 * with React Native's module system.
 *
 * In the legacy architecture, packages extended ReactPackage.
 * For Turbo Modules, we extend TurboReactPackage instead.
 */
package com.turbomoduleexample.biometrics

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Package class for NativeBiometrics Turbo Module.
 *
 * TurboReactPackage is the base class for packages containing Turbo Modules.
 * It provides lazy loading capabilities - modules are only instantiated when first accessed.
 */
class NativeBiometricsPackage : TurboReactPackage() {

    /**
     * Called by React Native to get a module instance by name.
     *
     * This is where lazy loading happens - the module is only created
     * when JavaScript first requests it.
     *
     * @param name - The module name requested by JavaScript
     * @param reactContext - The React application context
     * @return The module instance, or null if name doesn't match
     */
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == NativeBiometricsModule.NAME) {
            NativeBiometricsModule(reactContext)
        } else {
            null
        }
    }

    /**
     * Provides metadata about the modules in this package.
     *
     * ReactModuleInfo tells React Native about module capabilities:
     * - Name
     * - Whether it can override existing modules
     * - Whether it needs eager initialization
     * - Whether it's a C++ module
     * - Whether it's a Turbo Module (MUST be true for Turbo Modules!)
     */
    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                NativeBiometricsModule.NAME to ReactModuleInfo(
                    NativeBiometricsModule.NAME,  // name
                    NativeBiometricsModule.NAME,  // className
                    false,                         // canOverrideExistingModule
                    false,                         // needsEagerInit
                    false,                         // isCxxModule
                    true                           // isTurboModule - MUST be true!
                )
            )
        }
    }
}
```

### Step 5.5: Register Packages in MainApplication

Edit `android/app/src/main/java/com/turbomoduleexample/MainApplication.kt`:

```kotlin
package com.turbomoduleexample

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
// Import your custom packages
import com.turbomoduleexample.biometrics.NativeBiometricsPackage
import com.turbomoduleexample.notifications.NativeNotificationsPackage

class MainApplication : Application(), ReactApplication {

    /**
     * ReactHost configuration for New Architecture.
     *
     * In React Native 0.83+, ReactHost replaces the older ReactNativeHost.
     * It manages the React Native runtime and module registration.
     */
    override val reactHost: ReactHost by lazy {
        getDefaultReactHost(
            context = applicationContext,
            packageList =
                // PackageList automatically includes all auto-linked packages
                PackageList(this).packages.apply {
                    // Add your custom Turbo Native Module packages here
                    // The .apply block allows us to modify the auto-generated list
                    add(NativeBiometricsPackage())
                    add(NativeNotificationsPackage())
                },
        )
    }

    override fun onCreate() {
        super.onCreate()
        // Initialize React Native
        loadReactNative(this)
    }
}
```

> **Reference**: [Turbo Native Modules: Android](https://reactnative.dev/docs/turbo-native-modules-android) - Official Android implementation guide.
>
> **Reference**: [BiometricPrompt Documentation](https://developer.android.com/training/sign-in/biometric-auth) - Android biometric authentication guide.
>
> **Reference**: [TurboReactPackage API](https://github.com/facebook/react-native/blob/main/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/TurboReactPackage.java) - Source code for TurboReactPackage.

---

## 10. Step 6: Add Web Platform Support

### Why This Step?

React Native for Web allows your app to run in browsers. However, Turbo Native Modules don't exist on the web, so we need **fallback implementations** that use equivalent Web APIs.

### Web Module Resolution

Webpack (our web bundler) resolves modules in this order:
1. `.web.tsx` / `.web.ts` / `.web.js`
2. `.tsx` / `.ts` / `.js`

By creating `NativeBiometrics.web.ts`, webpack automatically uses it for web builds instead of the native module.

### Step 6.1: Install Web Dependencies

```bash
npm install react-dom react-native-web

npm install --save-dev \
  webpack \
  webpack-cli \
  webpack-dev-server \
  html-webpack-plugin \
  babel-loader \
  babel-plugin-react-native-web \
  @babel/preset-env \
  @babel/preset-react \
  @babel/preset-typescript
```

**Package purposes:**
| Package | Purpose |
|---------|---------|
| `react-dom` | React's DOM renderer for web |
| `react-native-web` | Implements React Native components using web technologies |
| `webpack` | Module bundler for web builds |
| `babel-plugin-react-native-web` | Transforms React Native imports to web equivalents |

### Step 6.2: Handle React 19 Compatibility

React Native Web may have peer dependency issues with React 19. Add overrides to `package.json`:

```json
{
  "overrides": {
    "react-native-web": {
      "react": "$react",
      "react-dom": "$react-dom"
    }
  }
}
```

**Why overrides?**
- `react-native-web` may specify React 18 as a peer dependency
- `$react` syntax tells npm to use whatever React version your project uses
- This prevents "multiple React instances" errors

Then reinstall:
```bash
npm install
```

### Step 6.3: Create Web Fallback Implementations

Create `specs/NativeBiometrics.web.ts`:

```typescript
/**
 * NativeBiometrics.web.ts
 *
 * Web fallback implementation for NativeBiometrics Turbo Module.
 * Uses the Web Authentication API (WebAuthn) for biometric-like authentication.
 *
 * This file is automatically used for web builds because:
 * 1. Webpack's resolve.extensions includes '.web.ts' before '.ts'
 * 2. The import "specs/NativeBiometrics" resolves to this file on web
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API
 * @see https://webauthn.guide/
 */

export type BiometricType = 'fingerprint' | 'faceId' | 'iris' | 'none';

export interface AuthResult {
  success: boolean;
  error?: string;
  biometricType: BiometricType;
}

/**
 * Web implementation of NativeBiometrics.
 *
 * Note: This is a plain object, not a Turbo Module.
 * It implements the same interface as the native module
 * so your app code works unchanged across platforms.
 */
const NativeBiometrics = {
  /**
   * Check if platform authenticator (biometric) is available.
   *
   * Uses PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
   * which checks for:
   * - Touch ID / Face ID on macOS Safari
   * - Windows Hello on Windows
   * - Fingerprint sensors on Android Chrome
   */
  async isAvailable(): Promise<boolean> {
    // Check if Web Authentication API exists
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      try {
        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch {
        return false;
      }
    }
    return false;
  },

  /**
   * Get biometric type.
   *
   * Web Authentication API doesn't distinguish biometric types,
   * so we return 'fingerprint' as a generic indicator when available.
   */
  async getBiometricType(): Promise<BiometricType> {
    const available = await this.isAvailable();
    return available ? 'fingerprint' : 'none';
  },

  /**
   * Authenticate using platform authenticator.
   *
   * In a production app, you would:
   * 1. Call your server to get a challenge
   * 2. Use navigator.credentials.get() to authenticate
   * 3. Send the assertion to your server to verify
   *
   * This demo implementation just checks availability.
   */
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
      // In production, implement full WebAuthn flow here
      console.log('Web biometric auth requested:', reason);

      return {
        success: true,
        biometricType: 'fingerprint',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        biometricType: 'fingerprint',
      };
    }
  },
};

export default NativeBiometrics;
```

### Step 6.4: Create Webpack Configuration

Create `webpack.config.js`:

```javascript
/**
 * webpack.config.js
 *
 * Webpack configuration for building the web version of the app.
 *
 * Key configurations:
 * 1. Entry point: index.web.js (separate from native index.js)
 * 2. resolve.alias: Maps 'react-native' imports to 'react-native-web'
 * 3. resolve.extensions: Prioritizes .web.* files for web-specific code
 *
 * @see https://necolas.github.io/react-native-web/docs/setup/
 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname);

/**
 * Babel loader configuration for transpiling JS/TS files.
 */
const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'App.tsx'),
    path.resolve(appDirectory, 'specs'),
    // Add any node_modules that need transpilation
    path.resolve(appDirectory, 'node_modules/react-native-safe-area-context'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: [
        ['@babel/preset-env', { targets: { browsers: 'last 2 versions' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      plugins: [
        // Transforms StyleSheet.create, Platform.select, etc.
        'react-native-web',
      ],
    },
  },
};

module.exports = {
  entry: path.resolve(appDirectory, 'index.web.js'),

  output: {
    path: path.resolve(appDirectory, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true, // Clean dist folder before each build
  },

  resolve: {
    /**
     * Extension resolution order.
     *
     * CRITICAL: .web.* extensions must come BEFORE regular extensions
     * This enables platform-specific code splitting:
     * - import './NativeBiometrics' on web → NativeBiometrics.web.ts
     * - import './NativeBiometrics' on native → NativeBiometrics.ts
     */
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],

    /**
     * Alias 'react-native' to 'react-native-web'.
     *
     * The $ at the end means "exact match only".
     * This transforms: import { View } from 'react-native'
     * Into: import { View } from 'react-native-web'
     */
    alias: {
      'react-native$': 'react-native-web',
    },
  },

  module: {
    rules: [babelLoaderConfiguration],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(appDirectory, 'web/index.html'),
    }),
  ],

  devServer: {
    static: {
      directory: path.join(appDirectory, 'web'),
    },
    compress: true,
    port: 8080,
    hot: true,
    open: true,
  },
};
```

### Step 6.5: Create Web Entry Point

Create `index.web.js`:

```javascript
/**
 * index.web.js
 *
 * Entry point for the web build.
 *
 * This is separate from index.js (native entry point) because:
 * 1. Web uses react-dom for rendering, not AppRegistry
 * 2. Web needs different initialization logic
 * 3. Allows web-specific setup (analytics, error boundaries, etc.)
 *
 * Note: React 19 uses createRoot API exclusively.
 * The older ReactDOM.render() is deprecated.
 */
import { createRoot } from 'react-dom/client';
import App from './App';

// Get the root DOM element
const container = document.getElementById('root');

// Create React 19 root and render
const root = createRoot(container);
root.render(<App />);
```

### Step 6.6: Create HTML Template

Create `web/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Turbo Module Example</title>
  <style>
    /* Reset styles for full-screen React Native app */
    html, body, #root {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      /* Prevent scrolling - React Native handles its own scroll */
      overflow: hidden;
      /* Default font matching React Native */
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #root {
      display: flex;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <!-- Webpack will inject the bundle script here -->
</body>
</html>
```

### Step 6.7: Add npm Scripts

Update `package.json` scripts:

```json
{
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "web": "webpack serve --mode development --config webpack.config.js",
    "web:build": "webpack --mode production --config webpack.config.js",
    "lint": "eslint .",
    "test": "jest"
  }
}
```

> **Reference**: [React Native for Web - Setup](https://necolas.github.io/react-native-web/docs/setup/) - Official webpack configuration guide.
>
> **Reference**: [React Native for Web - Installation](https://necolas.github.io/react-native-web/docs/installation/) - Complete installation instructions.
>
> **Reference**: [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) - MDN documentation for WebAuthn.

---

## 11. Step 7: Build the React Native UI

### Create `App.tsx`

```typescript
/**
 * App.tsx
 *
 * Main React Native component demonstrating Turbo Native Module usage.
 * This component works across iOS, Android, and Web platforms.
 */
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

// Import Turbo Native Modules
// On native: resolves to specs/NativeBiometrics.ts (uses native implementation)
// On web: resolves to specs/NativeBiometrics.web.ts (uses web fallback)
import NativeBiometrics from './specs/NativeBiometrics';
import NativeNotifications from './specs/NativeNotifications';

function App(): React.JSX.Element {
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('unknown');
  const [authResult, setAuthResult] = useState<string>('');
  const [notificationStatus, setNotificationStatus] = useState<string>('unknown');

  useEffect(() => {
    checkBiometricStatus();
    checkNotificationStatus();
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
    }
  };

  const checkNotificationStatus = async () => {
    try {
      const status = await NativeNotifications.getPermissionStatus();
      setNotificationStatus(status);
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const handleAuthenticate = async () => {
    try {
      const result = await NativeBiometrics.authenticate(
        'Please authenticate to continue'
      );
      setAuthResult(result.success ? 'Authenticated!' : `Failed: ${result.error}`);
    } catch (error) {
      setAuthResult(`Error: ${error}`);
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const status = await NativeNotifications.requestPermission();
      setNotificationStatus(status);
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const handleShowNotification = async () => {
    try {
      await NativeNotifications.showNotification({
        title: 'Hello from Turbo Modules!',
        body: 'This notification was triggered from a Turbo Native Module.',
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Turbo Native Modules Demo</Text>
        <Text style={styles.subtitle}>Platform: {Platform.OS}</Text>

        {/* Biometrics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biometrics</Text>
          <Text style={styles.info}>
            Available: {biometricAvailable ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.info}>Type: {biometricType}</Text>
          {authResult ? <Text style={styles.result}>{authResult}</Text> : null}
          <TouchableOpacity
            style={[styles.button, !biometricAvailable && styles.buttonDisabled]}
            onPress={handleAuthenticate}
            disabled={!biometricAvailable}>
            <Text style={styles.buttonText}>Authenticate</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Text style={styles.info}>Permission: {notificationStatus}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRequestNotificationPermission}>
            <Text style={styles.buttonText}>Request Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, notificationStatus !== 'granted' && styles.buttonDisabled]}
            onPress={handleShowNotification}
            disabled={notificationStatus !== 'granted'}>
            <Text style={styles.buttonText}>Show Notification</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  result: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
```

---

## 12. Step 8: Run and Test

### iOS

```bash
# Install CocoaPods dependencies and run Codegen
cd ios && pod install && cd ..

# Run on iOS Simulator
npm run ios

# Run on specific simulator
npm run ios -- --simulator="iPhone 15 Pro"

# Run on physical device
npm run ios -- --device "Your Device Name"
```

### Android

```bash
# Clean build (recommended after adding native modules)
cd android && ./gradlew clean && cd ..

# Run on Android emulator or connected device
npm run android

# For physical devices, forward Metro bundler port
adb reverse tcp:8081 tcp:8081
```

### Web

```bash
# Start development server (opens browser automatically)
npm run web

# Build for production
npm run web:build
```

---

## 13. Troubleshooting

### "NativeBiometrics could not be found"

**Error:**
```
TurboModuleRegistry.getEnforcing(...): 'NativeBiometrics' could not be found
```

**Causes and Solutions:**

| Cause | Solution |
|-------|----------|
| Codegen hasn't run | Clean and rebuild: `cd android && ./gradlew clean && cd .. && npm run android` |
| Module name mismatch | Ensure `NAME` constant in Kotlin matches the string in `TurboModuleRegistry.getEnforcing()` |
| Package not registered | Verify package is added in `MainApplication.kt` |
| Module doesn't extend spec | Ensure module extends `NativeBiometricsSpec`, not `ReactContextBaseJavaModule` |

### "Unable to load script" on Android device

**Cause:** Physical device can't reach Metro bundler on localhost.

**Solution:**
```bash
adb reverse tcp:8081 tcp:8081
```

Or configure the device manually:
1. Shake device → "Dev Settings"
2. "Debug server host & port"
3. Enter your computer's IP: `192.168.x.x:8081`

### React 19 compatibility errors

**Error:**
```
export 'render' was not found in 'react-dom'
```

**Cause:** Code using deprecated `ReactDOM.render()` with React 19.

**Solution:** Use `createRoot` in `index.web.js`:
```javascript
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

### iOS build fails with "module not found"

**Solution:**
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

---

## 14. References

### Official React Native Documentation

| Topic | URL |
|-------|-----|
| Turbo Native Modules Introduction | https://reactnative.dev/docs/turbo-native-modules-introduction |
| Turbo Native Modules: iOS | https://reactnative.dev/docs/turbo-native-modules-ios |
| Turbo Native Modules: Android | https://reactnative.dev/docs/turbo-native-modules-android |
| Using Codegen | https://reactnative.dev/docs/the-new-architecture/using-codegen |
| New Architecture Pillars | https://reactnative.dev/docs/next/the-new-architecture/pillars-turbomodules |
| Environment Setup | https://reactnative.dev/docs/set-up-your-environment |

### React Native Working Group

| Topic | URL |
|-------|-----|
| Turbo Modules Guide | https://github.com/reactwg/react-native-new-architecture/blob/main/docs/turbo-modules.md |
| Codegen Configuration | https://github.com/reactwg/react-native-new-architecture/blob/main/docs/codegen.md |

### React Native for Web

| Topic | URL |
|-------|-----|
| Official Documentation | https://necolas.github.io/react-native-web/docs/ |
| Installation Guide | https://necolas.github.io/react-native-web/docs/installation/ |
| Setup Guide | https://necolas.github.io/react-native-web/docs/setup/ |
| GitHub Repository | https://github.com/necolas/react-native-web |

### Platform-Specific APIs

| Platform | API | Documentation |
|----------|-----|---------------|
| iOS | LocalAuthentication | https://developer.apple.com/documentation/localauthentication |
| iOS | UserNotifications | https://developer.apple.com/documentation/usernotifications |
| Android | BiometricPrompt | https://developer.android.com/reference/androidx/biometric/BiometricPrompt |
| Android | NotificationManager | https://developer.android.com/reference/android/app/NotificationManager |
| Android | Biometric Auth Guide | https://developer.android.com/training/sign-in/biometric-auth |
| Web | Web Authentication API | https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API |
| Web | Notifications API | https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API |

### Additional Resources

| Resource | URL |
|----------|-----|
| React Native GitHub | https://github.com/facebook/react-native |
| Codegen Package | https://www.npmjs.com/package/@react-native/codegen |
| React Native Releases | https://github.com/facebook/react-native/releases |

---

## Version Information

This guide was written for:

| Component | Version |
|-----------|---------|
| React Native | 0.83.1 |
| React | 19.x |
| New Architecture | Enabled by default |
| Codegen | Built into React Native CLI |

---

*Last updated: February 2026*
