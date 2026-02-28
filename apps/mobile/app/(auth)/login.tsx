import { View, Text } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0C0C10' }}>
      <Text style={{ color: '#9D7AFF', fontSize: 32, fontWeight: '700' }}>Plan2Skill</Text>
      <Text style={{ color: '#A1A1AA', marginTop: 8 }}>Welcome — Auth screen placeholder</Text>
    </View>
  );
}
