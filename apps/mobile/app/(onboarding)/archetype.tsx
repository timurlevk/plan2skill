import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const ARCHETYPES = [
  { id: 'strategist', icon: '◈', name: 'Strategist', color: '#5B7FCC', bonus: '+10% XP planning' },
  { id: 'explorer', icon: '◎', name: 'Explorer', color: '#2A9D8F', bonus: '+10% XP new topics' },
  { id: 'connector', icon: '◉', name: 'Connector', color: '#E05580', bonus: '+10% XP social' },
  { id: 'builder', icon: '▣', name: 'Builder', color: '#E8852E', bonus: '+10% XP projects' },
  { id: 'innovator', icon: '★', name: 'Innovator', color: '#DAA520', bonus: '+10% XP creative' },
];

export default function ArchetypeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.steps}>
        {Array.from({ length: 7 }, (_, i) => (
          <View key={i} style={[styles.step, { backgroundColor: i <= 1 ? '#9D7AFF' : '#252530' }]} />
        ))}
      </View>

      <Text style={styles.title}>Choose your archetype</Text>
      <Text style={styles.subtitle}>Your learning style defines your XP bonus</Text>

      {ARCHETYPES.map((arch) => (
        <TouchableOpacity
          key={arch.id}
          style={[
            styles.card,
            selected === arch.id && { backgroundColor: `${arch.color}12`, borderColor: `${arch.color}40` },
          ]}
          onPress={() => setSelected(arch.id)}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${arch.color}15` }]}>
            <Text style={[styles.icon, { color: arch.color }]}>{arch.icon}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{arch.name}</Text>
            <Text style={[styles.cardBonus, { color: arch.color }]}>{arch.bonus}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
        disabled={!selected}
        onPress={() => router.push('/(onboarding)/character' as never)}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C10' },
  content: { padding: 24, paddingTop: 60 },
  steps: { flexDirection: 'row', gap: 4, marginBottom: 32 },
  step: { flex: 1, height: 3, borderRadius: 2 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#71717A', fontSize: 14, marginBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
    marginBottom: 10,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  cardContent: { flex: 1 },
  cardTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  cardBonus: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  continueBtn: {
    backgroundColor: '#9D7AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
