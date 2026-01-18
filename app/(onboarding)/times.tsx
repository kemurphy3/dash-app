import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, TimePicker } from '../../src/components';
import { COLORS, SPACING, FONT_SIZES, DOMAIN_COLORS } from '../../src/constants/theme';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { DOMAIN_INFO, DomainType } from '../../src/types';

export default function TimesScreen() {
  const { 
    getSelectedDomainTypes, 
    getDomainSetup,
    setTriggerTime,
  } = useOnboardingStore();
  
  const selectedTypes = getSelectedDomainTypes();
  
  const handleContinue = () => {
    router.push('/(onboarding)/notifications');
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
          <Text style={styles.step}>Step 3 of 5</Text>
          <Text style={styles.title}>Set your trigger times</Text>
          <Text style={styles.subtitle}>
            When should DASH remind you to start each routine?
            Pick times that fit your schedule.
          </Text>
        </View>
        
        {/* Time Pickers */}
        <View style={styles.timePickers}>
          {selectedTypes.map((type) => (
            <TimePickerCard
              key={type}
              type={type}
              time={getDomainSetup(type)?.triggerTime || DOMAIN_INFO[type].defaultTime}
              onChangeTime={(time) => setTriggerTime(type, time)}
            />
          ))}
        </View>
        
        {/* Tip */}
        <View style={styles.tip}>
          <Text style={styles.tipTitle}>💡 Pro tip</Text>
          <Text style={styles.tipText}>
            Start with realistic times. It's better to build consistency
            with achievable times than to set ambitious ones you'll skip.
          </Text>
        </View>
      </ScrollView>
      
      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Button
            title="Back"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.backButton}
          />
          <Button
            title="Continue"
            onPress={handleContinue}
            style={styles.continueButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function TimePickerCard({ 
  type, 
  time, 
  onChangeTime 
}: { 
  type: DomainType; 
  time: string; 
  onChangeTime: (time: string) => void;
}) {
  const info = DOMAIN_INFO[type];
  const colors = DOMAIN_COLORS[type];
  
  return (
    <View style={[styles.timeCard, { borderColor: colors.border }]}>
      <View style={styles.timeCardHeader}>
        <Text style={styles.timeCardEmoji}>{info.emoji}</Text>
        <Text style={[styles.timeCardLabel, { color: colors.primary }]}>
          {info.label}
        </Text>
      </View>
      
      <TimePicker
        value={time}
        onChange={onChangeTime}
      />
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
  
  timePickers: {
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  
  timeCard: {
    backgroundColor: COLORS.gray900,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  timeCardEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  
  timeCardLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  
  tip: {
    backgroundColor: COLORS.gray900,
    padding: SPACING.md,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  
  tipTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: SPACING.xs,
  },
  
  tipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    lineHeight: 20,
  },
  
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray800,
  },
  
  footerRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  
  backButton: {
    flex: 1,
  },
  
  continueButton: {
    flex: 2,
  },
});
