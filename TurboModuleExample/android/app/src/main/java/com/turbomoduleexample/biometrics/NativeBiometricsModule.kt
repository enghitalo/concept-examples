package com.turbomoduleexample.biometrics

import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeBiometricsModule.NAME)
class NativeBiometricsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "NativeBiometrics"
    }

    override fun getName(): String = NAME

    private fun getBiometricTypeFromAuthenticators(): String {
        val biometricManager = BiometricManager.from(reactApplicationContext)

        // Check for fingerprint
        val canAuthenticateFingerprint = biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG
        )

        if (canAuthenticateFingerprint == BiometricManager.BIOMETRIC_SUCCESS) {
            // On Android, we can't directly distinguish between fingerprint and face
            // BiometricManager.Authenticators.BIOMETRIC_STRONG includes both
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ might have face recognition
                "fingerprint" // Default to fingerprint as it's most common
            } else {
                "fingerprint"
            }
        }

        return "none"
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
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

    @ReactMethod
    fun getBiometricType(promise: Promise) {
        try {
            promise.resolve(getBiometricTypeFromAuthenticators())
        } catch (e: Exception) {
            promise.resolve("none")
        }
    }

    @ReactMethod
    fun authenticate(reason: String, promise: Promise) {
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

        if (activity !is FragmentActivity) {
            val result = WritableNativeMap().apply {
                putBoolean("success", false)
                putString("error", "Activity must be a FragmentActivity")
                putString("biometricType", "none")
            }
            promise.resolve(result)
            return
        }

        val biometricManager = BiometricManager.from(reactApplicationContext)
        val canAuthenticate = biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
            BiometricManager.Authenticators.BIOMETRIC_WEAK
        )

        if (canAuthenticate != BiometricManager.BIOMETRIC_SUCCESS) {
            val errorMessage = when (canAuthenticate) {
                BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> "No biometric hardware available"
                BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> "Biometric hardware unavailable"
                BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> "No biometrics enrolled"
                BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> "Security update required"
                BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED -> "Biometric authentication unsupported"
                BiometricManager.BIOMETRIC_STATUS_UNKNOWN -> "Unknown biometric status"
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
        val executor = ContextCompat.getMainExecutor(reactApplicationContext)

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
                // The user can try again
            }
        }

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Biometric Authentication")
            .setSubtitle(reason)
            .setNegativeButtonText("Cancel")
            .setAllowedAuthenticators(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.BIOMETRIC_WEAK
            )
            .build()

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
