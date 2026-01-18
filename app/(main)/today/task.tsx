import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '../../../src/components';
import { COLORS, SPACING, FONT_SIZES, DOMAIN_COLORS, BORDER_RADIUS } from '../../../src/constants/theme';
import { useExecutionStore } from '../../../src/stores/executionStore';
import { DOMAIN_INFO } from '../../../src/types';
import { formatDuration, calculateSnoozeTime } from '../../../src/utils/time';
import { scheduleSnoozeNotification } from '../../../src/notifications';
import { analytics } from '../../../src/utils/analytics';

export default function TaskScreen() {
  const { domainId } = useLocalSearchParams<{ domainId: string }>();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    domainStates,
    completeTask,
    skipTask,
    getCurrentTask,
    getDomainProgress,
    setActiveDomain,
    loadDomainState,
  } = useExecutionStore();
  
  useEffect(() => {
    if (domainId) {
      setActiveDomain(domainId);
      loadDomainState(domainId);
    }
    
    return () => setActiveDomain(null);
  }, [domainId]);
  
  const domainState = domainId ? domainStates.get(domainId) : null;
  const currentTask = domainId ? getCurrentTask(domainId) : null;
  const progress = domainId ? getDomainProgress(domainId) : { completed: 0, total: 0, percentage: 0 };
  
  if (!domainState || !domainId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Domain not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }
  
  const info = DOMAIN_INFO[domainState.domain.type];
  const colors = DOMAIN_COLORS[domainState.domain.type];
  
  // Playbook completed
  if (domainState.isCompleted || !currentTask) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.completedState}>
          <Text style={styles.completedEmoji}>🎉</Text>
          <Text style={styles.completedTitle}>Playbook Complete!</Text>
          <Text style={styles.completedSubtitle}>
            You finished all {progress.total} tasks in {info.label}
          </Text>
          
          <View style={styles.completedStats}>
            <View style={styles.completedStat}>
              <Text style={[styles.completedStatValue, { color: COLORS.success }]}>
                {progress.completed}
              </Text>
              <Text style={styles.completedStatLabel}>Completed</Text>
            </View>
            <View style={styles.completedStat}>
              <Text style={[styles.completedStatValue, { color: COLORS.gray400 }]}>
                {progress.total - progress.completed}
              </Text>
              <Text style={styles.completedStatLabel}>Skipped</Text>
            </View>
          </View>
          
          <Button
            title="Back to Today"
            onPress={() => router.back()}
            size="large"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const handleDone = async () => {
    setIsProcessing(true);
    try {
      await completeTask(domainId);
      analytics.taskCompleted(currentTask.id, domainState.domain.type);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSkip = async () => {
    setIsProcessing(true);
    try {
      await skipTask(domainId);
      analytics.taskSkipped(currentTask.id, domainState.domain.type);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSnooze = async () => {
    const snoozeMinutes = 30;
    const snoozeUntil = calculateSnoozeTime(30);
    
    analytics.taskSnoozed(currentTask.id, domainState.domain.type, snoozeMinutes);
    
    await scheduleSnoozeNotification(
      domainState.domain,
      currentTask.title,
      snoozeUntil
    );
    
    Alert.alert(
      'Snoozed for 30 minutes',
      'We\'ll remind you soon.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };
  
  const taskNumber = domainState.currentTaskIndex + 1;
  const totalTasks = domainState.tasks.length;
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerEmoji}>{info.emoji}</Text>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>
            {info.label}
          </Text>
        </View>
        
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {taskNumber}/{totalTasks}
          </Text>
        </View>
      </View>
      
      {/* Task Content */}
      <View style={styles.taskContent}>
        <View style={[styles.taskCard, { borderColor: colors.primary }]}>
          <Text style={styles.taskTitle}>{currentTask.title}</Text>
          
          {currentTask.description && (
            <Text style={styles.taskDescription}>{currentTask.description}</Text>
          )}
          
          <View style={[styles.durationBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.durationText, { color: colors.primary }]}>
              ⏱ {formatDuration(currentTask.durationMinutes)}
            </Text>
          </View>
        </View>
        
        {/* Reminder Text */}
        <Text style={styles.reminderText}>
          You already decided to do this. Just execute.
        </Text>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Done ✓"
          onPress={handleDone}
          size="large"
          fullWidth
          loading={isProcessing}
          style={[styles.doneButton, { backgroundColor: colors.primary }]}
        />
        
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSkip}
            disabled={isProcessing}
          >
            <Text style={styles.secondaryButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSnooze}
            disabled={isProcessing}
          >
            <Text style={styles.secondaryButtonText}>Snooze 30m</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray400,
    marginBottom: SPACING.lg,
  },
  
  completedState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  
  completedEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  
  completedTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  
  completedSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  
  completedStats: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  
  completedStat: {
    alignItems: 'center',
  },
  
  completedStatValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
  },
  
  completedStatLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  
  backButton: {
    minWidth: 200,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray800,
  },
  
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray800,
    borderRadius: BORDER_RADIUS.full,
  },
  
  closeButtonText: {
    fontSize: 20,
    color: COLORS.gray400,
  },
  
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  headerEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  
  progressBadge: {
    backgroundColor: COLORS.gray800,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  
  progressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray300,
    fontWeight: '600',
  },
  
  taskContent: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  
  taskCard: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 2,
    alignItems: 'center',
  },
  
  taskTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  
  taskDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  
  durationBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  
  durationText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  
  reminderText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: SPACING.xl,
    fontStyle: 'italic',
  },
  
  actions: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  
  doneButton: {
    marginBottom: SPACING.md,
  },
  
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  
  secondaryButton: {
    padding: SPACING.md,
  },
  
  secondaryButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    fontWeight: '500',
  },
});
