import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task, TaskStatus } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { formatDuration } from '../utils/time';

interface TaskItemProps {
  task: Task;
  status?: TaskStatus;
  onPress?: () => void;
  onDelete?: () => void;
  showDuration?: boolean;
  showStatus?: boolean;
  compact?: boolean;
}

export function TaskItem({ 
  task, 
  status,
  onPress, 
  onDelete,
  showDuration = true,
  showStatus = false,
  compact = false,
}: TaskItemProps) {
  const isCompleted = status === 'completed';
  const isSkipped = status === 'skipped';
  
  const content = (
    <View style={[
      styles.container,
      compact && styles.compact,
      isCompleted && styles.completed,
      isSkipped && styles.skipped,
    ]}>
      <View style={styles.content}>
        {showStatus && (
          <View style={[
            styles.statusIndicator,
            isCompleted && styles.statusCompleted,
            isSkipped && styles.statusSkipped,
          ]}>
            {isCompleted && <Text style={styles.statusIcon}>✓</Text>}
            {isSkipped && <Text style={styles.statusIcon}>−</Text>}
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text 
            style={[
              styles.title,
              (isCompleted || isSkipped) && styles.titleDone,
            ]}
            numberOfLines={compact ? 1 : 2}
          >
            {task.title}
          </Text>
          
          {!compact && task.description && (
            <Text style={styles.description} numberOfLines={2}>
              {task.description}
            </Text>
          )}
        </View>
        
        {showDuration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(task.durationMinutes)}
            </Text>
          </View>
        )}
        
        {onDelete && (
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  
  return content;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray800,
  },
  
  compact: {
    padding: SPACING.sm,
  },
  
  completed: {
    opacity: 0.7,
    borderColor: COLORS.success,
    borderLeftWidth: 3,
  },
  
  skipped: {
    opacity: 0.5,
    borderColor: COLORS.gray600,
    borderLeftWidth: 3,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.gray600,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  
  statusCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  
  statusSkipped: {
    backgroundColor: COLORS.gray700,
    borderColor: COLORS.gray700,
  },
  
  statusIcon: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  textContainer: {
    flex: 1,
  },
  
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.white,
  },
  
  titleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.gray400,
  },
  
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginTop: 4,
  },
  
  durationBadge: {
    backgroundColor: COLORS.gray800,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  
  durationText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray400,
  },
  
  deleteButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  
  deleteText: {
    fontSize: 24,
    color: COLORS.gray500,
    fontWeight: '300',
  },
});
