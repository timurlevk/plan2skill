import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const ROLES = ['Software Developer', 'Product Manager', 'Data Scientist', 'UX Designer', 'DevOps Engineer', 'Engineering Manager'];

export default function QuestScreen() {
  const router = useRouter();
  const [identity, setIdentity] = useState('');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Step indicator */}
      <View style={styles.steps}>
        {Array.from({ length: 7 }, (_, i) => (
          <View key={i} style={[styles.step, { backgroundColor: i === 0 ? '#9D7AFF' : '#252530' }]} />
        ))}
      </View>

      <Text style={styles.title}>What&apos;s your quest?</Text>
      <Text style={styles.subtitle}>Tell us about yourself and what you want to achieve</Text>

      <TextInput
        style={styles.input}
        value={identity}
        onChangeText={setIdentity}
        placeholder="e.g. Senior Dev → Staff Engineer"
        placeholderTextColor="#71717A"
      />

      <View style={styles.quickPicks}>
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.chip, identity === role && styles.chipActive]}
            onPress={() => setIdentity(role)}
          >
            <Text style={[styles.chipText, identity === role && styles.chipTextActive]}>{role}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, !identity.trim() && styles.continueBtnDisabled]}
        disabled={!identity.trim()}
        onPress={() => router.push('/(onboarding)/archetype' as never)}
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
  input: {
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 14,
    marginBottom: 16,
  },
  quickPicks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#18181F',
    borderWidth: 1,
    borderColor: '#252530',
  },
  chipActive: { backgroundColor: 'rgba(157,122,255,0.12)', borderColor: 'rgba(157,122,255,0.3)' },
  chipText: { color: '#A1A1AA', fontSize: 12, fontWeight: '500' },
  chipTextActive: { color: '#9D7AFF' },
  continueBtn: {
    backgroundColor: '#9D7AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
