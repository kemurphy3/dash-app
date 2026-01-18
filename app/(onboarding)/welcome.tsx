import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../src/components';
import { COLORS, SPACING, FONT_SIZES } from '../../src/constants/theme';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { analytics } from '../../src/utils/analytics';

export default function WelcomeScreen() {
  const reset = useOnboardingStore(state => state.reset);
  
  const handleStart = () => {
    reset();
    analytics.onboardingStarted();
    router.push('/(onboarding)/domains');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Brand */}
        <View style={styles.logoContainer}>
          <View style={styles.logoArrow}>
            <Text style={styles.logoIcon}>→</Text>
          </View>
          <Text style={styles.logoText}>DASH</Text>
          <Text style={styles.tagline}>Daily Actions, Stop Hesitating</Text>
        </View>
        
        {/* Value Prop */}
        <View style={styles.valueProps}>
          <Text style={styles.headline}>
            You already know{'\n'}what you want to do.
          </Text>
          
          <Text style={styles.subheadline}>
            DASH removes the daily re-deciding.{'\n'}
            One task. One tap. Done.
          </Text>
        </View>
        
        {/* Features */}
        <View style={styles.features}>
          <FeatureItem emoji="🌅" text="Build your morning routine" />
          <FeatureItem emoji="💪" text="Never skip workouts" />
          <FeatureItem emoji="🌙" text="Wind down with intention" />
        </View>
      </View>
      
      {/* CTA */}
      <View style={styles.footer}>
        <Button
          title="Get Started"
          onPress={handleStart}
          size="large"
          fullWidth
        />
        
        <Text style={styles.footerText}>
          Takes less than 3 minutes to set up
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  
  logoArrow: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  
  logoIcon: {
    fontSize: 40,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 4,
  },
  
  tagline: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
    letterSpacing: 1,
  },
  
  valueProps: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  
  headline: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: SPACING.md,
  },
  
  subheadline: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  features: {
    gap: SPACING.md,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray900,
    padding: SPACING.md,
    borderRadius: 12,
  },
  
  featureEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  
  featureText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '500',
  },
  
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
