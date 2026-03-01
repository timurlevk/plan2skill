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

// ── Pixel Art Engine (from v7 style guide) ──
const parsePixelArt = (str: string, pal: Record<string, string>) =>
  str.trim().split('\n').map(r => [...r.trim()].map(c => c === '.' ? null : pal[c] || null));

const PixelCanvas = ({ data, size = 5 }: { data: (string | null)[][]; size?: number }) => {
  if (!data?.length) return null;
  const w = data[0].length, h = data.length;
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

// ── Character art strings & palettes (v7) ──
const charArtStrings: Record<string, string> = {
  aria:  '....HHHH....\n...HHHHHH...\n..HHHhHHHH..\n.HHSSSSSSHH.\n.HSEESSEESH.\n.HSEwSSEwSH.\n.HSrSSSSrSH.\n..HSSmmSSH..\n...HSSSSH...\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  kofi:  '..HHHHHHHH..\n..HHHHHHHH..\n...HHHHHH...\n..HSSSSSSH..\n..SEESSEES..\n..SEwSSEwS..\n..SrSSSSrS..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  mei:   '...HHHHHH...\n..HHHHHHHH..\n.HhhhhhhhhH.\n.HHSSSSSSHH.\n.HSEESSEESH.\n.HSEwSSEwSH.\n..HrSSSSrH..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  diego: '..H.HHhH.H..\n..HHHHHHHH..\n..HHHhHHHH..\n..HSSSSSSH..\n..SEESSEES..\n..SEwSSEwS..\n..SrSSSSrS..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  zara:  '..HHH..HHH..\n.HHHH..HHHH.\n..HHHHHHHH..\n..HSSSSSSH..\n..SEESSEES..\n..SEwSSEwS..\n..SrSSSSrS..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  alex:  '..HHHH......\n..HHHHHHH...\n..HHHhHHHH..\n..HSSSSSSH..\n..SEESSEES..\n..SEwSSEwS..\n..SrSSSSrS..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  priya: '....HHHH....\n...HHHHHH...\n..HHHhHHHH..\n.HHSSSSSSHH.\n.HSEESSEESH.\n.HSEwSSEwSH.\n..SrSSSSrSH.\n...SSmmSS.H.\n....SSSS.H..\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
  liam:  '.H..HHHH..H.\n.HHHHHHHHHH.\n..HHHhHHHH..\n..HSSSSSSH..\n..SEESSEES..\n..SEwSSEwS..\n..SrSSSSrS..\n...SSmmSS...\n....SSSS....\n...TTTTTT...\n..TTTTTTTT..\n.ATTTTTTTTA.\n.ATTTttTTTA.\n..TTTTTTTT..\n...PP..PP...\n..FFF..FFF..',
};

const charPalettes: Record<string, Record<string, string>> = {
  aria:  {H:'#E8C35A',h:'#FFD980',S:'#FFDAB9',E:'#2A2040',w:'#FFF',r:'#FFB5A0',m:'#E8907A',T:'#9D7AFF',t:'#7B5FCC',A:'#FFDAB9',P:'#6B4FBB',F:'#5A3FAA'},
  kofi:  {H:'#1A1008',h:'#2A1A10',S:'#8B5E3C',E:'#0A0A1E',w:'#FFF',r:'#7A4E2C',m:'#6A3E20',T:'#2A9D8F',t:'#1A7A6A',A:'#8B5E3C',P:'#155A50',F:'#104A40'},
  mei:   {H:'#1A1A2E',h:'#2A2A40',S:'#DEB887',E:'#1A1020',w:'#FFF',r:'#D4A06A',m:'#C08060',T:'#E879F9',t:'#C060D0',A:'#DEB887',P:'#9040A0',F:'#7030A0'},
  diego: {H:'#5C3A1E',h:'#7A5030',S:'#D4A574',E:'#1A1020',w:'#FFF',r:'#C89058',m:'#B07848',T:'#3B82F6',t:'#2A60C0',A:'#D4A574',P:'#1A3070',F:'#102060'},
  zara:  {H:'#1A1008',h:'#2A1A10',S:'#7B4B2A',E:'#0A0A1E',w:'#FFF',r:'#6A3B1A',m:'#5A3018',T:'#FF6B8A',t:'#D04A6A',A:'#7B4B2A',P:'#8A2040',F:'#701838'},
  alex:  {H:'#6B48A8',h:'#9D7AFF',S:'#D2A37C',E:'#1A1020',w:'#FFF',r:'#C0905A',m:'#A87848',T:'#4ECDC4',t:'#3AABA0',A:'#D2A37C',P:'#1A6A60',F:'#105A50'},
  priya: {H:'#1A1008',h:'#2A1810',S:'#C68642',E:'#0A0A1E',w:'#FFF',r:'#B87530',m:'#A06828',T:'#FFD166',t:'#E0B040',A:'#C68642',P:'#8A6A10',F:'#705808'},
  liam:  {H:'#CC4422',h:'#E85830',S:'#FFE0C0',E:'#1A2030',w:'#FFF',r:'#FFBBA0',m:'#E8907A',T:'#818CF8',t:'#6060D0',A:'#FFE0C0',P:'#3A3080',F:'#2A2070'},
};

const CHARACTERS = [
  { id: 'aria',  name: 'Aria',  gender: 'F',  ethnicity: 'European',    color: '#E8C35A' },
  { id: 'kofi',  name: 'Kofi',  gender: 'M',  ethnicity: 'African',     color: '#2A9D8F' },
  { id: 'mei',   name: 'Mei',   gender: 'F',  ethnicity: 'East Asian',  color: '#E879F9' },
  { id: 'diego', name: 'Diego', gender: 'M',  ethnicity: 'Latino',      color: '#3B82F6' },
  { id: 'zara',  name: 'Zara',  gender: 'F',  ethnicity: 'African',     color: '#FF6B8A' },
  { id: 'alex',  name: 'Alex',  gender: 'NB', ethnicity: 'Mixed',       color: '#4ECDC4' },
  { id: 'priya', name: 'Priya', gender: 'F',  ethnicity: 'South Asian', color: '#FFD166' },
  { id: 'liam',  name: 'Liam',  gender: 'M',  ethnicity: 'Celtic',      color: '#818CF8' },
];

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
  const selectedArt = selected ? parsePixelArt(charArtStrings[selected], charPalettes[selected]) : null;

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
              const art = parsePixelArt(charArtStrings[char.id], charPalettes[char.id]);
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
