import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, PlaybookPreview } from '../../src/components';
import { COLORS, SPACING, FONT_SIZES, DOMAIN_COLORS } from '../../src/constants/theme';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { DOMAIN_INFO } from '../../src/types';
import { analytics } from '../../src/utils/analytics';

export default function PlaybooksScreen() {
  const { 
    getCurrentDomainType, 
    getTemplatesForCurrentDomain,
    getDomainSetup,
    setSelectedTemplate,
    getSelectedDomainTypes,
    currentDomainIndex,
    nextStep,
    prevStep,
  } = useOnboardingStore();
  
  const currentType = getCurrentDomainType();
  const selectedTypes = getSelectedDomainTypes();
  const templates = getTemplatesForCurrentDomain();
  const setup = currentType ? getDomainSetup(currentType) : undefined;
  
  if (!currentType) {
    router.replace('/(onboarding)/domains');
    return null;
  }
  
  const domainInfo = DOMAIN_INFO[currentType];
  const colors = DOMAIN_COLORS[currentType];
  const isLastDomain = currentDomainIndex === selectedTypes.length - 1;
  
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(currentType, templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      analytics.onboardingPlaybookSelected(currentType, template.name);
    }
  };
  
  const handleContinue = () => {
    if (isLastDomain) {
      router.push('/(onboarding)/times');
    } else {
      nextStep();
    }
  };
  
  const canContinue = setup?.selectedTemplateId != null;
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 5</Text>
          <View style={styles.titleRow}>
            <Text style={[styles.emoji]}>{domainInfo.emoji}</Text>
            <Text style={[styles.title, { color: colors.primary }]}>
              {domainInfo.label}
            </Text>
          </View>
          <Text style={styles.subtitle}>
            Choose a pre-built routine that fits your style.
            You can customize it later.
          </Text>
          
          {selectedTypes.length > 1 && (
            <View style={styles.progress}>
              <Text style={styles.progressText}>
                Domain {currentDomainIndex + 1} of {selectedTypes.length}
              </Text>
            </View>
          )}
        </View>
        
        {/* Templates */}
        <View style={styles.templates}>
          {templates.map((template) => (
            <PlaybookPreview
              key={template.id}
              template={template}
              selected={setup?.selectedTemplateId === template.id}
              onSelect={() => handleSelectTemplate(template.id)}
            />
          ))}
        </View>
      </ScrollView>
      
      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Button
            title="Back"
            onPress={prevStep}
            variant="ghost"
            style={styles.backButton}
          />
          <Button
            title={isLastDomain ? "Set Times" : "Next Domain"}
            onPress={handleContinue}
            disabled={!canContinue}
            style={styles.continueButton}
          />
        </View>
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
  
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  emoji: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    lineHeight: 24,
  },
  
  progress: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.gray900,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  
  progressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
  },
  
  templates: {
    gap: SPACING.md,
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
