import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

// ═══════════════════════════════════════════
// AUTH — MOBILE (from approved: screens/mobile/Auth.jsx)
// Social-only: Google + Apple
// ═══════════════════════════════════════════

const t = {
  violet: '#9D7AFF',
  cyan: '#4ECDC4',
  indigo: '#818CF8',
  rose: '#FF6B8A',
  gold: '#FFD166',
  bg: '#0C0C10',
  bgCard: '#18181F',
  bgElevated: '#121218',
  border: '#252530',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
};

const avatarColors = [t.violet, t.cyan, t.rose, t.gold, t.indigo];
const avatarLetters = ['A', 'K', 'M', 'D', 'S'];

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
      <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="white" />
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade up animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    // Floating logo animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ]),
    ).start();
  }, [fadeAnim, slideAnim, floatAnim]);

  const handleLogin = () => {
    router.push('/(onboarding)/quest' as never);
  };

  return (
    <View style={styles.container}>
      {/* Ambient glows */}
      <View style={styles.glowViolet} />
      <View style={styles.glowCyan} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Logo + Header */}
        <View style={styles.headerSection}>
          <Animated.View
            style={[styles.logoContainer, { transform: [{ translateY: floatAnim }] }]}
          >
            <View style={styles.logoSheen} />
            <Text style={styles.logoText}>P2</Text>
          </Animated.View>

          <Text style={styles.title}>Welcome to Plan2Skill</Text>
          <Text style={styles.subtitle}>
            {'Sign in to start your personalized\nlearning journey'}
          </Text>
        </View>

        {/* Auth card */}
        <View style={styles.authCard}>
          <TouchableOpacity style={styles.authButton} onPress={handleLogin} activeOpacity={0.7}>
            <GoogleIcon />
            <Text style={styles.authButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.authButton} onPress={handleLogin} activeOpacity={0.7}>
            <AppleIcon />
            <Text style={styles.authButtonText}>Continue with Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>

        {/* Social proof */}
        <View style={styles.socialProof}>
          <View style={styles.avatarRow}>
            {avatarColors.map((color, i) => (
              <View
                key={i}
                style={[
                  styles.avatar,
                  {
                    backgroundColor: `${color}25`,
                    borderColor: t.bg,
                    marginLeft: i > 0 ? -6 : 0,
                    zIndex: 5 - i,
                  },
                ]}
              >
                <Text style={[styles.avatarLetter, { color }]}>
                  {avatarLetters[i]}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.socialText}>
            Join <Text style={styles.socialHighlight}>2,847</Text> professionals leveling up
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    overflow: 'hidden',
  },
  glowViolet: {
    position: 'absolute',
    top: '-15%',
    alignSelf: 'center',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(157, 122, 255, 0.06)',
  },
  glowCyan: {
    position: 'absolute',
    bottom: '-10%',
    right: '-5%',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(78, 205, 196, 0.04)',
  },
  content: {
    width: '100%',
    maxWidth: 430,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    // Gradient approximation — RN doesn't support CSS gradients natively
    backgroundColor: t.violet,
    shadowColor: t.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  logoSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  logoText: {
    color: '#FFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {
    color: t.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: t.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  authCard: {
    backgroundColor: 'rgba(24, 24, 31, 0.56)',
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    backgroundColor: t.bgElevated,
    borderWidth: 1.5,
    borderColor: t.border,
    borderRadius: 16,
  },
  authButtonText: {
    color: t.text,
    fontSize: 15,
    fontWeight: '500',
  },
  terms: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    color: t.textMuted,
    lineHeight: 19,
  },
  termsLink: {
    color: t.violet,
  },
  socialProof: {
    alignItems: 'center',
    marginTop: 48,
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 10,
    fontWeight: '700',
  },
  socialText: {
    color: t.textMuted,
    fontSize: 12,
  },
  socialHighlight: {
    color: t.cyan,
    fontWeight: '600',
  },
});
