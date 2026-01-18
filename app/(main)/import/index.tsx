import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../src/constants/theme';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { useImportStore } from '../../../src/stores/importStore';
import { FRESH_START_PROMPT, EXPORT_EXISTING_PROMPT, PLAN_SUGGESTIONS } from '../../../src/import';

export default function ImportScreen() {
  const insets = useSafeAreaInsets();
  const [showPromptOptions, setShowPromptOptions] = useState(false);
  
  const { 
    rawInput, 
    setInput, 
    validateInput, 
    step, 
    errorMessage,
    reset,
  } = useImportStore();
  
  const isValidating = step === 'validating';
  
  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getString();
      if (text) {
        setInput(text);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not read from clipboard');
    }
  }, [setInput]);
  
  // Handle copy prompt to clipboard
  const handleCopyPrompt = useCallback((prompt: string, name: string) => {
    Clipboard.setString(prompt);
    Alert.alert('Copied!', `${name} prompt copied to clipboard. Paste it in ChatGPT to get started.`);
    setShowPromptOptions(false);
  }, []);
  
  // Handle validation and navigation
  const handleContinue = useCallback(async () => {
    await validateInput();
    
    // Check the step after validation
    const currentStep = useImportStore.getState().step;
    if (currentStep === 'preview') {
      router.push('/(main)/import/preview');
    }
  }, [validateInput]);
  
  // Reset on unmount
  React.useEffect(() => {
    return () => {
      // Don't reset if we're navigating forward
      const currentStep = useImportStore.getState().step;
      if (currentStep === 'input' || currentStep === 'error') {
        reset();
      }
    };
  }, [reset]);
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.xl }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header explanation */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Import Your Plan</Text>
          <Text style={styles.headerSubtitle}>
            Paste the YAML export from ChatGPT below. DASH will turn it into executable daily actions.
          </Text>
        </View>
        
        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Paste your ChatGPT YAML export here..."
            placeholderTextColor={COLORS.gray600}
            multiline
            value={rawInput}
            onChangeText={setInput}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isValidating}
          />
          
          <TouchableOpacity 
            style={styles.pasteButton} 
            onPress={handlePaste}
            disabled={isValidating}
          >
            <Text style={styles.pasteButtonText}>📋 Paste</Text>
          </TouchableOpacity>
        </View>
        
        {/* Error message */}
        {errorMessage && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>⚠️ Import Error</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          </Card>
        )}
        
        {/* Don't have a plan section */}
        <View style={styles.helpSection}>
          <TouchableOpacity 
            style={styles.helpToggle}
            onPress={() => setShowPromptOptions(!showPromptOptions)}
          >
            <Text style={styles.helpToggleText}>
              {showPromptOptions ? '▼' : '▶'} Don't have a plan yet?
            </Text>
          </TouchableOpacity>
          
          {showPromptOptions && (
            <View style={styles.promptOptions}>
              <Text style={styles.promptDescription}>
                Copy one of these prompts to ChatGPT to create a DASH-compatible plan:
              </Text>
              
              {/* Fresh start prompt */}
              <Card 
                style={styles.promptCard}
                onPress={() => handleCopyPrompt(FRESH_START_PROMPT, 'Fresh Start')}
              >
                <Text style={styles.promptCardTitle}>🚀 Fresh Start</Text>
                <Text style={styles.promptCardDescription}>
                  Start a new conversation with ChatGPT. It will ask about your goals and create a personalized plan.
                </Text>
                <Text style={styles.promptCardAction}>Tap to copy prompt</Text>
              </Card>
              
              {/* Export existing prompt */}
              <Card 
                style={styles.promptCard}
                onPress={() => handleCopyPrompt(EXPORT_EXISTING_PROMPT, 'Export Existing')}
              >
                <Text style={styles.promptCardTitle}>📤 Export Existing</Text>
                <Text style={styles.promptCardDescription}>
                  Already discussed a plan with ChatGPT? Paste this to convert it to DASH format.
                </Text>
                <Text style={styles.promptCardAction}>Tap to copy prompt</Text>
              </Card>
              
              {/* Suggestions */}
              <Text style={styles.suggestionsTitle}>Need ideas? Try asking ChatGPT for:</Text>
              <View style={styles.suggestionsList}>
                {PLAN_SUGGESTIONS.slice(0, 4).map((suggestion, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => {
                      const fullPrompt = FRESH_START_PROMPT.replace(
                        '[DESCRIBE YOUR GOAL HERE - e.g., "A 12-week marathon training plan. I\'m running Boston in April, currently running 20 miles/week, goal is sub-4 hours."]',
                        suggestion.prompt
                      );
                      handleCopyPrompt(fullPrompt, suggestion.title);
                    }}
                  >
                    <Text style={styles.suggestionChipText}>{suggestion.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Bottom action */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Button
          title={isValidating ? 'Validating...' : 'Continue'}
          onPress={handleContinue}
          disabled={!rawInput.trim() || isValidating}
          loading={isValidating}
          fullWidth
          size="large"
        />
      </View>
    </KeyboardAvoidingView>
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
  inputContainer: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  textInput: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray800,
    padding: SPACING.md,
    paddingTop: SPACING.md,
    minHeight: 200,
    maxHeight: 300,
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlignVertical: 'top',
  },
  pasteButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.gray800,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  pasteButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: COLORS.error,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray300,
    lineHeight: 20,
  },
  helpSection: {
    marginTop: SPACING.md,
  },
  helpToggle: {
    paddingVertical: SPACING.sm,
  },
  helpToggleText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent,
    fontWeight: '500',
  },
  promptOptions: {
    marginTop: SPACING.md,
  },
  promptDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    marginBottom: SPACING.md,
  },
  promptCard: {
    marginBottom: SPACING.md,
    borderColor: COLORS.gray700,
    borderWidth: 1,
  },
  promptCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  promptCardDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  promptCardAction: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    fontWeight: '500',
  },
  suggestionsTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  suggestionChip: {
    backgroundColor: COLORS.gray800,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  suggestionChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray300,
  },
  bottomAction: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray900,
    backgroundColor: COLORS.black,
  },
});
