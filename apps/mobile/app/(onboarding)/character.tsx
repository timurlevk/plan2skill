import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const CHARACTERS = [
  { id: 'aria', name: 'Aria', color: '#E8C35A' },
  { id: 'kofi', name: 'Kofi', color: '#2A9D8F' },
  { id: 'mei', name: 'Mei', color: '#E879F9' },
  { id: 'diego', name: 'Diego', color: '#3B82F6' },
  { id: 'zara', name: 'Zara', color: '#FF6B8A' },
  { id: 'alex', name: 'Alex', color: '#4ECDC4' },
  { id: 'priya', name: 'Priya', color: '#FFD166' },
  { id: 'liam', name: 'Liam', color: '#818CF8' },
];

export default function CharacterSelectScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.steps}>
        {Array.from({ length: 7 }, (_, i) => (
          <View key={i} style={[styles.step, { backgroundColor: i <= 2 ? '#9D7AFF' : '#252530' }]} />
        ))}
      </View>

      <Text style={styles.title}>Choose your character</Text>
      <Text style={styles.subtitle}>8 diverse characters — purely cosmetic</Text>

      <View style={styles.grid}>
        {CHARACTERS.map((char) => (
          <TouchableOpacity
            key={char.id}
            style={[
              styles.charCard,
              selected === char.id && { backgroundColor: `${char.color}12`, borderColor: `${char.color}40` },
            ]}
            onPress={() => setSelected(char.id)}
          >
            <View style={[styles.charAvatar, { backgroundColor: `${char.color}15` }]}>
              <Text style={{ fontSize: 24 }}>🧙</Text>
            </View>
            <Text style={styles.charName}>{char.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
        disabled={!selected}
        onPress={() => router.push('/(onboarding)/forge' as never)}
      >
        <Text style={styles.continueBtnText}>Continue to The Forge</Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  charCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
    alignItems: 'center',
    marginBottom: 4,
  },
  charAvatar: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  charName: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  continueBtn: {
    backgroundColor: '#9D7AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
