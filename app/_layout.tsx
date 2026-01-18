import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase, getDatabase, getSettings } from '../src/db';
import { useAppStore } from '../src/stores/appStore';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { 
  configureNotifications, 
  setupNotificationListeners, 
  handleColdStartNotification,
  scheduleAllNotifications,
} from '../src/notifications';
import { checkAndAdvanceWeeks, refreshActivePlaybooks } from '../src/utils/weekProgression';
import { COLORS } from '../src/constants/theme';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const initialize = useAppStore(state => state.initialize);
  
  useEffect(() => {
    async function prepare() {
      try {
        // Initialize database
        await initDatabase();
        
        // Configure notifications
        configureNotifications();
        
        // Check onboarding status
        const db = getDatabase();
        const settings = await getSettings(db);
        setHasCompletedOnboarding(settings.hasCompletedOnboarding);
        
        // Initialize app store
        await initialize();
        
        // Check and advance weeks for multi-week plans
        const { advanced, newWeek } = await checkAndAdvanceWeeks();
        if (advanced) {
          console.log(`[App] Advanced to week ${newWeek}`);
          // Refresh active playbooks after week change
          await refreshActivePlaybooks();
        }
        
        // Schedule notifications (re-schedule daily to handle any changes)
        if (settings.hasCompletedOnboarding) {
          await scheduleAllNotifications();
        }
        
        // Set up notification listeners
        const cleanup = setupNotificationListeners();
        
        // Handle cold start from notification
        await handleColdStartNotification();
        
        setIsReady(true);
        
        return cleanup;
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsReady(true);
      }
    }
    
    prepare();
  }, []);
  
  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }
  
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.black },
              animation: 'slide_from_right',
            }}
            initialRouteName={hasCompletedOnboarding ? '(main)' : '(onboarding)'}
          >
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(main)" />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
  },
});
