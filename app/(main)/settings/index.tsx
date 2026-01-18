import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, DOMAIN_COLORS } from '../../../src/constants/theme';
import { useAppStore } from '../../../src/stores/appStore';
import { DOMAIN_INFO, DomainType } from '../../../src/types';
import { formatTimeForDisplay, parseTimeString, formatTimeString } from '../../../src/utils/time';
import { 
  scheduleAllNotifications, 
  cancelAllNotifications,
  rescheduleDomainNotifications,
  cancelDomainNotifications,
} from '../../../src/notifications';
import { getDatabase } from '../../../src/db';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  
  const { 
    domains, 
    settings, 
    toggleDomainNotifications,
    setQuietHours,
    setStreaksEnabled,
    refreshDomains,
    refreshSettings,
  } = useAppStore();
  
  // Local state for time pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartTime, setTempStartTime] = useState<Date | null>(null);
  const [tempEndTime, setTempEndTime] = useState<Date | null>(null);
  
  // Initialize temp times from settings
  useEffect(() => {
    const { hours: startH, minutes: startM } = parseTimeString(settings.quietHoursStart);
    const { hours: endH, minutes: endM } = parseTimeString(settings.quietHoursEnd);
    
    const startDate = new Date();
    startDate.setHours(startH, startM, 0, 0);
    setTempStartTime(startDate);
    
    const endDate = new Date();
    endDate.setHours(endH, endM, 0, 0);
    setTempEndTime(endDate);
  }, [settings.quietHoursStart, settings.quietHoursEnd]);
  
  // Handle domain notification toggle
  const handleDomainToggle = useCallback(async (domainId: string, domainType: DomainType, enabled: boolean) => {
    await toggleDomainNotifications(domainId, enabled);
    
    if (enabled) {
      await rescheduleDomainNotifications(domainId);
    } else {
      await cancelDomainNotifications(domainId);
    }
  }, [toggleDomainNotifications]);
  
  // Handle quiet hours toggle
  const handleQuietHoursToggle = useCallback(async (enabled: boolean) => {
    await setQuietHours(enabled);
    await scheduleAllNotifications();
  }, [setQuietHours]);
  
  // Handle quiet hours time change
  const handleQuietHoursTimeChange = useCallback(async (
    type: 'start' | 'end',
    date: Date
  ) => {
    const timeString = formatTimeString(date.getHours(), date.getMinutes());
    
    if (type === 'start') {
      setTempStartTime(date);
      await setQuietHours(settings.quietHoursEnabled, timeString, undefined);
    } else {
      setTempEndTime(date);
      await setQuietHours(settings.quietHoursEnabled, undefined, timeString);
    }
    
    if (settings.quietHoursEnabled) {
      await scheduleAllNotifications();
    }
    
    setShowStartPicker(false);
    setShowEndPicker(false);
  }, [setQuietHours, settings.quietHoursEnabled]);
  
  // Handle streaks toggle
  const handleStreaksToggle = useCallback(async (enabled: boolean) => {
    await setStreaksEnabled(enabled);
  }, [setStreaksEnabled]);
  
  // Handle reset all data
  const handleResetData = useCallback(() => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your playbooks, tasks, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              
              await cancelAllNotifications();
              
              await db.execAsync('DELETE FROM task_logs');
              await db.execAsync('DELETE FROM tasks');
              await db.execAsync('DELETE FROM playbooks');
              await db.execAsync('DELETE FROM domains');
              await db.execAsync('DELETE FROM plans');
              
              await db.runAsync(
                "UPDATE settings SET value = 'false' WHERE key = 'has_completed_onboarding'"
              );
              
              await refreshDomains();
              await refreshSettings();
              
              Alert.alert('Done', 'All data has been reset. Please restart the app.');
            } catch (error) {
              console.error('Reset failed:', error);
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          },
        },
      ]
    );
  }, [refreshDomains, refreshSettings]);
  
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + SPACING.xl }
      ]}
    >
      {/* Header */}
      <Text style={styles.title}>Settings</Text>
      
      {/* Notifications Section */}
      <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
      <View style={styles.card}>
        {domains.length === 0 ? (
          <Text style={styles.emptyText}>No domains configured yet</Text>
        ) : (
          domains.map((domain, index) => {
            const info = DOMAIN_INFO[domain.type];
            const colors = DOMAIN_COLORS[domain.type];
            const isLast = index === domains.length - 1;
            
            return (
              <View 
                key={domain.id}
                style={[
                  styles.settingRow,
                  !isLast && styles.settingRowBorder,
                ]}
              >
                <View style={styles.settingLeft}>
                  <Text style={styles.settingEmoji}>{info.emoji}</Text>
                  <Text style={styles.settingLabel}>{info.label}</Text>
                </View>
                <Switch
                  value={domain.notificationsEnabled}
                  onValueChange={(value) => handleDomainToggle(domain.id, domain.type, value)}
                  trackColor={{ false: COLORS.gray700, true: colors.primary }}
                  thumbColor={COLORS.white}
                />
              </View>
            );
          })
        )}
      </View>
      
      {/* Quiet Hours Section */}
      <Text style={styles.sectionTitle}>QUIET HOURS</Text>
      <View style={styles.card}>
        <View style={[styles.settingRow, styles.settingRowBorder]}>
          <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
          <Switch
            value={settings.quietHoursEnabled}
            onValueChange={handleQuietHoursToggle}
            trackColor={{ false: COLORS.gray700, true: COLORS.accent }}
            thumbColor={COLORS.white}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.settingRow, styles.settingRowBorder]}
          onPress={() => setShowStartPicker(true)}
          disabled={!settings.quietHoursEnabled}
        >
          <Text style={[
            styles.settingLabel,
            !settings.quietHoursEnabled && styles.settingLabelDisabled
          ]}>
            Start Time
          </Text>
          <Text style={[
            styles.settingValue,
            !settings.quietHoursEnabled && styles.settingValueDisabled
          ]}>
            {formatTimeForDisplay(settings.quietHoursStart)}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => setShowEndPicker(true)}
          disabled={!settings.quietHoursEnabled}
        >
          <Text style={[
            styles.settingLabel,
            !settings.quietHoursEnabled && styles.settingLabelDisabled
          ]}>
            End Time
          </Text>
          <Text style={[
            styles.settingValue,
            !settings.quietHoursEnabled && styles.settingValueDisabled
          ]}>
            {formatTimeForDisplay(settings.quietHoursEnd)}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionHint}>
        Notifications won't fire during quiet hours. They'll be delayed until quiet hours end.
      </Text>
      
      {/* Display Section */}
      <Text style={styles.sectionTitle}>DISPLAY</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Show Streaks</Text>
            <Text style={styles.settingSubtext}>Display consecutive day counts</Text>
          </View>
          <Switch
            value={settings.streaksEnabled}
            onValueChange={handleStreaksToggle}
            trackColor={{ false: COLORS.gray700, true: COLORS.accent }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>
      
      {/* About Section */}
      <Text style={styles.sectionTitle}>ABOUT</Text>
      <View style={styles.card}>
        <View style={[styles.settingRow, styles.settingRowBorder]}>
          <Text style={styles.settingLabel}>Version</Text>
          <Text style={styles.settingValue}>{appVersion}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleResetData}
        >
          <Text style={[styles.settingLabel, styles.dangerText]}>
            Reset All Data
          </Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>DASH • Daily Actions, Stop Hesitating</Text>
        <Text style={styles.footerSubtext}>You already decided. Just do it.</Text>
      </View>
      
      {/* Time Pickers */}
      {showStartPicker && tempStartTime && (
        <DateTimePicker
          value={tempStartTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            if (event.type === 'dismissed') {
              setShowStartPicker(false);
            } else if (date) {
              handleQuietHoursTimeChange('start', date);
            }
          }}
        />
      )}
      
      {showEndPicker && tempEndTime && (
        <DateTimePicker
          value={tempEndTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            if (event.type === 'dismissed') {
              setShowEndPicker(false);
            } else if (date) {
              handleQuietHoursTimeChange('end', date);
            }
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.gray500,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    marginLeft: SPACING.xs,
  },
  sectionHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray600,
    marginTop: SPACING.sm,
    marginLeft: SPACING.xs,
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 52,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray800,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingEmoji: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  settingLabelDisabled: {
    color: COLORS.gray600,
  },
  settingSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray600,
    marginTop: 2,
  },
  settingValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
  },
  settingValueDisabled: {
    color: COLORS.gray700,
  },
  settingArrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.gray600,
  },
  dangerText: {
    color: COLORS.error,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray600,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray800,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray600,
    marginTop: 4,
  },
});
