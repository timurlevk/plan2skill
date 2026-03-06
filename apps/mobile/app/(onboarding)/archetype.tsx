import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════
// ARCHETYPE — Quiz + Reveal (Step 3/7)
// 3 scenario quiz → archetype reveal + override
// ═══════════════════════════════════════════

const t = {
  violet: '#9D7AFF',
  cyan: '#4ECDC4',
  rose: '#FF6B8A',
  gold: '#FFD166',
  mint: '#6EE7B7',
  bg: '#0C0C10',
  bgCard: '#18181F',
  bgElevated: '#121218',
  border: '#252530',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
};

const ARCHETYPES = [
  { id: 'strategist', icon: '◈', name: 'Strategist', color: '#5B7FCC', tagline: 'Plan first, execute flawlessly', best: 'Structured learners who love roadmaps & systems', stats: [{ name: 'Planning', value: 90 }, { name: 'Focus', value: 85 }, { name: 'Discipline', value: 80 }] },
  { id: 'explorer',   icon: '◎', name: 'Explorer',   color: '#2A9D8F', tagline: 'Curiosity is your superpower', best: 'Curious minds who love discovering new topics', stats: [{ name: 'Curiosity', value: 92 }, { name: 'Adaptability', value: 85 }, { name: 'Discovery', value: 88 }] },
  { id: 'connector',  icon: '◉', name: 'Connector',  color: '#E05580', tagline: 'Together we go further', best: 'Team players who learn best through collaboration', stats: [{ name: 'Teamwork', value: 90 }, { name: 'Empathy', value: 88 }, { name: 'Communication', value: 85 }] },
  { id: 'builder',    icon: '▣', name: 'Builder',     color: '#E8852E', tagline: 'Learn by building real things', best: 'Hands-on creators who learn by doing', stats: [{ name: 'Craft', value: 92 }, { name: 'Persistence', value: 87 }, { name: 'Shipping', value: 85 }] },
  { id: 'innovator',  icon: '★', name: 'Innovator',   color: '#DAA520', tagline: 'Think different, create new paths', best: 'Creative thinkers who challenge conventions', stats: [{ name: 'Creativity', value: 95 }, { name: 'Vision', value: 88 }, { name: 'Originality', value: 90 }] },
];

type ArchetypeId = 'strategist' | 'explorer' | 'connector' | 'builder' | 'innovator';

interface QuizOption {
  text: string;
  scores: Partial<Record<ArchetypeId, number>>;
}

interface Scenario {
  question: string;
  options: QuizOption[];
}

const SCENARIOS: Scenario[] = [
  {
    question: 'A new project drops. You first...',
    options: [
      { text: 'Map out the full plan before touching code', scores: { strategist: 2 } },
      { text: 'Dive in, explore, figure it out', scores: { explorer: 2 } },
      { text: 'Ask the team what they think', scores: { connector: 2 } },
    ],
  },
  {
    question: 'You have a free weekend to learn. You...',
    options: [
      { text: 'Build a side project from scratch', scores: { builder: 2 } },
      { text: 'Deep-dive into a topic you\'ve been curious about', scores: { explorer: 1, innovator: 1 } },
      { text: 'Take a structured online course', scores: { strategist: 1, builder: 1 } },
    ],
  },
  {
    question: 'A teammate is stuck. You...',
    options: [
      { text: 'Share a creative workaround you thought of', scores: { innovator: 2 } },
      { text: 'Pair up and solve it together', scores: { connector: 2 } },
      { text: 'Point them to the docs & best practices', scores: { strategist: 1, builder: 1 } },
    ],
  },
];

