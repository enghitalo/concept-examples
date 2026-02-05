import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'notDetermined';

export interface NotificationOptions {
  title: string;
  body: string;
  channelId?: string;
}

export interface Spec extends TurboModule {
  /**
   * Request permission to show notifications
   */
  requestPermission(): Promise<NotificationPermissionStatus>;

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): Promise<NotificationPermissionStatus>;

  /**
   * Show a local notification
   */
  showNotification(options: NotificationOptions): Promise<boolean>;

  /**
   * Create a notification channel (Android only, no-op on iOS)
   */
  createChannel(
    channelId: string,
    channelName: string,
    description: string,
  ): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeNotifications');
