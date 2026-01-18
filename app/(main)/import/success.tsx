import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../src/constants/theme';
import { Button } from '../../../src/components/Button';
import { useImportStore } from '../../../src/stores/importStore';
import { useAppStore } from '../../../src/stores/appStore';
import { useExecutionStore } from '../../../src/stores/executionStore';
import { scheduleAllNotifications } from '../../../src/notifications';

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const checkmarkScale = React.useRef(new Animated.Value(0)).current;
  
  const { parsedPlan, saveResult, reset } = useImportStore();
  const { refreshDomains } = useAppStore();
  const { loadTodayState } = useExecutionStore();
  
  // Animate checkmark on mount
  useEffect(() => {
    Animated.spring(checkmarkScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
    
    // Refresh app state
    refreshDomains();
    loadTodayState();
    
    // Reschedule notifications
    scheduleAllNotifications();
  }, []);
  
  // Handle view today
  const handleViewToday = () => {
    reset();
    router.replace('/(main)/today');
  };
  
  // Handle view playbooks
  const handleViewPlaybooks = () => {
    reset();
    router.replace('/(main)/playbooks');
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Success animation */}
        <Animated.View 
          style={[
            styles.checkmarkContainer,
            { transform: [{ scale: checkmarkScale }] }
          ]}
        >
          <Text style={styles.checkmark}>✓</Text>
        </Animated.View>
        
        <Text style={styles.title}>Plan Activated!</Text>
        
        {parsedPlan && (
          <Text style={styles.planName}>{parsedPlan.name}</Text>
        )}
        
        {/* Stats */}
        {saveResult && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{saveResult.domainsCreated || parsedPlan?.domains.length || 0}</Text>
              <Text style={styles.statLabel}>Domains</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{saveResult.playbooksCreated}</Text>
              <Text style={styles.statLabel}>Playbooks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{saveResult.tasksCreated}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
          </View>
        )}
        
        {/* Next notification info */}
        <View style={styles.nextNotification}>
          <Text style={styles.nextNotificationText}>
            Your first notification will arrive at your scheduled time.
          </Text>
          {parsedPlan?.durationWeeks && (
            <Text style={styles.weekInfo}>
              Week 1 of {parsedPlan.durationWeeks} starts now.
            </Text>
          )}
        </View>
      </View>
      
      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <Button
          title="View Today's Tasks"
          onPress={handleViewToday}
          fullWidth
          size="large"
        />
        <Button
          title="View Playbooks"
          onPress={handleViewPlaybooks}
          variant="ghost"
          fullWidth
          size="medium"
          style={styles.secondaryButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  checkmarkContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  checkmark: {
    fontSize: 48,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  planName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray400,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.gray700,
    marginHorizontal: SPACING.md,
  },
  nextNotification: {
    alignItems: 'center',
  },
  nextNotificationText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 22,
  },
  weekInfo: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
  actions: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  secondaryButton: {
    marginTop: SPACING.xs,
  },
});
