import { Tabs } from 'expo-router';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121218',
          borderTopColor: '#252530',
        },
        tabBarActiveTintColor: '#9D7AFF',
        tabBarInactiveTintColor: '#71717A',
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="roadmap" options={{ title: 'Roadmap' }} />
      <Tabs.Screen name="character" options={{ title: 'Character' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
