import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Ambient glow */}
      <View style={styles.glowTop} />

      {/* Logo */}
      <View style={styles.logoWrap}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>P2</Text>
        </View>
      </View>

      <Text style={styles.title}>Welcome to Plan2Skill</Text>
      <Text style={styles.subtitle}>Sign in to start your personalized learning journey</Text>

      {/* Auth buttons */}
      <View style={styles.authButtons}>
        <TouchableOpacity
          style={styles.authButton}
          onPress={() => router.push('/(onboarding)/quest' as never)}
        >
          <Text style={styles.authButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.authButton}
          onPress={() => router.push('/(onboarding)/quest' as never)}
        >
          <Text style={styles.authButtonText}>Continue with Apple</Text>
        </TouchableOpacity>
      </View>

      {/* Social proof */}
      <View style={styles.socialProof}>
        <Text style={styles.socialText}>
          Join <Text style={styles.socialBold}>2,847</Text> professionals leveling up
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C10',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(157, 122, 255, 0.08)',
  },
  logoWrap: {
    marginBottom: 24,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9D7AFF',
  },
  logoText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#71717A',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 280,
  },
  authButtons: {
    width: '100%',
    gap: 12,
  },
  authButton: {
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  socialProof: {
    marginTop: 32,
  },
  socialText: {
    color: '#71717A',
    fontSize: 12,
  },
  socialBold: {
    color: '#FFF',
    fontWeight: '600',
  },
});
