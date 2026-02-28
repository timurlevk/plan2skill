import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function FirstQuestScreen() {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);

  if (completed) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={{ fontSize: 60, textAlign: 'center', marginBottom: 24 }}>🎉</Text>
        <Text style={styles.celebTitle}>Day 1 Complete!</Text>
        <Text style={styles.celebSubtitle}>You earned your first XP!</Text>

        <View style={styles.statsRow}>
          {[
            { label: 'XP Earned', value: '+25', color: '#9D7AFF' },
            { label: 'Level', value: '1', color: '#4ECDC4' },
            { label: 'Streak', value: '1 day', color: '#FBBF24' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => router.replace('/(main)/home' as never)}
        >
          <Text style={styles.continueBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.steps}>
        {Array.from({ length: 7 }, (_, i) => (
          <View key={i} style={[styles.step, { backgroundColor: i <= 5 ? '#9D7AFF' : '#252530' }]} />
        ))}
      </View>

      <Text style={styles.title}>Your first quest!</Text>
      <Text style={styles.subtitle}>Complete this micro-task to earn your first XP</Text>

      <View style={styles.taskCard}>
        <View style={styles.taskMeta}>
          <View style={styles.taskBadge}>
            <Text style={styles.taskBadgeText}>ARTICLE</Text>
          </View>
          <Text style={styles.taskTime}>~5 min</Text>
          <Text style={styles.taskXp}>+25 XP</Text>
        </View>
        <Text style={styles.taskTitle}>Welcome: Understanding Your Roadmap</Text>
        <Text style={styles.taskDesc}>
          Learn how your personalized roadmap works and how gamification keeps you motivated.
        </Text>
      </View>

      <TouchableOpacity style={styles.continueBtn} onPress={() => setCompleted(true)}>
        <Text style={styles.continueBtnText}>Mark as Complete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C10', padding: 24, paddingTop: 60 },
  steps: { flexDirection: 'row', gap: 4, marginBottom: 32 },
  step: { flex: 1, height: 3, borderRadius: 2 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#71717A', fontSize: 14, marginBottom: 24 },
  taskCard: {
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
  },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  taskBadge: { backgroundColor: 'rgba(110,231,183,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  taskBadgeText: { color: '#6EE7B7', fontSize: 9, fontWeight: '700' },
  taskTime: { color: '#71717A', fontSize: 10 },
  taskXp: { color: '#9D7AFF', fontSize: 12, fontWeight: '700', marginLeft: 'auto' },
  taskTitle: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  taskDesc: { color: '#71717A', fontSize: 12, lineHeight: 18 },
  continueBtn: {
    backgroundColor: '#9D7AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  celebTitle: { color: '#9D7AFF', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  celebSubtitle: { color: '#71717A', fontSize: 14, textAlign: 'center', marginBottom: 32 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 40 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#71717A', fontSize: 10, marginTop: 4 },
});
