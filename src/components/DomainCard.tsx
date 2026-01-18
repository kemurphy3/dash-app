import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DomainType, DOMAIN_INFO } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, DOMAIN_COLORS } from '../constants/theme';

interface DomainCardProps {
  type: DomainType;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function DomainCard({ type, selected, onToggle, disabled = false }: DomainCardProps) {
  const info = DOMAIN_INFO[type];
  const colors = DOMAIN_COLORS[type];
  
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && { 
          backgroundColor: colors.background,
          borderColor: colors.primary,
        },
        disabled && styles.disabled,
      ]}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>{info.emoji}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.label, selected && { color: colors.primary }]}>
            {info.label}
          </Text>
          <Text style={styles.time}>
            Default: {info.defaultTime}
          </Text>
        </View>
      </View>
      
      <View style={[
        styles.checkbox,
        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.gray800,
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  emoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  
  textContainer: {
    flex: 1,
  },
  
  label: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  
  time: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.gray600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  checkmark: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
