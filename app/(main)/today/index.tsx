import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Card, ProgressBar, Button, NotificationPermissionBanner } from '../../../src/components';
import { COLORS, SPACING, FONT_SIZES, DOMAIN_COLORS, BORDER_RADIUS } from '../../../src/constants/theme';
import { useExecutionStore } from '../../../src/stores/executionStore';
import { useAppStore } from '../../../src/stores/appStore';
import { DOMAIN_INFO, Domain } from '../../../src/types';
import { formatTimeForDisplay } from '../../../src/utils/time';
import { getRelativeDayLabel } from '../../../src/utils/date';
import { analytics } from '../../../src/utils/analytics';

export default function TodayScreen() {
  const { 
    loadTodayState, 
    getTodayOverview, 
    getDomainProgress,
    getCurrentTask,
    setActiveDomain,
    isLoading,
  } = useExecutionStore();
  
  const domains = useAppStore(state => state.domains);
  
  // Load state on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTodayState();
      analytics.appOpened('direct');
    }, [])
  );
  
  const overview = getTodayOverview();
  
  const handleStartDomain = (domainId: string) => {
    setActiveDomain(domainId);
    router.push({
      pathname: '/(main)/today/task',
      params: { domainId },
    });
  };
  
  const overallProgress = overview.totalTasks > 0 
    ? (overview.completedTasks / overview.totalTasks) * 100 
    : 0;
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadTodayState}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.date}>{getRelativeDayLabel(new Date())}</Text>
        </View>
        
        {/* Notification Permission Warning */}
        <View style={styles.permissionBanner}>
          <NotificationPermissionBanner />
        </View>
        
        {/* Overall Progress */}
        {overview.totalTasks > 0 && (
          <View style={styles.overallProgress}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Today's progress</Text>
              <Text style={styles.progressValue}>
                {overview.completedTasks}/{overview.totalTasks} tasks
              </Text>
            </View>
            <ProgressBar 
              progress={overallProgress} 
              color={overallProgress === 100 ? COLORS.success : COLORS.accent}
              height={10}
            />
            {overallProgress === 100 && (
              <Text style={styles.completedMessage}>
                🎉 All done for today!
              </Text>
            )}
          </View>
        )}
        
        {/* Domain Cards */}
        <View style={styles.domains}>
          <Text style={styles.sectionTitle}>Your routines</Text>
          
          {overview.domains.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No routines set up yet.
              </Text>
              <Button
                title="Go to Playbooks"
                onPress={() => router.push('/(main)/playbooks')}
                variant="secondary"
                size="small"
              />
            </View>
          ) : (
            overview.domains.map(({ domain, progress, isCompleted }) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                progress={progress}
                isCompleted={isCompleted}
                currentTask={getCurrentTask(domain.id)}
                onStart={() => handleStartDomain(domain.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DomainCard({ 
  domain, 
  progress, 
  isCompleted,
  currentTask,
  onStart,
}: { 
  domain: Domain;
  progress: number;
  isCompleted: boolean;
  currentTask: any;
  onStart: () => void;
}) {
  const info = DOMAIN_INFO[domain.type];
  const colors = DOMAIN_COLORS[domain.type];
  
  return (
    <TouchableOpacity
      style={[
        styles.domainCard,
        { borderLeftColor: colors.primary },
        isCompleted && styles.domainCardCompleted,
      ]}
      onPress={onStart}
      activeOpacity={0.7}
      disabled={isCompleted}
    >
      <View style={styles.domainHeader}>
        <View style={styles.domainInfo}>
          <Text style={styles.domainEmoji}>{info.emoji}</Text>
          <View>
            <Text style={[styles.domainName, isCompleted && styles.domainNameCompleted]}>
              {info.label}
            </Text>
            <Text style={styles.domainTime}>
              {formatTimeForDisplay(domain.triggerTime)}
            </Text>
          </View>
        </View>
        
        {isCompleted ? (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✓ Done</Text>
          </View>
        ) : (
          <View style={[styles.startButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.startButtonText}>Start →</Text>
          </View>
        )}
      </View>
      
      <ProgressBar 
        progress={progress} 
        color={isCompleted ? COLORS.success : colors.primary}
        backgroundColor={COLORS.gray800}
        height={6}
        style={styles.domainProgress}
      />
      
      {!isCompleted && currentTask && (
        <View style={styles.nextTask}>
          <Text style={styles.nextTaskLabel}>Next up:</Text>
          <Text style={styles.nextTaskTitle} numberOfLines={1}>
            {currentTask.title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  
  scrollView: {
    flex: 1,
  },
  
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  
  header: {
    marginBottom: SPACING.xl,
  },
  
  permissionBanner: {
    marginBottom: SPACING.lg,
  },
  
  greeting: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  
  date: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray400,
    marginTop: SPACING.xs,
  },
  
  overallProgress: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  progressLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
  },
  
  progressValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
  
  completedMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  
  domains: {
    gap: SPACING.md,
  },
  
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
  },
  
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    marginBottom: SPACING.md,
  },
  
  domainCard: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
  },
  
  domainCardCompleted: {
    opacity: 0.7,
  },
  
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  domainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  domainEmoji: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  
  domainName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  
  domainNameCompleted: {
    color: COLORS.gray400,
  },
  
  domainTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginTop: 2,
  },
  
  startButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  
  startButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  
  completedBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
  },
  
  completedBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  
  domainProgress: {
    marginBottom: SPACING.md,
  },
  
  nextTask: {
    backgroundColor: COLORS.gray800,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  nextTaskLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    marginBottom: 2,
  },
  
  nextTaskTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '500',
  },
});
