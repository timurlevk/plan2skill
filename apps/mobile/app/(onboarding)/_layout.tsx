import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0C0C10' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="quest" />
      <Stack.Screen name="aspiration" />
      <Stack.Screen name="archetype" />
      <Stack.Screen name="character" />
      <Stack.Screen name="forge" />
      <Stack.Screen name="first-quest" />
    </Stack>
  );
}