// ── Pixel Art Engine (from @plan2skill/pixelforge) ──
import {
  parseArt,
  BODY_TEMPLATES_V1,
  DEFAULT_PALETTES_V1,
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

const charArtStrings: Record<string, string> = BODY_TEMPLATES_V1;
const charPalettes: Record<string, Record<string, string>> = DEFAULT_PALETTES_V1;

// Map archetypes to representative characters
const archetypeChars: Record<string, string> = {
  strategist: 'aria',
  explorer: 'kofi',
  connector: 'zara',
  builder: 'diego',
  innovator: 'mei',
};

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

export default function ArchetypeScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<'quiz' | 'reveal' | 'override'>('quiz');
  const [quizStep, setQuizStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ strategist: 0, explorer: 0, connector: 0, builder: 0, innovator: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [overrideSelection, setOverrideSelection] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const revealScale = useRef(new Animated.Value(0.8)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleAnswer = useCallback((optionIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIndex);

    const option = SCENARIOS[quizStep].options[optionIndex];
    const newScores = { ...scores };
    Object.entries(option.scores).forEach(([archId, pts]) => {
      newScores[archId] = (newScores[archId] || 0) + (pts || 0);
    });
    setScores(newScores);

    setTimeout(() => {
      setSelectedAnswer(null);
      if (quizStep < SCENARIOS.length - 1) {
        setQuizStep(quizStep + 1);
      } else {
        // Determine winner
        const sorted = Object.entries(newScores).sort((a, b) => b[1] - a[1]);
        const winnerId = sorted[0][0];
        setWinner(winnerId);
        setPhase('reveal');

        // Reveal animation
        Animated.parallel([
          Animated.spring(revealScale, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
          Animated.timing(revealOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();
      }
    }, 600);
  }, [quizStep, scores, selectedAnswer, revealScale, revealOpacity]);

  const winnerData = winner ? ARCHETYPES.find(a => a.id === winner) : null;
  const winnerCharId = winner ? archetypeChars[winner] : null;
  const winnerArt = winnerCharId ? parseArt(charArtStrings[winnerCharId], charPalettes[winnerCharId]) : null;

  // ── QUIZ PHASE ──
  if (phase === 'quiz') {
    const scenario = SCENARIOS[quizStep];
    return (
      <View style={styles.container}>
        <View style={styles.glowViolet} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <StepBar current={3} />

            <Text style={styles.quizCounter}>
              Question {quizStep + 1} of {SCENARIOS.length}
            </Text>

            <Text style={styles.title}>{scenario.question}</Text>

            {scenario.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.answerCard,
                    isSelected && styles.answerCardSelected,
                  ]}
                  onPress={() => handleAnswer(idx)}
                  activeOpacity={0.7}
                  disabled={selectedAnswer !== null}
                >
                  <View style={[styles.answerLetter, isSelected && styles.answerLetterSelected]}>
                    <Text style={[styles.answerLetterText, isSelected && { color: t.violet }]}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text style={[styles.answerText, isSelected && { color: t.text }]}>
                    {opt.text}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Quiz progress dots */}
            <View style={styles.dotRow}>
              {SCENARIOS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i <= quizStep && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ── OVERRIDE PHASE ──
  if (phase === 'override') {
    return (
      <View style={styles.container}>
        <View style={styles.glowViolet} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <StepBar current={3} />

          <Text style={styles.title}>Choose your archetype</Text>
          <Text style={styles.subtitle}>Pick the one that resonates most</Text>

          {ARCHETYPES.map((arch) => {
            const isSelected = overrideSelection === arch.id;
            const art = parseArt(charArtStrings[archetypeChars[arch.id]], charPalettes[archetypeChars[arch.id]]);
            return (
              <TouchableOpacity
                key={arch.id}
                style={[
                  styles.overrideCard,
                  isSelected && { backgroundColor: `${arch.color}12`, borderColor: `${arch.color}40` },
                ]}
                onPress={() => setOverrideSelection(arch.id)}
                activeOpacity={0.7}
              >
                <View style={{ marginRight: 4 }}>
                  <PixelCanvas data={art} size={3} />
                </View>
                <View style={styles.overrideContent}>
                  <Text style={[styles.overrideName, { color: isSelected ? arch.color : t.text }]}>
                    <Text style={{ fontSize: 16 }}>{arch.icon} </Text>
                    {arch.name}
                  </Text>
                  <Text style={styles.overrideTagline}>{arch.tagline}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.continueBtn, !overrideSelection && styles.continueBtnDisabled]}
            disabled={!overrideSelection}
            onPress={() => router.push('/(onboarding)/character' as never)}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── REVEAL PHASE ──
  return (
    <View style={styles.container}>
      <View style={styles.glowViolet} />
      <View style={styles.glowCyan} />

      <ScrollView contentContainerStyle={[styles.content, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%' }}>
          <StepBar current={3} />
        </View>

        <Animated.View
          style={{
            alignItems: 'center',
            opacity: revealOpacity,
            transform: [{ scale: revealScale }],
          }}
        >
          {/* Pixel character */}
          {winnerArt && (
            <View style={[styles.revealCharContainer, { shadowColor: winnerData?.color }]}>
              <PixelCanvas data={winnerArt} size={6} />
            </View>
          )}

          {/* Archetype name */}
          <Text style={[styles.revealName, { color: winnerData?.color }]}>
            {winnerData?.icon} {winnerData?.name}
          </Text>
          <Text style={styles.revealTagline}>{winnerData?.tagline}</Text>

          {/* Stat bars */}
          <View style={styles.statContainer}>
            {winnerData?.stats.map((stat, i) => (
              <View key={stat.name} style={styles.statRow}>
                <Text style={styles.statLabel}>{stat.name}</Text>
                <View style={styles.statBarBg}>
                  <View style={[styles.statBarFill, { width: `${stat.value}%`, backgroundColor: winnerData.color }]} />
                </View>
                <Text style={[styles.statValue, { color: winnerData.color }]}>{stat.value}</Text>
              </View>
            ))}
          </View>

          {/* Best for */}
          <View style={styles.bestForBox}>
            <Text style={styles.bestForLabel}>Best for</Text>
            <Text style={styles.bestForText}>{winnerData?.best}</Text>
          </View>

          {/* Change anytime */}
          <TouchableOpacity onPress={() => setPhase('override')} activeOpacity={0.6}>
            <Text style={styles.changeLink}>Not you? Choose manually</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[styles.continueBtn, { width: '100%', marginTop: 24 }]}
          onPress={() => router.push('/(onboarding)/character' as never)}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>This is me!</Text>
        </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 24,
    lineHeight: 32,
  },
  subtitle: {
    color: t.textMuted,
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
  },
  quizCounter: {
    color: t.violet,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  answerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: t.bgCard,
    borderWidth: 1.5,
    borderColor: t.border,
    marginBottom: 10,
    gap: 14,
  },
  answerCardSelected: {
    backgroundColor: 'rgba(157, 122, 255, 0.1)',
    borderColor: 'rgba(157, 122, 255, 0.5)',
    shadowColor: t.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  answerLetter: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerLetterSelected: {
    backgroundColor: 'rgba(157, 122, 255, 0.2)',
  },
  answerLetterText: {
    color: t.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  answerText: {
    color: t.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#252530',
  },
  dotActive: {
    backgroundColor: t.violet,
  },

  // Reveal
  revealCharContainer: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(157, 122, 255, 0.06)',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  revealName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  revealTagline: {
    color: t.textSecondary,
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
  },
  statContainer: {
    width: '100%',
    backgroundColor: 'rgba(24, 24, 31, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: t.border,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  statLabel: {
    color: t.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    width: 90,
  },
  statBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#252530',
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    width: 28,
    textAlign: 'right',
  },
  bestForBox: {
    width: '100%',
    backgroundColor: 'rgba(78, 205, 196, 0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.15)',
  },
  bestForLabel: {
    color: t.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bestForText: {
    color: t.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  changeLink: {
    color: t.textMuted,
    fontSize: 13,
    textDecorationLine: 'underline',
    marginTop: 4,
  },

  // Override
  overrideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: t.bgCard,
    borderWidth: 1.5,
    borderColor: t.border,
    marginBottom: 10,
    gap: 12,
  },
  overrideContent: {
    flex: 1,
  },
  overrideName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  overrideTagline: {
    color: t.textMuted,
    fontSize: 12,
  },

  continueBtn: {
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
