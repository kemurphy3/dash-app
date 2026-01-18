import React, { useCallback } from 'react';
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

export default function ConflictsScreen() {
  const insets = useSafeAreaInsets();
  
  const { 
    conflicts, 
    conflictResolutions, 
    setConflictResolution,
    saveImport,
    step,
  } = useImportStore();
  
  const isSaving = step === 'saving';
  
  // Handle continue
  const handleContinue = useCallback(async () => {
    await saveImport();
    
    const currentStep = useImportStore.getState().step;
    if (currentStep === 'success') {
      router.replace('/(main)/import/success');
    }
  }, [saveImport]);
  
  // Check if at least one domain will be imported
  const hasAtLeastOneReplace = Array.from(conflictResolutions.values()).some(v => v === 'replace');
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Existing Playbooks Found</Text>
          <Text style={styles.headerSubtitle}>
            You already have playbooks in some of these domains. Choose what to do with each:
          </Text>
        </View>
        
        {conflicts.map((conflict, index) => {
          const domainInfo = DOMAIN_INFO[conflict.domainType];
          const colors = DOMAIN_COLORS[conflict.domainType];
          const resolution = conflictResolutions.get(conflict.domainType) || 'replace';
          
          return (
            <Card 
              key={index}
              style={[
                styles.conflictCard,
                { borderLeftColor: colors.primary, borderLeftWidth: 4 }
              ]}
            >
              <View style={styles.conflictHeader}>
                <Text style={styles.conflictEmoji}>{domainInfo.emoji}</Text>
                <Text style={[styles.conflictDomain, { color: colors.primary }]}>
                  {domainInfo.label}
                </Text>
              </View>
              
              <View style={styles.conflictDetails}>
                <View style={styles.conflictRow}>
                  <Text style={styles.conflictLabel}>Current:</Text>
                  <Text style={styles.conflictValue}>
                    {conflict.existingPlaybookName || 'Unknown'} 
                    {conflict.existingPlaybookCount > 1 && ` (+${conflict.existingPlaybookCount - 1} more)`}
                  </Text>
                </View>
                <View style={styles.conflictRow}>
                  <Text style={styles.conflictLabel}>New:</Text>
                  <Text style={styles.conflictValue}>
                    {conflict.newPlaybookCount} playbook{conflict.newPlaybookCount !== 1 ? 's' : ''} from import
                  </Text>
                </View>
              </View>
              
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.option,
                    resolution === 'replace' && styles.optionSelected,
                    resolution === 'replace' && { borderColor: colors.primary },
                  ]}
                  onPress={() => setConflictResolution(conflict.domainType, 'replace')}
                >
                  <View style={[
                    styles.optionRadio,
                    resolution === 'replace' && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}>
                    {resolution === 'replace' && <View style={styles.optionRadioInner} />}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Replace existing</Text>
                    <Text style={styles.optionDescription}>
                      Remove current playbooks and use the imported ones
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.option,
                    resolution === 'skip' && styles.optionSelected,
                    resolution === 'skip' && { borderColor: COLORS.gray500 },
                  ]}
                  onPress={() => setConflictResolution(conflict.domainType, 'skip')}
                >
                  <View style={[
                    styles.optionRadio,
                    resolution === 'skip' && { backgroundColor: COLORS.gray500, borderColor: COLORS.gray500 },
                  ]}>
                    {resolution === 'skip' && <View style={styles.optionRadioInner} />}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Keep existing</Text>
                    <Text style={styles.optionDescription}>
                      Don't import anything for this domain
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}
        
        {!hasAtLeastOneReplace && (
          <Card style={styles.warningCard}>
            <Text style={styles.warningText}>
              ⚠️ You've chosen to skip all domains. At least one domain must be imported.
            </Text>
          </Card>
        )}
      </ScrollView>
      
      {/* Bottom action */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Button
          title={isSaving ? 'Importing...' : 'Continue'}
          onPress={handleContinue}
          disabled={!hasAtLeastOneReplace || isSaving}
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
  header: {
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    lineHeight: 22,
  },
  conflictCard: {
    marginBottom: SPACING.md,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  conflictEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  conflictDomain: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  conflictDetails: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  conflictRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  conflictLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  conflictValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray300,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.gray800,
  },
  optionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray600,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  optionRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  warningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: COLORS.warning,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
  },
  bottomAction: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray900,
    backgroundColor: COLORS.black,
  },
});
