import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string;
}

export function StatCard({ title, value, subtitle, color = COLORS.accent, icon }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <Text style={[styles.value, { color }]}>{value}</Text>
      
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.gray900,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flex: 1,
    minWidth: 140,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  icon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  
  title: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
  },
  
  value: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
  },
  
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    marginTop: 4,
  },
});
