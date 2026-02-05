/**
 * Web implementation of NativeNotifications using Web Notifications API
 */

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'notDetermined';

export interface NotificationOptions {
  title: string;
  body: string;
  channelId?: string;
}

const NativeNotifications = {
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return this.mapPermissionStatus(permission);
    } catch {
      return 'denied';
    }
  },

  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    return this.mapPermissionStatus(Notification.permission);
  },

  mapPermissionStatus(
    permission: NotificationPermission,
  ): NotificationPermissionStatus {
    switch (permission) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      default:
        return 'notDetermined';
    }
  },

  async showNotification(options: NotificationOptions): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Web Notifications API not available');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: '/favicon.ico',
        tag: options.channelId || 'default',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  },

  async createChannel(
    _channelId: string,
    _channelName: string,
    _description: string,
  ): Promise<boolean> {
    // Notification channels are not supported on web
    // This is a no-op
    return true;
  },
};

export default NativeNotifications;
