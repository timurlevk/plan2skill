import { View, Text, ScrollView, StyleSheet } from 'react-native';

const ATTRIBUTES = [
  { key: 'MAS', name: 'Mastery', value: 10, color: '#9D7AFF' },
  { key: 'INS', name: 'Insight', value: 10, color: '#3B82F6' },
  { key: 'INF', name: 'Influence', value: 10, color: '#FF6B8A' },
  { key: 'RES', name: 'Resilience', value: 10, color: '#6EE7B7' },
  { key: 'VER', name: 'Versatility', value: 10, color: '#4ECDC4' },
  { key: 'DIS', name: 'Discovery', value: 10, color: '#FFD166' },
];

export default function CharacterScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Character</Text>

      {/* Character info */}
      <View style={styles.characterCard}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 32 }}>🧙</Text>
        </View>
        <Text style={styles.charName}>Adventurer</Text>
        <Text style={styles.charInfo}>Novice • Strategist</Text>
      </View>

      {/* Attributes */}
      <Text style={styles.sectionTitle}>ATTRIBUTES</Text>
      {ATTRIBUTES.map((attr) => (
        <View key={attr.key} style={styles.attrRow}>
          <Text style={[styles.attrKey, { color: attr.color }]}>{attr.key}</Text>
          <View style={styles.attrBar}>
            <View style={[styles.attrFill, { width: `${attr.value}%`, backgroundColor: attr.color }]} />
          </View>
          <Text style={styles.attrValue}>{attr.value}</Text>
        </View>
      ))}

      {/* Equipment */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>EQUIPMENT</Text>
      <View style={styles.equipGrid}>
        {['Weapon', 'Shield', 'Armor', 'Helmet', 'Boots', 'Ring', 'Companion'].map((slot) => (
          <View key={slot} style={styles.equipSlot}>
            <Text style={styles.equipIcon}>?</Text>
            <Text style={styles.equipLabel}>{slot}</Text>
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
  characterCard: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  charName: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  charInfo: { color: '#71717A', fontSize: 12, marginTop: 2 },
  sectionTitle: { color: '#71717A', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  attrRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  attrKey: { fontSize: 10, fontWeight: '800', width: 28 },
  attrBar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#252530' },
  attrFill: { height: '100%', borderRadius: 3 },
  attrValue: { color: '#71717A', fontSize: 10, width: 20, textAlign: 'right' },
  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  equipSlot: {
    width: '30%',
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  equipIcon: { color: '#71717A', fontSize: 20, marginBottom: 4 },
  equipLabel: { color: '#71717A', fontSize: 9 },
});
