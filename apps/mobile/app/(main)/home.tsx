import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <Text style={styles.greeting}>Good morning, Adventurer!</Text>
      <Text style={styles.focusText}>Today&apos;s focus: Getting Started</Text>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Level', value: '1', color: '#9D7AFF', icon: '⚡' },
          { label: 'Streak', value: '0', color: '#FBBF24', icon: '🔥' },
          { label: 'XP', value: '0', color: '#4ECDC4', icon: '✦' },
          { label: 'Energy', value: '3/3', color: '#9D7AFF', icon: '💎' },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Active Roadmap */}
      <Text style={styles.sectionTitle}>ACTIVE ROADMAP</Text>
      <View style={styles.roadmapCard}>
        <Text style={styles.roadmapTitle}>System Design Fundamentals</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '0%' }]} />
        </View>
        <Text style={styles.roadmapMilestone}>Current: Foundations & Setup</Text>
      </View>

      {/* Today's Tasks */}
      <Text style={styles.sectionTitle}>TODAY&apos;S TASKS</Text>
      {[
        { title: 'Welcome: Understanding Your Roadmap', type: 'article', xp: 15, mins: 5 },
        { title: 'System Design Overview', type: 'video', xp: 25, mins: 10 },
        { title: 'Quiz: Design Principles', type: 'quiz', xp: 30, mins: 5 },
      ].map((task, i) => (
        <View key={i} style={styles.taskCard}>
          <View style={styles.taskCheckbox} />
          <View style={styles.taskContent}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <View style={styles.taskMeta}>
              <Text style={styles.taskType}>{task.type.toUpperCase()}</Text>
              <Text style={styles.taskTime}>{task.mins} min</Text>
            </View>
          </View>
          <Text style={styles.taskXp}>+{task.xp} XP</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C10' },
  content: { padding: 20, paddingTop: 60 },
  greeting: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  focusText: { color: '#71717A', fontSize: 14, marginBottom: 24 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statIcon: { fontSize: 14, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#71717A', fontSize: 9, marginTop: 2 },
  sectionTitle: { color: '#71717A', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  roadmapCard: {
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  roadmapTitle: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: '#252530', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: '#9D7AFF' },
  roadmapMilestone: { color: '#71717A', fontSize: 11 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#35354A',
  },
  taskContent: { flex: 1 },
  taskTitle: { color: '#FFF', fontSize: 13, fontWeight: '500' },
  taskMeta: { flexDirection: 'row', gap: 8, marginTop: 3 },
  taskType: { color: '#71717A', fontSize: 9, fontWeight: '700' },
  taskTime: { color: '#71717A', fontSize: 9 },
  taskXp: { color: '#9D7AFF', fontSize: 12, fontWeight: '700' },
});
