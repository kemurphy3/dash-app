import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlaybookTemplate, DomainType } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, DOMAIN_COLORS } from '../constants/theme';
import { formatDuration } from '../utils/time';

interface PlaybookPreviewProps {
  template: PlaybookTemplate;
  selected: boolean;
  onSelect: () => void;
}

export function PlaybookPreview({ template, selected, onSelect }: PlaybookPreviewProps) {
  const colors = DOMAIN_COLORS[template.domainType];
  const totalDuration = template.tasks.reduce((sum, t) => sum + t.durationMinutes, 0);
  
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && {
          borderColor: colors.primary,
          backgroundColor: colors.background,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, selected && { color: colors.primary }]}>
            {template.name}
          </Text>
          {selected && (
            <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.selectedText}>✓</Text>
            </View>
          )}
        </View>
        <Text style={styles.description}>{template.description}</Text>
      </View>
      
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {template.tasks.length} tasks • {formatDuration(totalDuration)}
        </Text>
      </View>
      
      <View style={styles.taskList}>
        {template.tasks.slice(0, 3).map((task, index) => (
          <View key={index} style={styles.taskItem}>
            <View style={[styles.bullet, selected && { backgroundColor: colors.primary }]} />
            <Text style={styles.taskTitle} numberOfLines={1}>
              {task.title}
            </Text>
          </View>
        ))}
        {template.tasks.length > 3 && (
          <Text style={styles.moreText}>
            +{template.tasks.length - 3} more tasks
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.gray800,
    marginBottom: SPACING.md,
  },
  
  header: {
    marginBottom: SPACING.md,
  },
  
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  
  name: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
  },
  
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  
  selectedText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
  },
  
  meta: {
    marginBottom: SPACING.md,
  },
  
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
  },
  
  taskList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray800,
    paddingTop: SPACING.md,
  },
  
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gray600,
    marginRight: SPACING.sm,
  },
  
  taskTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray300,
    flex: 1,
  },
  
  moreText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
});
