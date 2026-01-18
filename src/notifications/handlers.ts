import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { analytics } from '../utils/analytics';

// Type for notification data
interface NotificationData {
  domainId?: string;
  domainType?: string;
  isSnooze?: boolean;
}

/**
 * Handle notification received while app is in foreground
 */
export function handleNotificationReceived(
  notification: Notifications.Notification
): void {
  const data = notification.request.content.data as NotificationData;
  
  console.log('[Notifications] Received:', {
    title: notification.request.content.title,
    data,
  });
  
  if (data.domainType) {
    analytics.track('notification_received', { domain: data.domainType });
  }
}

/**
 * Handle notification response (user tapped notification)
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse
): void {
  const data = response.notification.request.content.data as NotificationData;
  
  console.log('[Notifications] User tapped notification:', data);
  
  // Track analytics
  analytics.appOpened('notification');
  
  // Navigate to task card for the domain
  if (data.domainId) {
    // Small delay to ensure app is ready
    setTimeout(() => {
      router.push({
        pathname: '/(main)/today/task',
        params: { domainId: data.domainId },
      });
    }, 100);
  }
}

/**
 * Set up notification listeners
 * Returns cleanup function
 */
export function setupNotificationListeners(): () => void {
  // Handle notifications received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    handleNotificationReceived
  );
  
  // Handle notification response (user interaction)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  );
  
  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Get the last notification response (for handling cold start)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}

/**
 * Handle cold start from notification
 */
export async function handleColdStartNotification(): Promise<void> {
  const response = await getLastNotificationResponse();
  
  if (response) {
    const data = response.notification.request.content.data as NotificationData;
    
    console.log('[Notifications] Cold start from notification:', data);
    
    analytics.appOpened('notification');
    
    if (data.domainId) {
      // Navigate after a delay to ensure app is mounted
      setTimeout(() => {
        router.push({
          pathname: '/(main)/today/task',
          params: { domainId: data.domainId },
        });
      }, 500);
    }
  }
}
