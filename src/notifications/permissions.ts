import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Request notification permissions
 * Returns true if permissions were granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Notifications don't work on simulators
  if (!Device.isDevice) {
    console.log('[Notifications] Must use physical device for notifications');
    return false;
  }
  
  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  if (existingStatus === 'granted') {
    return true;
  }
  
  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  
  return status === 'granted';
}

/**
 * Check if notifications are enabled
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }
  
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Configure notification behavior
 */
export function configureNotifications(): void {
  // Set notification handler for when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  
  // Configure Android notification channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'DASH Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF3C00',
    });
  }
}
