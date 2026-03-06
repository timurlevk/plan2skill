import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════
// CHARACTER SELECT (Step 4/7) — v7 Pixel Art
// 8 diverse characters with real pixel art
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

// ── Pixel Art Engine (from @plan2skill/pixelforge) ──
import {
  parseArt,
  BODY_TEMPLATES_V1,
  DEFAULT_PALETTES_V1,
  CHARACTER_META,
  getBodyIds,
} from '@plan2skill/pixelforge';

const PixelCanvas = ({ data, size = 5 }: { data: (string | null)[][]; size?: number }) => {
  if (!data?.length) return null;
  const w = data[0]!.length, h = data.length;
  return (
    <View style={{ width: w * size, height: h * size }}>
      {data.map((row, y) =>
        row.map((c, x) =>
          c ? (
            <View
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: x * size,
                top: y * size,
                width: size,
                height: size,
                backgroundColor: c,
              }}
            />
          ) : null
        )
      )}
    </View>
  );
};

// ── Character data from library ──
const charArtStrings: Record<string, string> = BODY_TEMPLATES_V1;
const charPalettes: Record<string, Record<string, string>> = DEFAULT_PALETTES_V1;

const CHARACTERS = getBodyIds().map((id) => {
  const meta = CHARACTER_META[id];
  return { id, name: meta.name, gender: '', ethnicity: '', color: meta.color };
});

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

export default function CharacterSelectScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const selectedScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (selected) {
      selectedScale.setValue(0.9);
      Animated.spring(selectedScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    }
  }, [selected, selectedScale]);

  const selectedChar = selected ? CHARACTERS.find(c => c.id === selected) : null;
  const selectedArt = selected ? parseArt(charArtStrings[selected], charPalettes[selected]) : null;

  return (
    <View style={styles.container}>
      <View style={styles.glowViolet} />
      <View style={styles.glowCyan} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <StepBar current={4} />

          <Text style={styles.title}>Choose your character</Text>
          <Text style={styles.subtitle}>Purely cosmetic — pick whoever speaks to you</Text>

          {/* Selected character preview */}
          {selectedChar && selectedArt && (
            <Animated.View style={[styles.previewCard, { transform: [{ scale: selectedScale }], shadowColor: selectedChar.color }]}>
              <View style={[styles.previewGlow, { backgroundColor: `${selectedChar.color}10` }]}>
                <PixelCanvas data={selectedArt} size={7} />
              </View>
              <Text style={[styles.previewName, { color: selectedChar.color }]}>{selectedChar.name}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: `${selectedChar.color}15`, borderColor: `${selectedChar.color}30` }]}>
                  <Text style={[styles.badgeText, { color: selectedChar.color }]}>{selectedChar.gender}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: `${selectedChar.color}15`, borderColor: `${selectedChar.color}30` }]}>
                  <Text style={[styles.badgeText, { color: selectedChar.color }]}>{selectedChar.ethnicity}</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Character grid 2x4 */}
          <View style={styles.grid}>
            {CHARACTERS.map((char) => {
              const art = parseArt(charArtStrings[char.id], charPalettes[char.id]);
              const isSelected = selected === char.id;
              return (
                <TouchableOpacity
                  key={char.id}
                  style={[
                    styles.charCard,
                    isSelected && {
                      backgroundColor: `${char.color}12`,
                      borderColor: `${char.color}50`,
                      shadowColor: char.color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.2,
                      shadowRadius: 12,
                      elevation: 4,
                    },
                  ]}
                  onPress={() => setSelected(char.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.charArtWrap}>
                    <PixelCanvas data={art} size={4} />
                  </View>
                  <Text style={[styles.charName, isSelected && { color: char.color }]}>
                    {char.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
            disabled={!selected}
            onPress={() => router.push('/(onboarding)/forge' as never)}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>Continue to The Forge</Text>
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
  previewCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 24, 31, 0.7)',
    borderWidth: 1,
    borderColor: t.border,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  previewGlow: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  charCard: {
    width: '47.5%',
    padding: 14,
    borderRadius: 16,
    backgroundColor: t.bgCard,
    borderWidth: 1.5,
    borderColor: t.border,
    alignItems: 'center',
    marginBottom: 2,
  },
  charArtWrap: {
    marginBottom: 8,
    padding: 6,
  },
  charName: {
    color: t.text,
    fontSize: 13,
    fontWeight: '600',
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
