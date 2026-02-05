import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Request permission to show notifications
   * @returns Promise that resolves to true if permission granted
   */
  requestPermission(): Promise<boolean>;

  /**
   * Check if notification permission is granted
   */
  hasPermission(): Promise<boolean>;

  /**
   * Show a local notification
   * @param title - Notification title
   * @param body - Notification body text
   * @param identifier - Unique identifier for the notification
   */
  showNotification(
    title: string,
    body: string,
    identifier: string,
  ): Promise<boolean>;

  /**
   * Cancel a scheduled notification
   * @param identifier - The notification identifier to cancel
   */
  cancelNotification(identifier: string): Promise<void>;

  /**
   * Cancel all notifications
   */
  cancelAllNotifications(): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeNotification');
