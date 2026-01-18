import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, DOMAIN_COLORS } from '../../../src/constants/theme';
import { Button } from '../../../src/components/Button';
import { useAppStore } from '../../../src/stores/appStore';
import { getDatabase, getPlaybookWithTasks, getDomainById } from '../../../src/db';
import { PlaybookWithTasks, Task, Domain, DOMAIN_INFO } from '../../../src/types';
import { formatTimeForDisplay, formatDuration } from '../../../src/utils/time';
import { scheduleAllNotifications } from '../../../src/notifications';

export default function PlaybookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { renamePlaybook, addTask, editTask, removeTask, reorderPlaybookTasks } = useAppStore();
  
  const [playbook, setPlaybook] = useState<PlaybookWithTasks | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load playbook data
  const loadPlaybook = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    const db = getDatabase();
    const data = await getPlaybookWithTasks(db, id);
    
    if (data) {
      setPlaybook(data);
      setEditedName(data.name);
      
      const domainData = await getDomainById(db, data.domainId);
      setDomain(domainData);
    }
    
    setIsLoading(false);
  }, [id]);
  
  useEffect(() => {
    loadPlaybook();
  }, [loadPlaybook]);
  
  // Handle save name
  const handleSaveName = useCallback(async () => {
    if (!playbook || !editedName.trim()) return;
    
    await renamePlaybook(playbook.id, editedName.trim());
    setPlaybook(prev => prev ? { ...prev, name: editedName.trim() } : null);
    setIsEditingName(false);
  }, [playbook, editedName, renamePlaybook]);
  
  // Handle delete task
  const handleDeleteTask = useCallback((task: Task) => {
    Alert.alert(
      'Remove Task',
      `Remove "${task.title}" from this playbook?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeTask(task.id);
            await loadPlaybook();
            await scheduleAllNotifications();
          },
        },
      ]
    );
  }, [removeTask, loadPlaybook]);
  
  // Handle reorder (move up/down)
  const handleMoveTask = useCallback(async (taskIndex: number, direction: 'up' | 'down') => {
    if (!playbook) return;
    
    const newTasks = [...playbook.tasks];
    const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= newTasks.length) return;
    
    // Swap tasks
    [newTasks[taskIndex], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[taskIndex]];
    
    // Update order in database
    await reorderPlaybookTasks(playbook.id, newTasks.map(t => t.id));
    await loadPlaybook();
    await scheduleAllNotifications();
  }, [playbook, reorderPlaybookTasks, loadPlaybook]);
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!playbook || !domain) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Playbook not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }
  
  const domainInfo = DOMAIN_INFO[domain.type];
  const colors = DOMAIN_COLORS[domain.type];
  const totalDuration = playbook.tasks.reduce((sum, t) => sum + t.durationMinutes, 0);
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Domain Header */}
          <View style={[styles.domainHeader, { borderLeftColor: colors.primary }]}>
            <Text style={styles.domainEmoji}>{domainInfo.emoji}</Text>
            <View>
              <Text style={[styles.domainName, { color: colors.primary }]}>
                {domainInfo.label}
              </Text>
              <Text style={styles.domainTime}>
                Daily at {formatTimeForDisplay(domain.triggerTime)}
              </Text>
            </View>
          </View>
          
          {/* Playbook Name */}
          <View style={styles.nameSection}>
            {isEditingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Playbook name"
                  placeholderTextColor={COLORS.gray600}
                  autoFocus
                  selectTextOnFocus
                />
                <TouchableOpacity 
                  style={styles.nameButton}
                  onPress={handleSaveName}
                >
                  <Text style={styles.nameButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.nameButton, styles.cancelButton]}
                  onPress={() => {
                    setEditedName(playbook.name);
                    setIsEditingName(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.nameDisplay}
                onPress={() => setIsEditingName(true)}
              >
                <Text style={styles.playbookName}>{playbook.name}</Text>
                <Text style={styles.editHint}>Tap to edit</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {playbook.tasks.length} tasks
              </Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>
                {formatDuration(totalDuration)} total
              </Text>
            </View>
          </View>
          
          {/* Tasks List */}
          <View style={styles.tasksSection}>
            <View style={styles.tasksSectionHeader}>
              <Text style={styles.sectionTitle}>Tasks</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowAddTask(true)}
              >
                <Text style={styles.addButtonText}>+ Add Task</Text>
              </TouchableOpacity>
            </View>
            
            {playbook.tasks.length === 0 ? (
              <View style={styles.emptyTasks}>
                <Text style={styles.emptyText}>No tasks yet</Text>
                <Text style={styles.emptySubtext}>
                  Add your first task to get started
                </Text>
              </View>
            ) : (
              playbook.tasks.map((task, index) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === playbook.tasks.length - 1}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleDeleteTask(task)}
                  onMoveUp={() => handleMoveTask(index, 'up')}
                  onMoveDown={() => handleMoveTask(index, 'down')}
                />
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Add Task Modal */}
      <TaskEditModal
        visible={showAddTask}
        task={null}
        onSave={async (title, description, duration) => {
          await addTask(playbook.id, title, description, duration);
          await loadPlaybook();
          await scheduleAllNotifications();
          setShowAddTask(false);
        }}
        onClose={() => setShowAddTask(false)}
      />
      
      {/* Edit Task Modal */}
      <TaskEditModal
        visible={!!editingTask}
        task={editingTask}
        onSave={async (title, description, duration) => {
          if (editingTask) {
            await editTask(editingTask.id, { title, description, durationMinutes: duration });
            await loadPlaybook();
            await scheduleAllNotifications();
          }
          setEditingTask(null);
        }}
        onClose={() => setEditingTask(null)}
      />
    </SafeAreaView>
  );
}

// ============================================================
// Task Row Component
// ============================================================

interface TaskRowProps {
  task: Task;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function TaskRow({ 
  task, 
  index, 
  isFirst, 
  isLast, 
  onEdit, 
  onDelete,
  onMoveUp,
  onMoveDown,
}: TaskRowProps) {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <View style={styles.taskRow}>
      <View style={styles.taskNumber}>
        <Text style={styles.taskNumberText}>{index + 1}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.taskContent}
        onPress={() => setShowActions(!showActions)}
        activeOpacity={0.7}
      >
        <View style={styles.taskMain}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          {task.description && (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {task.description}
            </Text>
          )}
          <Text style={styles.taskDuration}>
            {formatDuration(task.durationMinutes)}
          </Text>
        </View>
        
        <Text style={styles.taskChevron}>{showActions ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      
      {showActions && (
        <View style={styles.taskActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onEdit}
          >
            <Text style={styles.actionButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, isFirst && styles.actionButtonDisabled]}
            onPress={onMoveUp}
            disabled={isFirst}
          >
            <Text style={[styles.actionButtonText, isFirst && styles.actionButtonTextDisabled]}>
              ↑ Move Up
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, isLast && styles.actionButtonDisabled]}
            onPress={onMoveDown}
            disabled={isLast}
          >
            <Text style={[styles.actionButtonText, isLast && styles.actionButtonTextDisabled]}>
              ↓ Move Down
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={onDelete}
          >
            <Text style={styles.deleteButtonText}>🗑️ Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ============================================================
// Task Edit Modal
// ============================================================

interface TaskEditModalProps {
  visible: boolean;
  task: Task | null;
  onSave: (title: string, description: string | null, duration: number) => Promise<void>;
  onClose: () => void;
}

function TaskEditModal({ visible, task, onSave, onClose }: TaskEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('5');
  const [isSaving, setIsSaving] = useState(false);
  
  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDuration(task.durationMinutes.toString());
    } else {
      setTitle('');
      setDescription('');
      setDuration('5');
    }
  }, [task, visible]);
  
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }
    
    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 120) {
      Alert.alert('Error', 'Duration must be between 1 and 120 minutes');
      return;
    }
    
    setIsSaving(true);
    await onSave(title.trim(), description.trim() || null, durationNum);
    setIsSaving(false);
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {task ? 'Edit Task' : 'Add Task'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text style={[styles.modalSave, isSaving && styles.modalSaveDisabled]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Task Title *</Text>
            <TextInput
              style={styles.formInput}
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to be done?"
              placeholderTextColor={COLORS.gray600}
              autoFocus={!task}
            />
            <Text style={styles.formHint}>
              Be specific. "Do 20 pushups" is better than "Exercise"
            </Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Additional details or instructions"
              placeholderTextColor={COLORS.gray600}
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Duration (minutes)</Text>
            <TextInput
              style={[styles.formInput, styles.formInputSmall]}
              value={duration}
              onChangeText={setDuration}
              placeholder="5"
              placeholderTextColor={COLORS.gray600}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.formHint}>
              How long will this typically take? (1-120 minutes)
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  
  // Loading/Error states
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.gray400,
  },
  
  // Domain header
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 4,
    marginBottom: SPACING.lg,
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
  
  // Name section
  nameSection: {
    marginBottom: SPACING.xl,
  },
  nameDisplay: {
    marginBottom: SPACING.sm,
  },
  playbookName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
  },
  editHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray600,
    marginTop: 4,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  nameInput: {
    flex: 1,
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    fontWeight: '600',
  },
  nameButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  nameButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  cancelButton: {
    backgroundColor: COLORS.gray800,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.gray300,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  metaDot: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray600,
    marginHorizontal: SPACING.xs,
  },
  
  // Tasks section
  tasksSection: {
    flex: 1,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  addButton: {
    backgroundColor: COLORS.gray800,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  addButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.accent,
  },
  emptyTasks: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray600,
  },
  
  // Task row
  taskRow: {
    marginBottom: SPACING.sm,
  },
  taskNumber: {
    position: 'absolute',
    left: 0,
    top: SPACING.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray800,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  taskNumberText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.gray400,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    paddingLeft: 40,
  },
  taskMain: {
    flex: 1,
  },
  taskTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: 2,
  },
  taskDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginBottom: 4,
  },
  taskDuration: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray600,
  },
  taskChevron: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginLeft: SPACING.sm,
  },
  taskActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingLeft: 40,
  },
  actionButton: {
    backgroundColor: COLORS.gray800,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray300,
  },
  actionButtonTextDisabled: {
    color: COLORS.gray600,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray800,
  },
  modalCancel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalSave: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.accent,
  },
  modalSaveDisabled: {
    color: COLORS.gray600,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.xl,
  },
  formLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.gray400,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray800,
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formInputSmall: {
    width: 100,
  },
  formHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray600,
    marginTop: SPACING.sm,
  },
});
