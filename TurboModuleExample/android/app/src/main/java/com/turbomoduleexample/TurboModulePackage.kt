package com.turbomoduleexample

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class TurboModulePackage : TurboReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return when (name) {
            NativeFingerprintAuthModule.NAME -> NativeFingerprintAuthModule(reactContext)
            NativeNotificationModule.NAME -> NativeNotificationModule(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                NativeFingerprintAuthModule.NAME to ReactModuleInfo(
                    NativeFingerprintAuthModule.NAME,
                    NativeFingerprintAuthModule.NAME,
                    false, // canOverrideExistingModule
                    false, // needsEagerInit
                    true,  // hasConstants
                    false, // isCxxModule
                    true   // isTurboModule
                ),
                NativeNotificationModule.NAME to ReactModuleInfo(
                    NativeNotificationModule.NAME,
                    NativeNotificationModule.NAME,
                    false,
                    false,
                    true,
                    false,
                    true
                )
            )
        }
    }
}
