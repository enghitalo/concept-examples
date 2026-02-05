package com.turbomoduleexample

import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.Executor

@ReactModule(name = NativeFingerprintAuthModule.NAME)
class NativeFingerprintAuthModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "NativeFingerprintAuth"
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun isAvailable(promise: Promise) {
        val biometricManager = BiometricManager.from(reactApplicationContext)
        val canAuthenticate = biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
                    BiometricManager.Authenticators.BIOMETRIC_WEAK
        )
        promise.resolve(canAuthenticate == BiometricManager.BIOMETRIC_SUCCESS)
    }

    @ReactMethod
    fun authenticate(reason: String, promise: Promise) {
        val activity = currentActivity

        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No activity available")
            return
        }

        if (activity !is FragmentActivity) {
            promise.reject("INVALID_ACTIVITY", "Activity must be a FragmentActivity")
            return
        }

        val executor: Executor = ContextCompat.getMainExecutor(reactApplicationContext)

        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                val code = when (errorCode) {
                    BiometricPrompt.ERROR_USER_CANCELED -> "USER_CANCEL"
                    BiometricPrompt.ERROR_NEGATIVE_BUTTON -> "USER_CANCEL"
                    BiometricPrompt.ERROR_LOCKOUT -> "LOCKOUT"
                    BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> "LOCKOUT_PERMANENT"
                    else -> "AUTH_ERROR"
                }
                promise.reject(code, errString.toString())
            }

            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                promise.resolve(true)
            }

            override fun onAuthenticationFailed() {
                super.onAuthenticationFailed()
                // Don't reject here - user can retry
            }
        }

        activity.runOnUiThread {
            val biometricPrompt = BiometricPrompt(activity, executor, callback)

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle("Biometric Authentication")
                .setSubtitle(reason)
                .setNegativeButtonText("Cancel")
                .setAllowedAuthenticators(
                    BiometricManager.Authenticators.BIOMETRIC_STRONG or
                            BiometricManager.Authenticators.BIOMETRIC_WEAK
                )
                .build()

            biometricPrompt.authenticate(promptInfo)
        }
    }

    @ReactMethod
    fun getBiometricType(promise: Promise) {
        val biometricManager = BiometricManager.from(reactApplicationContext)

        val canAuthenticateStrong = biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG
        ) == BiometricManager.BIOMETRIC_SUCCESS

        val canAuthenticateWeak = biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_WEAK
        ) == BiometricManager.BIOMETRIC_SUCCESS

        if (canAuthenticateStrong || canAuthenticateWeak) {
            // Android doesn't easily distinguish between fingerprint and face
            // We return "fingerprint" as a generic biometric type
            promise.resolve("fingerprint")
        } else {
            promise.resolve("none")
        }
    }
}
