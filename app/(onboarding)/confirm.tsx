import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../src/components';
import { COLORS, SPACING, FONT_SIZES, DOMAIN_COLORS } from '../../src/constants/theme';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { useAppStore } from '../../src/stores/appStore';
import { DOMAIN_INFO, DomainType } from '../../src/types';
import { getTemplateById } from '../../src/constants/templates';
import { formatTimeForDisplay } from '../../src/utils/time';
import { requestNotificationPermissions, scheduleAllNotifications } from '../../src/notifications';
import { analytics } from '../../src/utils/analytics';

export default function ConfirmScreen() {
  const [isActivating, setIsActivating] = useState(false);
  
  const { getSelectedDomainTypes, getDomainSetup, completeOnboarding } = useOnboardingStore();
  const initialize = useAppStore(state => state.initialize);
  
  const selectedTypes = getSelectedDomainTypes();
  
  const handleActivate = async () => {
    setIsActivating(true);
    
    try {
      // Request notification permissions
      const hasPermission = await requestNotificationPermissions();
      
      if (!hasPermission) {
        Alert.alert(
          'Notifications Disabled',
          'DASH works best with notifications enabled. You can enable them later in Settings.',
          [{ text: 'Continue Anyway', onPress: () => finishActivation() }]
        );
        return;
      }
      
      await finishActivation();
    } catch (error) {
      console.error('Activation error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsActivating(false);
    }
  };
  
  const finishActivation = async () => {
    try {
      // Complete onboarding (creates domains and playbooks)
      await completeOnboarding();
      
      // Reinitialize app store with new data
      await initialize();
      
      // Schedule notifications
      await scheduleAllNotifications();
      
      // Track analytics
      analytics.onboardingCompleted(selectedTypes.length);
      
      // Navigate to main app
      router.replace('/(main)/today');
    } catch (error) {
      console.error('Finish activation error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 4 of 4</Text>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Review your setup and activate DASH to start building momentum.
          </Text>
        </View>
        
        {/* Summary */}
        <View style={styles.summary}>
          {selectedTypes.map((type) => (
            <SummaryCard key={type} type={type} setup={getDomainSetup(type)!} />
          ))}
        </View>
        
        {/* What happens next */}
        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>What happens next?</Text>
          
          <View style={styles.nextStep}>
            <Text style={styles.nextStepNumber}>1</Text>
            <Text style={styles.nextStepText}>
              DASH will send you a notification at each trigger time
            </Text>
          </View>
          
          <View style={styles.nextStep}>
            <Text style={styles.nextStepNumber}>2</Text>
            <Text style={styles.nextStepText}>
              Open the notification to see exactly what to do
            </Text>
          </View>
          
          <View style={styles.nextStep}>
            <Text style={styles.nextStepNumber}>3</Text>
            <Text style={styles.nextStepText}>
              Tap Done when finished, or Skip if needed (no guilt!)
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={isActivating ? "Activating..." : "Activate DASH"}
          onPress={handleActivate}
          loading={isActivating}
          size="large"
          fullWidth
        />
        
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="ghost"
          disabled={isActivating}
          style={styles.backButton}
        />
      </View>
    </SafeAreaView>
  );
}

function SummaryCard({ 
  type, 
  setup 
}: { 
  type: DomainType; 
  setup: { selectedTemplateId: string | null; triggerTime: string };
}) {
  const info = DOMAIN_INFO[type];
  const colors = DOMAIN_COLORS[type];
  const template = setup.selectedTemplateId ? getTemplateById(setup.selectedTemplateId) : null;
  
  return (
    <View style={[styles.summaryCard, { borderColor: colors.primary }]}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryEmoji}>{info.emoji}</Text>
        <View style={styles.summaryHeaderText}>
          <Text style={[styles.summaryDomain, { color: colors.primary }]}>
            {info.label}
          </Text>
          <Text style={styles.summaryTime}>
            {formatTimeForDisplay(setup.triggerTime)}
          </Text>
        </View>
      </View>
      
      {template && (
        <View style={styles.summaryPlaybook}>
          <Text style={styles.summaryPlaybookLabel}>Playbook:</Text>
          <Text style={styles.summaryPlaybookName}>{template.name}</Text>
          <Text style={styles.summaryTaskCount}>
            {template.tasks.length} tasks
          </Text>
        </View>
      )}
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
    marginBottom: SPACING.xl,
  },
  
  step: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    lineHeight: 24,
  },
  
  summary: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  
  summaryCard: {
    backgroundColor: COLORS.gray900,
    borderRadius: 16,
    padding: SPACING.lg,
    borderLeftWidth: 4,
  },
  
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  summaryEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  
  summaryHeaderText: {
    flex: 1,
  },
  
  summaryDomain: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  
  summaryTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    marginTop: 2,
  },
  
  summaryPlaybook: {
    backgroundColor: COLORS.gray800,
    padding: SPACING.sm,
    borderRadius: 8,
  },
  
  summaryPlaybookLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    marginBottom: 2,
  },
  
  summaryPlaybookName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '500',
  },
  
  summaryTaskCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    marginTop: 2,
  },
  
  nextSteps: {
    backgroundColor: COLORS.gray900,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  
  nextStepsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  
  nextStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  
  nextStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: SPACING.sm,
  },
  
  nextStepText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray300,
    lineHeight: 20,
  },
  
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray800,
  },
  
  backButton: {
    marginTop: SPACING.sm,
  },
});
