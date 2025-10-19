// frontend/src/services/pushNotificationService.ts
// Push notification service for Web Push API and mobile notifications

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

class PushNotificationService {
  private vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with actual VAPID key
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) {
      return { granted: false, denied: true, prompt: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      prompt: permission === 'default',
    };
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Register service worker for push notifications
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered successfully');

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      this.registration = await this.registerServiceWorker();
    }

    if (!this.registration) {
      console.error('No service worker registration available');
      return null;
    }

    try {
      // Convert VAPID key to Uint8Array
      const vapidPublicKeyArray = this.urlBase64ToUint8Array(this.vapidPublicKey);

      // Subscribe to push notifications
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKeyArray as BufferSource,
      });

      // Convert subscription to JSON
      const subscriptionJSON = subscription.toJSON();

      // Store subscription on backend
      await this.storeSubscription(userId, {
        endpoint: subscriptionJSON.endpoint!,
        keys: {
          p256dh: subscriptionJSON.keys!.p256dh!,
          auth: subscriptionJSON.keys!.auth!,
        },
      });

      console.log('Push subscription created successfully');
      return {
        endpoint: subscriptionJSON.endpoint!,
        keys: {
          p256dh: subscriptionJSON.keys!.p256dh!,
          auth: subscriptionJSON.keys!.auth!,
        },
      };
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscription(userId);
        console.log('Push subscription removed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Show local notification (for testing or immediate display)
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported');
      return;
    }

    const permission = await this.requestPermission();
    if (!permission) {
      console.warn('Notification permission denied');
      return;
    }

    if (this.registration) {
      await this.registration.showNotification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        ...options,
      });
    } else {
      new Notification(title, {
        icon: '/logo192.png',
        ...options,
      });
    }
  }

  /**
   * Store push subscription on backend
   */
  private async storeSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('http://localhost:4001/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscription,
          platform: this.detectPlatform(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to store subscription');
      }

      console.log('Subscription stored on backend');
    } catch (error) {
      console.error('Error storing subscription:', error);
    }
  }

  /**
   * Remove push subscription from backend
   */
  private async removeSubscription(userId: string): Promise<void> {
    try {
      await fetch(`http://localhost:4001/api/push/unsubscribe/${userId}`, {
        method: 'DELETE',
      });
      console.log('Subscription removed from backend');
    } catch (error) {
      console.error('Error removing subscription:', error);
    }
  }

  /**
   * Detect device platform
   */
  private detectPlatform(): 'web' | 'ios' | 'android' {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) {
      return 'android';
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    }
    return 'web';
  }

  /**
   * Convert VAPID public key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

export const pushNotificationService = new PushNotificationService();
