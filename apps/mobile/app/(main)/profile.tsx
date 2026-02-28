import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 28 }}>🧙</Text>
        </View>
        <Text style={styles.name}>Adventurer</Text>
        <Text style={styles.tier}>Free Tier</Text>
      </View>

      <View style={styles.statsCard}>
        {[
          { label: 'Total XP', value: '0' },
          { label: 'Level', value: '1' },
          { label: 'Tasks Done', value: '0' },
          { label: 'Best Streak', value: '0 days' },
        ].map((stat) => (
          <View key={stat.label} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C10' },
  content: { padding: 20, paddingTop: 60 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 20 },
  profileCard: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#9D7AFF20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  name: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  tier: { color: '#71717A', fontSize: 12, marginTop: 2 },
  statsCard: {
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
    borderRadius: 12,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#252530',
  },
  statLabel: { color: '#71717A', fontSize: 13 },
  statValue: { color: '#FFF', fontSize: 13, fontWeight: '600' },
});
