import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { 
  checkNotificationPermissions, 
  requestNotificationPermissions,
  scheduleAllNotifications,
} from '../notifications';

interface NotificationPermissionBannerProps {
  onPermissionGranted?: () => void;
}

export function NotificationPermissionBanner({ onPermissionGranted }: NotificationPermissionBannerProps) {
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);
  
  useEffect(() => {
    checkNotificationPermissions().then(granted => {
      setPermissionStatus(granted ? 'granted' : 'denied');
    });
  }, []);
  
  // Don't show if permission is granted or still checking
  if (permissionStatus === 'granted' || permissionStatus === 'unknown') {
    return null;
  }
  
  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const granted = await requestNotificationPermissions();
    setPermissionStatus(granted ? 'granted' : 'denied');
    setIsRequesting(false);
    
    if (granted) {
      await scheduleAllNotifications();
      onPermissionGranted?.();
    }
  };
  
  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔔</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Notifications are off</Text>
        <Text style={styles.description}>
          DASH works best with notifications. Without them, you'll need to remember to open the app yourself.
        </Text>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleRequestPermission}
            disabled={isRequesting}
          >
            <Text style={styles.primaryButtonText}>
              {isRequesting ? 'Requesting...' : 'Enable Notifications'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleOpenSettings}
          >
            <Text style={styles.secondaryButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.warning,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: SPACING.md,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray300,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.black,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray600,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.gray400,
  },
});
