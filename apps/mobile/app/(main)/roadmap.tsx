import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function RoadmapScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Roadmap</Text>
      <Text style={styles.subtitle}>System Design — 90 days</Text>

      {[
        { title: 'Foundations & Setup', week: 'W1-W2', active: true },
        { title: 'Core Concepts', week: 'W3-W4', active: false },
        { title: 'Practical Projects', week: 'W5-W7', active: false },
        { title: 'Advanced Patterns', week: 'W8-W10', active: false },
        { title: 'Capstone Challenge', week: 'W11-W13', active: false },
      ].map((ms, i) => (
        <View key={i} style={styles.milestoneRow}>
          <View style={[styles.dot, ms.active && styles.dotActive]}>
            <Text style={[styles.dotText, ms.active && { color: '#FFF' }]}>{i + 1}</Text>
          </View>
          <View style={[styles.card, !ms.active && { opacity: 0.5 }]}>
            <Text style={styles.cardTitle}>{ms.title}</Text>
            <Text style={styles.cardWeek}>{ms.week}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C10' },
  content: { padding: 20, paddingTop: 60 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#71717A', fontSize: 14, marginBottom: 24 },
  milestoneRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#252530',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: '#9D7AFF' },
  dotText: { color: '#71717A', fontSize: 13, fontWeight: '700' },
  card: {
    flex: 1,
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
    borderRadius: 12,
    padding: 14,
  },
  cardTitle: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  cardWeek: { color: '#71717A', fontSize: 10, marginTop: 2 },
});
