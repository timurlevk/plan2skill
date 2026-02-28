import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0C0C10' } }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
