import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface ImportButtonProps {
  variant?: 'prominent' | 'subtle';
  style?: object;
}

export function ImportButton({ variant = 'prominent', style }: ImportButtonProps) {
  const handlePress = () => {
    router.push('/(main)/import');
  };
  
  if (variant === 'subtle') {
    return (
      <TouchableOpacity 
        style={[styles.subtleButton, style]} 
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.subtleIcon}>📥</Text>
        <Text style={styles.subtleText}>Import from ChatGPT</Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity 
      style={[styles.prominentButton, style]} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.prominentContent}>
        <View style={styles.prominentLeft}>
          <Text style={styles.prominentIcon}>💬</Text>
          <View>
            <Text style={styles.prominentTitle}>Import from ChatGPT</Text>
            <Text style={styles.prominentSubtitle}>
              Turn any ChatGPT plan into executable actions
            </Text>
          </View>
        </View>
        <Text style={styles.prominentArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Prominent variant (for playbooks screen)
  prominentButton: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  prominentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prominentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prominentIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  prominentTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 2,
  },
  prominentSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  prominentArrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.accent,
    marginLeft: SPACING.md,
  },
  
  // Subtle variant (for inline use)
  subtleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  subtleIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  subtleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    fontWeight: '500',
  },
});
