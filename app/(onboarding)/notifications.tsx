import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../src/components';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../src/constants/theme';
import { 
  requestNotificationPermissions, 
  checkNotificationPermissions,
  scheduleAllNotifications,
} from '../../src/notifications';

export default function NotificationsScreen() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [wasAttempted, setWasAttempted] = useState(false);
  
  const handleEnableNotifications = useCallback(async () => {
    setIsRequesting(true);
    setWasAttempted(true);
    
    const granted = await requestNotificationPermissions();
    
    setIsRequesting(false);
    
    if (granted) {
      // Schedule notifications for all configured domains
      await scheduleAllNotifications();
      router.push('/(onboarding)/confirm');
    }
  }, []);
  
  const handleSkip = useCallback(() => {
    // Allow users to skip, but they'll see the warning on the Today screen
    router.push('/(onboarding)/confirm');
  }, []);
  
  const handleOpenSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Step indicator */}
        <Text style={styles.step}>Step 4 of 5</Text>
        
        {/* Illustration */}
        <View style={styles.illustration}>
          <Text style={styles.illustrationEmoji}>🔔</Text>
        </View>
        
        {/* Header */}
        <Text style={styles.title}>Enable Notifications</Text>
        <Text style={styles.subtitle}>
          DASH reminds you at your scheduled times. Without notifications, you'll need to remember to open the app yourself.
        </Text>
        
        {/* Benefits */}
        <View style={styles.benefits}>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>⏰</Text>
            <Text style={styles.benefitText}>Get reminded at the right time</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>🎯</Text>
            <Text style={styles.benefitText}>One tap to start your routine</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.benefitEmoji}>🧠</Text>
            <Text style={styles.benefitText}>No need to remember anything</Text>
          </View>
        </View>
        
        {/* Denied state - show after first attempt */}
        {wasAttempted && !isRequesting && (
          <View style={styles.deniedCard}>
            <Text style={styles.deniedTitle}>Notifications were denied</Text>
            <Text style={styles.deniedText}>
              You can enable them later in Settings if you change your mind.
            </Text>
            <Button
              title="Open Device Settings"
              onPress={handleOpenSettings}
              variant="secondary"
              size="small"
              style={styles.settingsButton}
            />
          </View>
        )}
      </View>
      
      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={isRequesting ? 'Requesting...' : 'Enable Notifications'}
          onPress={handleEnableNotifications}
          size="large"
          fullWidth
          loading={isRequesting}
        />
        
        <Button
          title="Continue Without Notifications"
          onPress={handleSkip}
          variant="ghost"
          size="large"
          fullWidth
          style={styles.skipButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  step: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  illustration: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  illustrationEmoji: {
    fontSize: 80,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  benefits: {
    gap: SPACING.md,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  benefitEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  benefitText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    flex: 1,
  },
  deniedCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deniedTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  deniedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  settingsButton: {
    alignSelf: 'flex-start',
  },
  actions: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  skipButton: {
    marginTop: SPACING.sm,
  },
});
