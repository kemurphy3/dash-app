import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, DOMAIN_COLORS } from '../../../src/constants/theme';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { useImportStore } from '../../../src/stores/importStore';
import { DOMAIN_INFO, DomainType } from '../../../src/types';
import { formatTimeForDisplay, formatDuration } from '../../../src/utils/time';

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  
  const { 
    parsedPlan, 
    issues, 
    checkConflicts, 
    step,
  } = useImportStore();
  
  const isSaving = step === 'saving';
  
  // Handle activation
  const handleActivate = useCallback(async () => {
    await checkConflicts();
    
    const currentStep = useImportStore.getState().step;
    if (currentStep === 'conflicts') {
      router.push('/(main)/import/conflicts');
    } else if (currentStep === 'success') {
      router.replace('/(main)/import/success');
    }
  }, [checkConflicts]);
  
  if (!parsedPlan) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No plan to preview</Text>
      </View>
    );
  }
  
  // Count totals
  const totalPlaybooks = parsedPlan.domains.reduce((sum, d) => sum + d.playbooks.length, 0);
  const totalTasks = parsedPlan.domains.reduce(
    (sum, d) => sum + d.playbooks.reduce((pSum, p) => pSum + p.tasks.length, 0),
    0
  );
  
  // Filter issues
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');
  const autoFixes = issues.filter(i => i.autoFixed);
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 }
        ]}
      >
        {/* Plan header */}
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{parsedPlan.name}</Text>
          {parsedPlan.description && (
            <Text style={styles.planDescription}>{parsedPlan.description}</Text>
          )}
          
          <View style={styles.statsRow}>
            {parsedPlan.durationWeeks && (
              <View style={styles.statBadge}>
                <Text style={styles.statText}>{parsedPlan.durationWeeks} weeks</Text>
              </View>
            )}
            <View style={styles.statBadge}>
              <Text style={styles.statText}>{parsedPlan.domains.length} domains</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statText}>{totalPlaybooks} playbooks</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statText}>{totalTasks} tasks</Text>
            </View>
          </View>
        </View>
        
        {/* Auto-fixes notice */}
        {autoFixes.length > 0 && (
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>ℹ️ {autoFixes.length} automatic adjustments made</Text>
            <Text style={styles.infoText}>
              {autoFixes.map(f => f.message).slice(0, 3).join(' • ')}
              {autoFixes.length > 3 && ` • and ${autoFixes.length - 3} more`}
            </Text>
          </Card>
        )}
        
        {/* Warnings */}
        {warnings.length > 0 && (
          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ {warnings.length} warnings</Text>
            {warnings.slice(0, 3).map((w, i) => (
              <Text key={i} style={styles.warningText}>• {w.message}</Text>
            ))}
            {warnings.length > 3 && (
              <Text style={styles.warningText}>• and {warnings.length - 3} more...</Text>
            )}
          </Card>
        )}
        
        {/* Domains */}
        <Text style={styles.sectionTitle}>Domains & Playbooks</Text>
        
        {parsedPlan.domains.map((domain, index) => {
          const domainInfo = DOMAIN_INFO[domain.type];
          const colors = DOMAIN_COLORS[domain.type];
          const isExpanded = expandedDomain === domain.type;
          
          return (
            <Card 
              key={index}
              style={[
                styles.domainCard,
                { borderLeftColor: colors.primary, borderLeftWidth: 4 }
              ]}
            >
              <TouchableOpacity 
                style={styles.domainHeader}
                onPress={() => setExpandedDomain(isExpanded ? null : domain.type)}
              >
                <View style={styles.domainInfo}>
                  <Text style={styles.domainEmoji}>{domainInfo.emoji}</Text>
                  <View>
                    <Text style={[styles.domainName, { color: colors.primary }]}>
                      {domainInfo.label}
                    </Text>
                    <Text style={styles.domainTime}>
                      {formatTimeForDisplay(domain.triggerTime)} • {domain.playbooks.length} playbook{domain.playbooks.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.playbooksList}>
                  {domain.playbooks.map((playbook, pIndex) => (
                    <View key={pIndex} style={styles.playbookItem}>
                      <View style={styles.playbookHeader}>
                        <Text style={styles.playbookName}>{playbook.name}</Text>
                        <View style={styles.playbookMeta}>
                          {playbook.weekStart && playbook.weekEnd && (
                            <Text style={styles.playbookWeeks}>
                              Weeks {playbook.weekStart}-{playbook.weekEnd}
                            </Text>
                          )}
                          {playbook.activeDays && (
                            <Text style={styles.playbookDays}>
                              {playbook.activeDays.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')}
                            </Text>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.tasksList}>
                        {playbook.tasks.slice(0, 3).map((task, tIndex) => (
                          <View key={tIndex} style={styles.taskItem}>
                            <Text style={styles.taskTitle} numberOfLines={1}>
                              {task.title}
                            </Text>
                            <Text style={styles.taskDuration}>
                              {formatDuration(task.durationMinutes)}
                            </Text>
                          </View>
                        ))}
                        {playbook.tasks.length > 3 && (
                          <Text style={styles.moreTasks}>
                            +{playbook.tasks.length - 3} more tasks
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>
      
      {/* Bottom action */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Text style={styles.activateNote}>
          This will create playbooks in {parsedPlan.domains.length} domain{parsedPlan.domains.length !== 1 ? 's' : ''} and schedule notifications.
        </Text>
        <Button
          title={isSaving ? 'Activating...' : 'Activate This Plan'}
          onPress={handleActivate}
          disabled={isSaving}
          loading={isSaving}
          fullWidth
          size="large"
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  errorText: {
    color: COLORS.gray400,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  },
  planHeader: {
    marginBottom: SPACING.lg,
  },
  planName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  planDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statBadge: {
    backgroundColor: COLORS.gray800,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray300,
  },
  infoCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: COLORS.gray700,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.gray300,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  warningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: COLORS.warning,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  warningTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: SPACING.sm,
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  domainCard: {
    marginBottom: SPACING.md,
  },
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  domainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  domainEmoji: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  domainName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  domainTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginTop: 2,
  },
  expandIcon: {
    color: COLORS.gray500,
    fontSize: FONT_SIZES.sm,
  },
  playbooksList: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray800,
    paddingTop: SPACING.md,
  },
  playbookItem: {
    marginBottom: SPACING.md,
  },
  playbookHeader: {
    marginBottom: SPACING.sm,
  },
  playbookName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.white,
  },
  playbookMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 4,
  },
  playbookWeeks: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    backgroundColor: COLORS.gray800,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  playbookDays: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    backgroundColor: COLORS.gray800,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  tasksList: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  taskTitle: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray300,
    marginRight: SPACING.sm,
  },
  taskDuration: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray600,
  },
  moreTasks: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    fontStyle: 'italic',
    paddingTop: SPACING.xs,
    textAlign: 'center',
  },
  bottomAction: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray900,
    backgroundColor: COLORS.black,
  },
  activateNote: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
});
