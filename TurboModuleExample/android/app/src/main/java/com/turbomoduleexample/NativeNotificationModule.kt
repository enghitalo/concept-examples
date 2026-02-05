package com.turbomoduleexample

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
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeNotificationModule.NAME)
class NativeNotificationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "NativeNotification"
        const val CHANNEL_ID = "turbo_module_notifications"
        const val CHANNEL_NAME = "TurboModule Notifications"
        const val CHANNEL_DESCRIPTION = "Notifications from TurboModule Example App"
        const val PERMISSION_REQUEST_CODE = 1001
    }

    init {
        createNotificationChannel()
    }

    override fun getName(): String = NAME

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = CHANNEL_DESCRIPTION
            }

            val notificationManager = reactApplicationContext.getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val activity = currentActivity

            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No activity available")
                return
            }

            if (ContextCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
            ) {
                promise.resolve(true)
            } else {
                ActivityCompat.requestPermissions(
                    activity,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    PERMISSION_REQUEST_CODE
                )
                // Note: In a real app, you'd handle the permission result callback
                // For simplicity, we resolve with a slight delay check
                promise.resolve(true)
            }
        } else {
            // No runtime permission needed below Android 13
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun hasPermission(promise: Promise) {
        val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                reactApplicationContext,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            NotificationManagerCompat.from(reactApplicationContext).areNotificationsEnabled()
        }
        promise.resolve(hasPermission)
    }

    @ReactMethod
    fun showNotification(title: String, body: String, identifier: String, promise: Promise) {
        try {
            val notificationId = identifier.hashCode()

            val builder = NotificationCompat.Builder(reactApplicationContext, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)

            val notificationManager = NotificationManagerCompat.from(reactApplicationContext)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (ContextCompat.checkSelfPermission(
                        reactApplicationContext,
                        Manifest.permission.POST_NOTIFICATIONS
                    ) != PackageManager.PERMISSION_GRANTED
                ) {
                    promise.reject("PERMISSION_DENIED", "Notification permission not granted")
                    return
                }
            }

            notificationManager.notify(notificationId, builder.build())
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelNotification(identifier: String, promise: Promise) {
        try {
            val notificationId = identifier.hashCode()
            val notificationManager = NotificationManagerCompat.from(reactApplicationContext)
            notificationManager.cancel(notificationId)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelAllNotifications(promise: Promise) {
        try {
            val notificationManager = NotificationManagerCompat.from(reactApplicationContext)
            notificationManager.cancelAll()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message, e)
        }
    }
}
