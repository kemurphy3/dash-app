import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Card } from '../../../src/components';
import { COLORS, SPACING, FONT_SIZES, DOMAIN_COLORS, BORDER_RADIUS } from '../../../src/constants/theme';
import { useAppStore } from '../../../src/stores/appStore';
import { getDatabase, getPlaybookWithTasks } from '../../../src/db';
import { DOMAIN_INFO, Domain, PlaybookWithTasks } from '../../../src/types';
import { formatTimeForDisplay, formatDuration } from '../../../src/utils/time';

interface DomainWithPlaybook {
  domain: Domain;
  playbook: PlaybookWithTasks | null;
}

export default function PlaybooksScreen() {
  const domains = useAppStore(state => state.domains);
  const [domainsWithPlaybooks, setDomainsWithPlaybooks] = useState<DomainWithPlaybook[]>([]);
  
  const loadPlaybooks = useCallback(async () => {
    const db = getDatabase();
    const results: DomainWithPlaybook[] = [];
    
    for (const domain of domains) {
      let playbook: PlaybookWithTasks | null = null;
      if (domain.activePlaybookId) {
        playbook = await getPlaybookWithTasks(db, domain.activePlaybookId);
      }
      results.push({ domain, playbook });
    }
    
    setDomainsWithPlaybooks(results);
  }, [domains]);
  
  useFocusEffect(
    useCallback(() => {
      loadPlaybooks();
    }, [loadPlaybooks])
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Playbooks</Text>
          <Text style={styles.subtitle}>
            Your pre-built routines. Tap to view or edit.
          </Text>
        </View>
        
        {/* Playbook Cards */}
        <View style={styles.playbooks}>
          {domainsWithPlaybooks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No playbooks yet. Complete onboarding to get started.
              </Text>
            </View>
          ) : (
            domainsWithPlaybooks.map(({ domain, playbook }) => (
              <PlaybookCard
                key={domain.id}
                domain={domain}
                playbook={playbook}
                onPress={() => {
                  if (playbook) {
                    router.push({
                      pathname: '/(main)/playbooks/[id]',
                      params: { id: playbook.id },
                    });
                  }
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlaybookCard({ 
  domain, 
  playbook, 
  onPress 
}: { 
  domain: Domain;
  playbook: PlaybookWithTasks | null;
  onPress: () => void;
}) {
  const info = DOMAIN_INFO[domain.type];
  const colors = DOMAIN_COLORS[domain.type];
  
  const totalDuration = playbook?.tasks.reduce((sum, t) => sum + t.durationMinutes, 0) || 0;
  
  return (
    <TouchableOpacity
      style={[styles.playbookCard, { borderLeftColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!playbook}
    >
      <View style={styles.playbookHeader}>
        <View style={styles.playbookInfo}>
          <Text style={styles.playbookEmoji}>{info.emoji}</Text>
          <View>
            <Text style={[styles.playbookDomain, { color: colors.primary }]}>
              {info.label}
            </Text>
            <Text style={styles.playbookTime}>
              Daily at {formatTimeForDisplay(domain.triggerTime)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.chevron}>→</Text>
      </View>
      
      {playbook ? (
        <>
          <View style={styles.playbookNameRow}>
            <Text style={styles.playbookName}>{playbook.name}</Text>
          </View>
          
          <View style={styles.playbookMeta}>
            <Text style={styles.playbookMetaText}>
              {playbook.tasks.length} tasks
            </Text>
            <Text style={styles.playbookMetaDot}>•</Text>
            <Text style={styles.playbookMetaText}>
              {formatDuration(totalDuration)}
            </Text>
          </View>
          
          {/* Task preview */}
          <View style={styles.taskPreview}>
            {playbook.tasks.slice(0, 3).map((task, index) => (
              <View key={task.id} style={styles.taskPreviewItem}>
                <Text style={styles.taskPreviewNumber}>{index + 1}</Text>
                <Text style={styles.taskPreviewTitle} numberOfLines={1}>
                  {task.title}
                </Text>
              </View>
            ))}
            {playbook.tasks.length > 3 && (
              <Text style={styles.taskPreviewMore}>
                +{playbook.tasks.length - 3} more
              </Text>
            )}
          </View>
        </>
      ) : (
        <View style={styles.noPlaybook}>
          <Text style={styles.noPlaybookText}>No playbook selected</Text>
        </View>
      )}
    </TouchableOpacity>
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
    paddingBottom: SPACING.xxl,
  },
  
  header: {
    marginBottom: SPACING.xl,
  },
  
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    marginTop: SPACING.xs,
  },
  
  playbooks: {
    gap: SPACING.lg,
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
    textAlign: 'center',
  },
  
  playbookCard: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
  },
  
  playbookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  playbookInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  playbookEmoji: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  
  playbookDomain: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  
  playbookTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginTop: 2,
  },
  
  chevron: {
    fontSize: 20,
    color: COLORS.gray500,
  },
  
  playbookNameRow: {
    marginBottom: SPACING.sm,
  },
  
  playbookName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  
  playbookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  playbookMetaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  
  playbookMetaDot: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray600,
    marginHorizontal: SPACING.xs,
  },
  
  taskPreview: {
    backgroundColor: COLORS.gray800,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  
  taskPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  
  taskPreviewNumber: {
    width: 20,
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    fontWeight: '600',
  },
  
  taskPreviewTitle: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray300,
  },
  
  taskPreviewMore: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  
  noPlaybook: {
    padding: SPACING.md,
    backgroundColor: COLORS.gray800,
    borderRadius: BORDER_RADIUS.md,
  },
  
  noPlaybookText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    textAlign: 'center',
  },
});
