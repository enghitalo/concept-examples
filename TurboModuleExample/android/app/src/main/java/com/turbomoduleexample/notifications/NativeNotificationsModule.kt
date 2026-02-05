package com.turbomoduleexample.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.atomic.AtomicInteger

@ReactModule(name = NativeNotificationsModule.NAME)
class NativeNotificationsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "NativeNotifications"
        const val DEFAULT_CHANNEL_ID = "default_channel"
        const val DEFAULT_CHANNEL_NAME = "Default"
        const val PERMISSION_REQUEST_CODE = 1001
        private val notificationId = AtomicInteger(0)
    }

    override fun getName(): String = NAME

    init {
        // Create default notification channel for Android O and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createDefaultChannel()
        }
    }

    private fun createDefaultChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                DEFAULT_CHANNEL_ID,
                DEFAULT_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Default notification channel"
            }
            val notificationManager = reactApplicationContext.getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun hasNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                reactApplicationContext,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            // For Android 12 and below, notification permission is granted by default
            true
        }
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                promise.resolve("denied")
                return
            }

            if (hasNotificationPermission()) {
                promise.resolve("granted")
                return
            }

            // Request permission
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                PERMISSION_REQUEST_CODE
            )

            // Since we can't wait for the result in this implementation,
            // we return notDetermined and the user can check again
            promise.resolve("notDetermined")
        } else {
            // For Android 12 and below, permission is granted by default
            promise.resolve("granted")
        }
    }

    @ReactMethod
    fun getPermissionStatus(promise: Promise) {
        val status = when {
            hasNotificationPermission() -> "granted"
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
                if (reactApplicationContext.currentActivity?.let {
                    ActivityCompat.shouldShowRequestPermissionRationale(
                        it,
                        Manifest.permission.POST_NOTIFICATIONS
                    )
                } == true) {
                    "denied"
                } else {
                    "notDetermined"
                }
            }
            else -> "granted"
        }
        promise.resolve(status)
    }

    @ReactMethod
    fun showNotification(options: ReadableMap, promise: Promise) {
        try {
            val title = options.getString("title") ?: run {
                promise.resolve(false)
                return
            }
            val body = options.getString("body") ?: run {
                promise.resolve(false)
                return
            }
            val channelId = if (options.hasKey("channelId")) {
                options.getString("channelId") ?: DEFAULT_CHANNEL_ID
            } else {
                DEFAULT_CHANNEL_ID
            }

            if (!hasNotificationPermission()) {
                promise.resolve(false)
                return
            }

            val notification = NotificationCompat.Builder(reactApplicationContext, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .build()

            val notificationManager = NotificationManagerCompat.from(reactApplicationContext)

            if (ActivityCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
            ) {
                notificationManager.notify(notificationId.incrementAndGet(), notification)
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun createChannel(channelId: String, channelName: String, description: String, promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val importance = NotificationManager.IMPORTANCE_DEFAULT
                val channel = NotificationChannel(channelId, channelName, importance).apply {
                    this.description = description
                }
                val notificationManager = reactApplicationContext.getSystemService(
                    Context.NOTIFICATION_SERVICE
                ) as NotificationManager
                notificationManager.createNotificationChannel(channel)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}
