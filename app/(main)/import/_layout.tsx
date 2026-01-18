import { Stack } from 'expo-router';
import { COLORS } from '../../../src/constants/theme';

export default function ImportLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.black,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: COLORS.black,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Import from ChatGPT',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="preview"
        options={{
          title: 'Preview Plan',
        }}
      />
      <Stack.Screen
        name="conflicts"
        options={{
          title: 'Resolve Conflicts',
        }}
      />
      <Stack.Screen
        name="success"
        options={{
          title: 'Plan Activated',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
