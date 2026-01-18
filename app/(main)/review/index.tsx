import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, DOMAIN_COLORS } from '../../../src/constants/theme';
import { Card, ProgressBar } from '../../../src/components';
import { getDatabase, getWeeklyStats } from '../../../src/db';
import { WeeklyStats, DomainStat, DOMAIN_INFO, DomainType } from '../../../src/types';
import { format, parseISO } from 'date-fns';

export default function ReviewScreen() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = getDatabase();
      const weeklyStats = await getWeeklyStats(db);
      setStats(weeklyStats);
    } catch (error) {
      console.error('[Review] Failed to load stats:', error);
    }
    setIsLoading(false);
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );
  
  const formatWeekRange = (start: string, end: string): string => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
    } catch {
      return 'This Week';
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadStats}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Week</Text>
          {stats && (
            <Text style={styles.dateRange}>
              {formatWeekRange(stats.weekStart, stats.weekEnd)}
            </Text>
          )}
        </View>
        
        {stats && stats.totalTasks > 0 ? (
          <>
            {/* Main Achievement Card */}
            <MainAchievementCard stats={stats} />
            
            {/* Domain Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>By Domain</Text>
              <View style={styles.domainCards}>
                {stats.domainStats.map((domainStat) => (
                  <DomainStatCard key={domainStat.domainType} stat={domainStat} />
                ))}
              </View>
            </View>
            
            {/* Insights Section - Positive framing */}
            {stats.mostConsistentDomain && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Highlights</Text>
                <Card style={styles.insightCard}>
                  <Text style={styles.insightEmoji}>
                    {DOMAIN_INFO[stats.mostConsistentDomain].emoji}
                  </Text>
                  <View style={styles.insightContent}>
                    <Text style={styles.insightTitle}>
                      Most Consistent
                    </Text>
                    <Text style={styles.insightText}>
                      Your {DOMAIN_INFO[stats.mostConsistentDomain].label.toLowerCase()} routine had the highest completion rate this week.
                    </Text>
                  </View>
                </Card>
              </View>
            )}
            
            {/* Action CTA */}
            <View style={styles.actionSection}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(main)/playbooks')}
              >
                <Text style={styles.actionButtonText}>Review & Adjust Playbooks</Text>
                <Text style={styles.actionButtonSubtext}>
                  Fine-tune your routines based on this week's experience
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// Main Achievement Card
// ============================================================

function MainAchievementCard({ stats }: { stats: WeeklyStats }) {
  const completionRate = stats.totalTasks > 0 
    ? stats.completedTasks / stats.totalTasks 
    : 0;
  const { emoji, message } = getCompletionMessage(completionRate);
  
  return (
    <Card style={styles.achievementCard}>
      <View style={styles.achievementHeader}>
        <Text style={styles.achievementEmoji}>{emoji}</Text>
        <Text style={styles.achievementMessage}>{message}</Text>
      </View>
      
      <View style={styles.achievementStats}>
        <View style={styles.mainStat}>
          <Text style={styles.mainStatNumber}>{stats.completedTasks}</Text>
          <Text style={styles.mainStatLabel}>tasks completed</Text>
        </View>
        
        <View style={styles.secondaryStats}>
          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryStatNumber}>{stats.totalTasks}</Text>
            <Text style={styles.secondaryStatLabel}>scheduled</Text>
          </View>
          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryStatNumber}>
              {Math.round(completionRate * 100)}%
            </Text>
            <Text style={styles.secondaryStatLabel}>completion</Text>
          </View>
        </View>
      </View>
      
      <ProgressBar 
        progress={completionRate * 100} 
        color={completionRate >= 0.7 ? COLORS.success : COLORS.accent}
        height={8}
        style={styles.achievementProgress}
      />
    </Card>
  );
}

function getCompletionMessage(rate: number): { emoji: string; message: string } {
  if (rate >= 0.9) return { emoji: '🌟', message: "Outstanding week!" };
  if (rate >= 0.7) return { emoji: '💪', message: "Great progress!" };
  if (rate >= 0.5) return { emoji: '👍', message: "Solid effort!" };
  if (rate >= 0.3) return { emoji: '🌱', message: "Building momentum" };
  if (rate > 0) return { emoji: '🚀', message: "Every step counts" };
  return { emoji: '✨', message: "Ready for a fresh start" };
}

// ============================================================
// Domain Stat Card
// ============================================================

function DomainStatCard({ stat }: { stat: DomainStat }) {
  const domainInfo = DOMAIN_INFO[stat.domainType];
  const colors = DOMAIN_COLORS[stat.domainType];
  
  return (
    <Card 
      style={[styles.domainCard, { borderLeftColor: colors.primary, borderLeftWidth: 3 }]}
    >
      <View style={styles.domainCardHeader}>
        <Text style={styles.domainCardEmoji}>{domainInfo.emoji}</Text>
        <Text style={[styles.domainCardName, { color: colors.primary }]}>
          {domainInfo.label}
        </Text>
      </View>
      
      <View style={styles.domainCardStats}>
        <Text style={styles.domainCardNumber}>
          {stat.completedTasks}
          <Text style={styles.domainCardTotal}>/{stat.totalTasks}</Text>
        </Text>
        <Text style={styles.domainCardLabel}>completed</Text>
      </View>
      
      <ProgressBar 
        progress={stat.completionRate * 100}
        color={colors.primary}
        backgroundColor={colors.background}
        height={4}
      />
    </Card>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📊</Text>
      <Text style={styles.emptyTitle}>No activity yet this week</Text>
      <Text style={styles.emptyText}>
        Complete some tasks and your weekly review will appear here.
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/(main)/today')}
      >
        <Text style={styles.emptyButtonText}>Go to Today</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

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
  
  // Header
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  dateRange: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    marginTop: SPACING.xs,
  },
  
  // Achievement Card
  achievementCard: {
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.gray900,
  },
  achievementHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  achievementEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  achievementMessage: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  achievementStats: {
    marginBottom: SPACING.lg,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  mainStatNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: COLORS.accent,
    lineHeight: 60,
  },
  mainStatLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  secondaryStat: {
    alignItems: 'center',
  },
  secondaryStatNumber: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryStatLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  achievementProgress: {
    marginTop: SPACING.sm,
  },
  
  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  
  // Domain Cards
  domainCards: {
    gap: SPACING.md,
  },
  domainCard: {
    padding: SPACING.md,
  },
  domainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  domainCardEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  domainCardName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  domainCardStats: {
    marginBottom: SPACING.sm,
  },
  domainCardNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  domainCardTotal: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '400',
    color: COLORS.gray500,
  },
  domainCardLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  
  // Insight Card
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  insightEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  insightText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    lineHeight: 20,
  },
  
  // Action Section
  actionSection: {
    marginTop: SPACING.md,
  },
  actionButton: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray800,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  emptyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
