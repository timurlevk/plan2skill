import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

export default function ForgeScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [phase, setPhase] = useState('Analyzing your goals...');

  useEffect(() => {
    const phases = [
      { msg: 'Analyzing your goals...', at: 0 },
      { msg: 'Crafting milestones...', at: 25 },
      { msg: 'Generating daily tasks...', at: 50 },
      { msg: 'Calibrating difficulty...', at: 75 },
      { msg: 'Polishing your roadmap...', at: 90 },
    ];

    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + 1, 100);
        const currentPhase = [...phases].reverse().find((ph) => next >= ph.at);
        if (currentPhase) setPhase(currentPhase.msg);
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setComplete(true), 500);
        }
        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.steps}>
        {Array.from({ length: 7 }, (_, i) => (
          <View key={i} style={[styles.step, { backgroundColor: i <= 4 ? '#9D7AFF' : '#252530' }]} />
        ))}
      </View>

      <Text style={styles.title}>The Forge</Text>
      <Text style={styles.subtitle}>Crafting your personalized 90-day roadmap</Text>

      {/* Progress */}
      <View style={styles.progressCircle}>
        <Text style={styles.progressText}>{complete ? '✓' : `${progress}%`}</Text>
      </View>

      <Text style={styles.phaseText}>{complete ? 'Your roadmap is ready!' : phase}</Text>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {complete && (
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => router.push('/(onboarding)/first-quest' as never)}
        >
          <Text style={styles.continueBtnText}>Start Your Journey</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C10', padding: 24, paddingTop: 60, alignItems: 'center' },
  steps: { flexDirection: 'row', gap: 4, marginBottom: 32, width: '100%' },
  step: { flex: 1, height: 3, borderRadius: 2 },
  title: { color: '#9D7AFF', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#71717A', fontSize: 14, marginBottom: 40 },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#9D7AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressText: { color: '#9D7AFF', fontSize: 28, fontWeight: '800' },
  phaseText: { color: '#A1A1AA', fontSize: 14, marginBottom: 24, height: 20 },
  progressBar: { width: '100%', height: 4, borderRadius: 2, backgroundColor: '#252530', marginBottom: 32 },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: '#9D7AFF' },
  continueBtn: {
    backgroundColor: '#9D7AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  continueBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
