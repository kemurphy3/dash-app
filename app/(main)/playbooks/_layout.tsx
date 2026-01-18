import { Stack } from 'expo-router';
import { COLORS } from '../../../src/constants/theme';

export default function PlaybooksLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.black },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="[id]" 
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
