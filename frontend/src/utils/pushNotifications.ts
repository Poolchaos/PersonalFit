/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

/**
 * Push Notification Service
 *
 * Manages service worker registration and push subscriptions
 */

import { apiClient } from '../api/client';

const VAPID_PUBLIC_KEY_CACHE_KEY = 'lumi_vapid_public_key';

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  if (import.meta.env.DEV) console.log('Notification permission:', permission);
  return permission;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    if (import.meta.env.DEV) console.log('✅ Service Worker registered:', registration.scope);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    throw error;
  }
}

/**
 * Get VAPID public key from server
 */
async function getVapidPublicKey(): Promise<string> {
  // Check cache first
  const cached = sessionStorage.getItem(VAPID_PUBLIC_KEY_CACHE_KEY);
  if (cached) {
    return cached;
  }

  try {
    const response = await apiClient.get('/notifications/vapid-public-key');
    const publicKey = response.data.publicKey;

    // Cache it
    sessionStorage.setItem(VAPID_PUBLIC_KEY_CACHE_KEY, publicKey);

    return publicKey;
  } catch (error) {
    console.error('Error fetching VAPID public key:', error);
    throw new Error('Failed to get VAPID public key from server');
  }
}

/**
 * Convert VAPID public key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription> {
  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      if (import.meta.env.DEV) console.log('Already subscribed to push notifications');
      return subscription;
    }

    // Get VAPID public key
    const vapidPublicKey = await getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Subscribe
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    if (import.meta.env.DEV) console.log('✅ Subscribed to push notifications');

    // Send subscription to server
    await apiClient.post('/notifications/register-device', {
      subscription: subscription.toJSON(),
    });

    if (import.meta.env.DEV) console.log('✅ Subscription registered with server');

    return subscription;
  } catch (error) {
    console.error('❌ Failed to subscribe to push notifications:', error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      if (import.meta.env.DEV) console.log('✅ Unsubscribed from push notifications');
    }

    // Tell server to remove subscription
    await apiClient.delete('/notifications/unregister-device');

    if (import.meta.env.DEV) console.log('✅ Subscription removed from server');
  } catch (error) {
    console.error('❌ Failed to unsubscribe from push notifications:', error);
    throw error;
  }
}

/**
 * Get current push subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
}

/**
 * Check if currently subscribed
 */
export async function isSubscribed(): Promise<boolean> {
  const subscription = await getCurrentSubscription();
  return subscription !== null;
}

/**
 * Send test notification
 */
export async function sendTestNotification(): Promise<void> {
  try {
    await apiClient.post('/notifications/test');
    if (import.meta.env.DEV) console.log('✅ Test notification sent');
  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
    throw error;
  }
}

/**
 * Initialize push notifications
 * This should be called when the app starts
 */
export async function initializePushNotifications(): Promise<void> {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported');
    return;
  }

  try {
    // Register service worker
    await registerServiceWorker();

    // Check if we have permission
    const permission = getNotificationPermission();

    if (permission === 'granted') {
      // Check if subscribed, if not subscribe
      const subscribed = await isSubscribed();
      if (!subscribed) {
        await subscribeToPushNotifications();
      }
    }

    // Set up message listener
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (import.meta.env.DEV) console.log('Message from service worker:', event.data);

      if (event.data?.type === 'LOG_DOSE') {
        // Handle dose logging request from notification
        window.dispatchEvent(
          new CustomEvent('medication-log-dose', {
            detail: {
              medicationId: event.data.medicationId,
              scheduledTime: event.data.scheduledTime,
            },
          })
        );
      } else if (event.data?.type === 'VIEW_MEDICATIONS') {
        // Navigate to medications page
        window.location.href = '/medications';
      }
    });

    if (import.meta.env.DEV) console.log('✅ Push notifications initialized');
  } catch (error) {
    console.error('❌ Failed to initialize push notifications:', error);
  }
}
