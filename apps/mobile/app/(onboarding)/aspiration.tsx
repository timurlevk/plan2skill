import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════
// ASPIRATION — WHERE I WANT TO BE (Step 2/7)
// Goal cards + time commitment
// ═══════════════════════════════════════════

const t = {
  violet: '#9D7AFF',
  cyan: '#4ECDC4',
  bg: '#0C0C10',
  bgCard: '#18181F',
  border: '#252530',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
};

const ASPIRATIONS = [
  { id: 'promote',  icon: '🎯', title: 'Get promoted',   subtitle: 'Reach the next career level' },
  { id: 'build',    icon: '🛠', title: 'Build & ship',   subtitle: 'Create projects & build portfolio' },
  { id: 'switch',   icon: '🔄', title: 'Switch fields',  subtitle: 'Transition to a new domain' },
  { id: 'deep',     icon: '🧠', title: 'Go deep',        subtitle: 'Master specific technologies' },
  { id: 'lead',     icon: '👥', title: 'Lead teams',      subtitle: 'Move into leadership / management' },
];

const TIME_OPTIONS = [
  { id: '5',  label: '5 min' },
  { id: '15', label: '15 min' },
  { id: '30', label: '30 min' },
  { id: '60', label: '1 hour' },
];

function StepBar({ current, total = 7 }: { current: number; total?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 32 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            height: 4,
            flex: 1,
            borderRadius: 2,
            backgroundColor: i < current ? t.violet : '#252530',
          }}
        />
      ))}
    </View>
  );
}

export default function AspirationScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const canContinue = selected && time;

  return (
    <View style={styles.container}>
      <View style={styles.glowViolet} />
      <View style={styles.glowCyan} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <StepBar current={2} />

          <Text style={styles.title}>Where do you want to be{'\n'}in 12 months?</Text>
          <Text style={styles.subtitle}>Pick your main goal</Text>

          {ASPIRATIONS.map((item) => {
            const isSelected = selected === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelected(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.cardIcon, isSelected && styles.cardIconSelected]}>
                  <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Text style={{ color: t.violet, fontSize: 14, fontWeight: '700' }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Time commitment */}
          <Text style={styles.timeLabel}>How much time daily?</Text>
          <View style={styles.timeRow}>
            {TIME_OPTIONS.map((opt) => {
              const isActive = time === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.timeChip, isActive && styles.timeChipActive]}
                  onPress={() => setTime(opt.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeChipText, isActive && styles.timeChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
            disabled={!canContinue}
            onPress={() => router.push('/(onboarding)/archetype' as never)}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.bg,
    overflow: 'hidden',
  },
  glowViolet: {
    position: 'absolute',
    top: '-15%',
    alignSelf: 'center',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(157, 122, 255, 0.05)',
  },
  glowCyan: {
    position: 'absolute',
    bottom: '-10%',
    right: '-5%',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(78, 205, 196, 0.03)',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    color: t.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: t.textMuted,
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: t.bgCard,
    borderWidth: 1.5,
    borderColor: t.border,
    marginBottom: 10,
    gap: 14,
  },
  cardSelected: {
    backgroundColor: 'rgba(157, 122, 255, 0.08)',
    borderColor: 'rgba(157, 122, 255, 0.4)',
    shadowColor: t.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(78, 205, 196, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconSelected: {
    backgroundColor: 'rgba(157, 122, 255, 0.15)',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: t.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardTitleSelected: {
    color: t.violet,
  },
  cardSubtitle: {
    color: t.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(157, 122, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeLabel: {
    color: t.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  timeChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: t.bgCard,
    borderWidth: 1.5,
    borderColor: t.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipActive: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderColor: 'rgba(78, 205, 196, 0.4)',
  },
  timeChipText: {
    color: t.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: t.cyan,
  },
  continueBtn: {
    marginTop: 20,
    height: 52,
    borderRadius: 14,
    backgroundColor: t.violet,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: t.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  continueBtnDisabled: {
    opacity: 0.35,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
