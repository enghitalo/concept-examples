# React Native Turbo Native Modules Guide

A comprehensive guide for creating React Native applications with Turbo Native Modules, featuring biometric authentication and native notifications across iOS, Android, and Web platforms.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Step-by-Step Implementation](#step-by-step-implementation)
  - [1. Initialize the Project](#1-initialize-the-project)
  - [2. Configure Codegen](#2-configure-codegen)
  - [3. Create TypeScript Specs](#3-create-typescript-specs)
  - [4. Implement iOS Native Modules](#4-implement-ios-native-modules)
  - [5. Implement Android Native Modules](#5-implement-android-native-modules)
  - [6. Add Web Support](#6-add-web-support)
  - [7. Create the React Native App](#7-create-the-react-native-app)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [Official Documentation References](#official-documentation-references)

---

## Overview

### What are Turbo Native Modules?

Turbo Native Modules are the modern way to create native modules in React Native's New Architecture. They offer several advantages over the legacy Bridge-based modules:

- **Strongly typed interfaces** consistent across platforms
- **Lazy loading** - modules are initialized only when needed, improving app startup time
- **JSI (JavaScript Interface)** - direct, synchronous, and memory-efficient calls between JavaScript and native code
- **Codegen** - automatically generates platform-specific interfaces from TypeScript/Flow specifications

### What This Example Demonstrates

This project implements two Turbo Native Modules:

1. **NativeBiometrics** - Native fingerprint/Face ID authentication
   - iOS: LocalAuthentication framework
   - Android: BiometricPrompt API
   - Web: Web Authentication API

2. **NativeNotifications** - Native local notifications
   - iOS: UserNotifications framework
   - Android: NotificationManager API
   - Web: Web Notifications API

---

## Project Structure

```
TurboModuleExample/
├── specs/                              # TypeScript specifications (Codegen input)
│   ├── NativeBiometrics.ts             # Biometrics module spec
│   ├── NativeBiometrics.web.ts         # Web fallback implementation
│   ├── NativeNotifications.ts          # Notifications module spec
│   └── NativeNotifications.web.ts      # Web fallback implementation
│
├── ios/                                # iOS native code
│   └── TurboModuleExample/
│       ├── AppDelegate.swift           # App entry point
│       ├── NativeBiometrics.mm         # Biometrics Objective-C++ implementation
│       ├── NativeBiometrics.h          # Header file
│       ├── NativeNotifications.mm      # Notifications implementation
│       ├── NativeNotifications.h       # Header file
│       └── Info.plist                  # iOS configuration (permissions)
│
├── android/                            # Android native code
│   └── app/src/main/java/com/turbomoduleexample/
│       ├── MainActivity.kt             # Main activity
│       ├── MainApplication.kt          # Application class (registers packages)
│       ├── biometrics/
│       │   ├── NativeBiometricsModule.kt    # Kotlin implementation
│       │   └── NativeBiometricsPackage.kt   # Package registration
│       └── notifications/
│           ├── NativeNotificationsModule.kt # Kotlin implementation
│           └── NativeNotificationsPackage.kt# Package registration
│
├── web/                                # Web platform files
│   └── index.html                      # HTML template
│
├── App.tsx                             # Main React Native component
├── index.js                            # Native entry point
├── index.web.js                        # Web entry point
├── package.json                        # Dependencies and codegen config
├── webpack.config.js                   # Webpack config for web
├── metro.config.js                     # Metro bundler config
├── tsconfig.json                       # TypeScript configuration
└── babel.config.js                     # Babel configuration
```

### Key Files Explained

| File | Purpose |
|------|---------|
| `specs/Native*.ts` | TypeScript interfaces that define the module contract. Codegen uses these to generate native interfaces. |
| `specs/Native*.web.ts` | Web fallback implementations (webpack resolves `.web.ts` files for web builds). |
| `ios/*.mm` | Objective-C++ implementations that conform to the generated spec protocols. |
| `android/*Module.kt` | Kotlin implementations that extend the generated spec classes. |
| `android/*Package.kt` | TurboReactPackage classes that register modules with React Native. |
| `package.json` | Contains `codegenConfig` that tells React Native how to generate native code. |

---

## Prerequisites

### System Requirements

- **Node.js**: >= 20.x
- **npm** or **yarn**
- **Xcode**: 15.0+ (for iOS development)
- **Android Studio**: Latest stable version with:
  - Android SDK 34
  - Android NDK (side-by-side)
  - CMake
- **CocoaPods**: Latest version (for iOS)

### Development Environment Setup

Follow the official React Native environment setup guide:
- [Setting up the development environment](https://reactnative.dev/docs/set-up-your-environment)

---

## Step-by-Step Implementation

### 1. Initialize the Project

Create a new React Native project with the latest version:

```bash
npx @react-native-community/cli@latest init TurboModuleExample --version 0.83
cd TurboModuleExample
```

React Native 0.83+ has the New Architecture enabled by default.

Verify New Architecture is enabled in `android/gradle.properties`:

```properties
newArchEnabled=true
```

### 2. Configure Codegen

Add the `codegenConfig` section to `package.json`:

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

| Field | Description |
|-------|-------------|
| `name` | Name for generated spec files (conventionally ends with "Spec") |
| `type` | Use `"all"` for both modules and components, `"modules"` for modules only |
| `jsSrcsDir` | Directory containing TypeScript spec files |
| `android.javaPackageName` | Java/Kotlin package name for generated Android code |

### 3. Create TypeScript Specs

Create the `specs/` directory and add your module specifications.

#### `specs/NativeBiometrics.ts`

```typescript
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
```

#### `specs/NativeNotifications.ts`

```typescript
import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'notDetermined';

export interface NotificationOptions {
  title: string;
  body: string;
  channelId?: string;
}

export interface Spec extends TurboModule {
  requestPermission(): Promise<NotificationPermissionStatus>;
  getPermissionStatus(): Promise<NotificationPermissionStatus>;
  showNotification(options: NotificationOptions): Promise<boolean>;
  createChannel(
    channelId: string,
    channelName: string,
    description: string,
  ): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeNotifications');
```

**Key Conventions:**
- File must be named `Native<ModuleName>.ts`
- Interface must be named `Spec` and extend `TurboModule`
- Export default using `TurboModuleRegistry.getEnforcing<Spec>('ModuleName')`
- The module name in `getEnforcing()` must match the native module's `NAME` constant

### 4. Implement iOS Native Modules

#### Create Header File: `ios/TurboModuleExample/NativeBiometrics.h`

```objc
#import <React/RCTBridgeModule.h>

@interface NativeBiometrics : NSObject <RCTBridgeModule>
@end
```

#### Create Implementation: `ios/TurboModuleExample/NativeBiometrics.mm`

```objc
#import "NativeBiometrics.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <TurboModuleExampleSpec/TurboModuleExampleSpec.h>
#endif

@interface NativeBiometrics ()
#ifdef RCT_NEW_ARCH_ENABLED
<NativeBiometricsSpec>
#endif
@end

@implementation NativeBiometrics

RCT_EXPORT_MODULE()

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

RCT_EXPORT_METHOD(isAvailable:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [[LAContext alloc] init];
  NSError *error = nil;
  BOOL canEvaluate = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  resolve(@(canEvaluate));
}

RCT_EXPORT_METHOD(getBiometricType:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [[LAContext alloc] init];
  NSError *error = nil;

  if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
    resolve([self getBiometricTypeString:context.biometryType]);
  } else {
    resolve(@"none");
  }
}

RCT_EXPORT_METHOD(authenticate:(NSString *)reason
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [[LAContext alloc] init];
  NSError *error = nil;

  if (![context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
    resolve(@{
      @"success": @NO,
      @"error": error.localizedDescription ?: @"Biometric authentication not available",
      @"biometricType": @"none"
    });
    return;
  }

  NSString *biometricType = [self getBiometricTypeString:context.biometryType];

  [context evaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
          localizedReason:reason
                    reply:^(BOOL success, NSError * _Nullable authError) {
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

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeBiometricsSpecJSI>(params);
}
#endif

@end
```

#### Add Face ID Permission to `Info.plist`

```xml
<key>NSFaceIDUsageDescription</key>
<string>This app uses Face ID for authentication</string>
```

### 5. Implement Android Native Modules

#### Add Dependencies to `android/app/build.gradle`

```gradle
dependencies {
    implementation("androidx.biometric:biometric:1.1.0")
    // ... other dependencies
}
```

#### Add Permissions to `AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

#### Create Module: `android/.../biometrics/NativeBiometricsModule.kt`

```kotlin
package com.turbomoduleexample.biometrics

import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableNativeMap
import com.turbomoduleexample.NativeBiometricsSpec

class NativeBiometricsModule(reactContext: ReactApplicationContext) :
    NativeBiometricsSpec(reactContext) {

    companion object {
        const val NAME = "NativeBiometrics"
    }

    override fun getName(): String = NAME

    override fun isAvailable(promise: Promise) {
        try {
            val biometricManager = BiometricManager.from(reactApplicationContext)
            val canAuthenticate = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.BIOMETRIC_WEAK
            )
            promise.resolve(canAuthenticate == BiometricManager.BIOMETRIC_SUCCESS)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    override fun getBiometricType(promise: Promise) {
        // Implementation...
        promise.resolve("fingerprint")
    }

    override fun authenticate(reason: String, promise: Promise) {
        val activity = reactApplicationContext.currentActivity

        if (activity == null || activity !is FragmentActivity) {
            val result = WritableNativeMap().apply {
                putBoolean("success", false)
                putString("error", "Activity not available")
            }
            promise.resolve(result)
            return
        }

        // BiometricPrompt implementation...
    }
}
```

**Key Points:**
- Module extends `NativeBiometricsSpec` (generated by Codegen)
- Methods use `override` keyword to implement the spec interface
- `NAME` constant must match the spec's `getEnforcing()` parameter

#### Create Package: `android/.../biometrics/NativeBiometricsPackage.kt`

```kotlin
package com.turbomoduleexample.biometrics

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class NativeBiometricsPackage : TurboReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == NativeBiometricsModule.NAME) {
            NativeBiometricsModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                NativeBiometricsModule.NAME to ReactModuleInfo(
                    NativeBiometricsModule.NAME,
                    NativeBiometricsModule.NAME,
                    false, // canOverrideExistingModule
                    false, // needsEagerInit
                    false, // isCxxModule
                    true   // isTurboModule
                )
            )
        }
    }
}
```

#### Register Packages in `MainApplication.kt`

```kotlin
package com.turbomoduleexample

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.turbomoduleexample.biometrics.NativeBiometricsPackage
import com.turbomoduleexample.notifications.NativeNotificationsPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Add custom Turbo Native Modules
          add(NativeBiometricsPackage())
          add(NativeNotificationsPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
```

### 6. Add Web Support

#### Install Web Dependencies

```bash
npm install react-dom react-native-web
npm install --save-dev webpack webpack-cli webpack-dev-server \
  html-webpack-plugin babel-loader babel-plugin-react-native-web \
  @babel/preset-env @babel/preset-react @babel/preset-typescript
```

#### Handle React 19 Compatibility

If using React 19, add overrides to `package.json`:

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

#### Create `webpack.config.js`

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname);

module.exports = {
  entry: path.resolve(appDirectory, 'index.web.js'),
  output: {
    path: path.resolve(appDirectory, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
    alias: {
      'react-native$': 'react-native-web',
    },
  },
  module: {
    rules: [{
      test: /\.(js|jsx|ts|tsx)$/,
      include: [
        path.resolve(appDirectory, 'index.web.js'),
        path.resolve(appDirectory, 'App.tsx'),
        path.resolve(appDirectory, 'specs'),
      ],
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', {targets: {browsers: 'last 2 versions'}}],
            ['@babel/preset-react', {runtime: 'automatic'}],
            '@babel/preset-typescript',
          ],
          plugins: ['react-native-web'],
        },
      },
    }],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(appDirectory, 'web/index.html'),
    }),
  ],
  devServer: {
    port: 8080,
    hot: true,
    open: true,
  },
};
```

#### Create Web Entry Point: `index.web.js`

```javascript
import {createRoot} from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

#### Create Web Fallback: `specs/NativeBiometrics.web.ts`

```typescript
export type BiometricType = 'fingerprint' | 'faceId' | 'iris' | 'none';

const NativeBiometrics = {
  async isAvailable(): Promise<boolean> {
    if (window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return false;
  },

  async getBiometricType(): Promise<BiometricType> {
    const available = await this.isAvailable();
    return available ? 'fingerprint' : 'none';
  },

  async authenticate(reason: string): Promise<{success: boolean; error?: string}> {
    // Web Authentication API implementation
    return { success: true, biometricType: 'fingerprint' };
  },
};

export default NativeBiometrics;
```

### 7. Create the React Native App

#### `App.tsx`

```typescript
import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, Platform} from 'react-native';
import NativeBiometrics from './specs/NativeBiometrics';
import NativeNotifications from './specs/NativeNotifications';

function App() {
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const available = await NativeBiometrics.isAvailable();
    setBiometricAvailable(available);
  };

  const handleAuthenticate = async () => {
    const result = await NativeBiometrics.authenticate('Please authenticate');
    console.log('Auth result:', result);
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', padding: 20}}>
      <Text>Biometric Available: {biometricAvailable ? 'Yes' : 'No'}</Text>
      <TouchableOpacity onPress={handleAuthenticate}>
        <Text>Authenticate</Text>
      </TouchableOpacity>
    </View>
  );
}

export default App;
```

---

## Running the Application

### iOS

```bash
# Install pods
cd ios && pod install && cd ..

# Run on simulator
npm run ios

# Run on device
npm run ios -- --device "Your Device Name"
```

### Android

```bash
# Clean build (recommended after adding native modules)
cd android && ./gradlew clean && cd ..

# Run on emulator or device
npm run android

# For physical devices, forward Metro bundler port
adb reverse tcp:8081 tcp:8081
```

### Web

```bash
# Development server
npm run web

# Production build
npm run web:build
```

---

## Troubleshooting

### "NativeBiometrics could not be found"

**Cause:** Turbo Module not properly registered or codegen hasn't run.

**Solution:**
1. Clean and rebuild:
   ```bash
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   ```
2. Ensure modules extend the generated spec class (e.g., `NativeBiometricsSpec`)
3. Verify package is registered in `MainApplication.kt`

### "Unable to load script" on Android device

**Cause:** Device can't reach Metro bundler.

**Solution:**
```bash
adb reverse tcp:8081 tcp:8081
```

### React 19 compatibility errors with react-native-web

**Solution:** Add overrides to `package.json`:
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

### Codegen not generating specs

**Solution:**
1. Verify `codegenConfig` in `package.json` is correct
2. Ensure spec files are in the correct directory (`specs/`)
3. Run a clean build to trigger codegen

---

## Official Documentation References

### React Native

- [Turbo Native Modules Introduction](https://reactnative.dev/docs/turbo-native-modules-introduction) - Official guide for creating Turbo Modules
- [Turbo Native Modules: Deep Dive](https://reactnative.dev/docs/next/the-new-architecture/pillars-turbomodules) - Detailed architecture explanation
- [New Architecture Working Group](https://github.com/reactwg/react-native-new-architecture/blob/main/docs/turbo-modules.md) - Community documentation
- [Environment Setup](https://reactnative.dev/docs/set-up-your-environment) - Development environment setup

### React Native for Web

- [Official Documentation](https://necolas.github.io/react-native-web/docs/) - Complete guide for web support
- [Installation Guide](https://necolas.github.io/react-native-web/docs/installation/) - Setup instructions
- [GitHub Repository](https://github.com/necolas/react-native-web) - Source code and examples

### Platform-Specific APIs

- [iOS LocalAuthentication](https://developer.apple.com/documentation/localauthentication) - Apple's biometric authentication framework
- [iOS UserNotifications](https://developer.apple.com/documentation/usernotifications) - Apple's notification framework
- [Android BiometricPrompt](https://developer.android.com/reference/androidx/biometric/BiometricPrompt) - Android biometric API
- [Android NotificationManager](https://developer.android.com/reference/android/app/NotificationManager) - Android notification API
- [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) - WebAuthn specification
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) - Browser notifications

---

## Version Information

- **React Native**: 0.83.1
- **React**: 19.2.0
- **New Architecture**: Enabled by default
- **Codegen**: Built into React Native CLI

---

## License

This example is provided for educational purposes. See the [React Native License](https://github.com/facebook/react-native/blob/main/LICENSE) for the framework license.
