import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { Button } from './Button';
import { 
  FRESH_START_PROMPT, 
  EXPORT_EXISTING_PROMPT, 
  PLAN_SUGGESTIONS,
} from '../import/prompts';

interface PromptCopySheetProps {
  visible: boolean;
  onClose: () => void;
}

export function PromptCopySheet({ visible, onClose }: PromptCopySheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<'fresh' | 'existing' | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  
  const handleCopy = (prompt: string, name: string) => {
    Clipboard.setString(prompt);
    Alert.alert(
      'Copied!',
      `${name} prompt copied to clipboard. Open ChatGPT and paste it to get started.`,
      [{ text: 'Got it', onPress: onClose }]
    );
  };
  
  const handleCopyFreshStart = () => {
    let prompt = FRESH_START_PROMPT;
    
    if (selectedSuggestion) {
      const suggestion = PLAN_SUGGESTIONS.find(s => s.title === selectedSuggestion);
      if (suggestion) {
        prompt = prompt.replace(
          '[DESCRIBE YOUR GOAL HERE - e.g., "A 12-week marathon training plan. I\'m running Boston in April, currently running 20 miles/week, goal is sub-4 hours."]',
          suggestion.prompt
        );
      }
    }
    
    handleCopy(prompt, 'Fresh Start');
  };
  
  const handleCopyExisting = () => {
    handleCopy(EXPORT_EXISTING_PROMPT, 'Export Existing');
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: SPACING.lg }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Get Started with ChatGPT</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + SPACING.xl }
          ]}
        >
          <Text style={styles.description}>
            DASH works best with plans created in ChatGPT. Choose how you want to get started:
          </Text>
          
          {/* Option 1: Fresh Start */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'fresh' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedType(selectedType === 'fresh' ? null : 'fresh')}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionEmoji}>🚀</Text>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Start Fresh</Text>
                <Text style={styles.optionDescription}>
                  Have ChatGPT help you create a new plan from scratch
                </Text>
              </View>
            </View>
            
            {selectedType === 'fresh' && (
              <View style={styles.optionExpanded}>
                <Text style={styles.suggestionLabel}>
                  Optional: Pick a starting point
                </Text>
                <View style={styles.suggestionGrid}>
                  {PLAN_SUGGESTIONS.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.title}
                      style={[
                        styles.suggestionChip,
                        selectedSuggestion === suggestion.title && styles.suggestionChipSelected,
                      ]}
                      onPress={() => setSelectedSuggestion(
                        selectedSuggestion === suggestion.title ? null : suggestion.title
                      )}
                    >
                      <Text style={[
                        styles.suggestionChipText,
                        selectedSuggestion === suggestion.title && styles.suggestionChipTextSelected,
                      ]}>
                        {suggestion.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Button
                  title="Copy Prompt to Clipboard"
                  onPress={handleCopyFreshStart}
                  fullWidth
                  style={styles.copyButton}
                />
              </View>
            )}
          </TouchableOpacity>
          
          {/* Option 2: Export Existing */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'existing' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedType(selectedType === 'existing' ? null : 'existing')}
          >
            <View style={styles.optionHeader}>
              <Text style={styles.optionEmoji}>📤</Text>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Export Existing Plan</Text>
                <Text style={styles.optionDescription}>
                  Already discussed a plan with ChatGPT? Convert it to DASH format
                </Text>
              </View>
            </View>
            
            {selectedType === 'existing' && (
              <View style={styles.optionExpanded}>
                <Text style={styles.existingInstructions}>
                  1. Go to your ChatGPT conversation with the plan{'\n'}
                  2. Paste the prompt below{'\n'}
                  3. Copy ChatGPT's YAML output{'\n'}
                  4. Return to DASH and import it
                </Text>
                
                <Button
                  title="Copy Prompt to Clipboard"
                  onPress={handleCopyExisting}
                  fullWidth
                  style={styles.copyButton}
                />
              </View>
            )}
          </TouchableOpacity>
          
          {/* How it works */}
          <View style={styles.howItWorks}>
            <Text style={styles.howItWorksTitle}>How it works</Text>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                Copy a prompt and paste it in ChatGPT
              </Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                ChatGPT creates a plan tailored to your goals
              </Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                Copy the YAML output and paste it in DASH
              </Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>
                DASH turns it into daily notifications and task cards
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray900,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: COLORS.gray500,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  optionCard: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.gray800,
  },
  optionCardSelected: {
    borderColor: COLORS.accent,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionEmoji: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    lineHeight: 20,
  },
  optionExpanded: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray800,
  },
  suggestionLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    marginBottom: SPACING.sm,
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  suggestionChip: {
    backgroundColor: COLORS.gray800,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray700,
  },
  suggestionChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  suggestionChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray300,
  },
  suggestionChipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  existingInstructions: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  copyButton: {
    marginTop: SPACING.sm,
  },
  howItWorks: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
  },
  howItWorksTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gray800,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
  stepText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    lineHeight: 24,
  },
});
