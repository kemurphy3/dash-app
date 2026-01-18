import { Stack } from 'expo-router';
import { COLORS } from '../../../src/constants/theme';

export default function TodayLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.black },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="task" 
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
