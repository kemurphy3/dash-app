import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, DomainCard } from '../../src/components';
import { COLORS, SPACING, FONT_SIZES } from '../../src/constants/theme';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { DomainType } from '../../src/types';
import { analytics } from '../../src/utils/analytics';

const DOMAIN_TYPES: DomainType[] = ['morning', 'exercise', 'evening'];

export default function DomainsScreen() {
  const { selectedDomains, toggleDomain, getSelectedDomainTypes } = useOnboardingStore();
  
  const selectedTypes = getSelectedDomainTypes();
  const canContinue = selectedTypes.length > 0;
  
  const handleContinue = () => {
    analytics.onboardingDomainsSelected(selectedTypes);
    router.push('/(onboarding)/playbooks');
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
          <Text style={styles.step}>Step 1 of 5</Text>
          <Text style={styles.title}>Choose your focus areas</Text>
          <Text style={styles.subtitle}>
            Select 1–3 domains where you want DASH to help you build consistency.
          </Text>
        </View>
        
        {/* Domain Cards */}
        <View style={styles.domains}>
          {DOMAIN_TYPES.map((type) => (
            <DomainCard
              key={type}
              type={type}
              selected={selectedDomains.has(type)}
              onToggle={() => toggleDomain(type)}
            />
          ))}
        </View>
        
        {/* Help text */}
        <View style={styles.help}>
          <Text style={styles.helpText}>
            Start with one domain if you're new to building habits.
            You can always add more later.
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
            disabled={!canContinue}
            style={styles.continueButton}
          />
        </View>
        
        {selectedTypes.length > 0 && (
          <Text style={styles.selectionCount}>
            {selectedTypes.length} domain{selectedTypes.length > 1 ? 's' : ''} selected
          </Text>
        )}
      </View>
    </SafeAreaView>
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
  
  domains: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  
  help: {
    backgroundColor: COLORS.gray900,
    padding: SPACING.md,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  
  helpText: {
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
  
  selectionCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
