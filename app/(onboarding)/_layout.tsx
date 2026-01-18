import { Stack } from 'expo-router';
import { COLORS } from '../../src/constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.black },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="domains" />
      <Stack.Screen name="playbooks" />
      <Stack.Screen name="times" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
