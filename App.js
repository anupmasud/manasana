import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { EMOTIONS, POSES, SAFETY_NOTE } from './src/data';

const MIN_SEC = 10;
const MAX_SEC = 600;
const STEP = 10;

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function signalDone() {
  // Best-effort completion cue; harmless if unsupported.
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([120, 60, 120]);
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.AudioContext) {
      const ctx = new window.AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 528;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
      o.start();
      o.stop(ctx.currentTime + 1.15);
    }
  } catch (e) {
    /* no-op */
  }
}

/* ---------------- Screens ---------------- */

function Home({ onPick }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.brandHi}>मानसना</Text>
      <Text style={styles.brand}>Manasana</Text>
      <Text style={styles.tagline}>A pose for every mood</Text>
      <Text style={styles.prompt}>How are you feeling right now?</Text>
      <View style={styles.grid}>
        {EMOTIONS.map((e) => (
          <Pressable
            key={e.id}
            style={({ pressed }) => [styles.emotionCard, pressed && styles.pressed]}
            onPress={() => onPick(e)}
            accessibilityRole="button"
            accessibilityLabel={`I'm feeling ${e.label}`}
          >
            <Text style={styles.emoji}>{e.emoji}</Text>
            <Text style={styles.emotionLabel}>{e.label}</Text>
            <Text style={styles.emotionSense}>{e.sense}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.safety}>{SAFETY_NOTE}</Text>
    </ScrollView>
  );
}

function PoseList({ emotion, onBack, onPickPose, onStartFlow }) {
  const poses = emotion.poseIds.map((id) => POSES[id]);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>← Emotions</Text>
      </Pressable>
      <Text style={styles.h1}>
        {emotion.emoji} {emotion.label}
      </Text>
      <Text style={styles.subtle}>A few poses to help you feel more settled.</Text>

      <Pressable
        style={({ pressed }) => [styles.flowBtn, pressed && styles.pressed]}
        onPress={onStartFlow}
        accessibilityRole="button"
        accessibilityLabel="Start guided flow through all three poses"
      >
        <Text style={styles.flowBtnText}>▶  Start guided flow · {poses.length} poses</Text>
      </Pressable>

      {poses.map((p, i) => (
        <Pressable
          key={p.id}
          style={({ pressed }) => [styles.poseCard, pressed && styles.pressed]}
          onPress={() => onPickPose(i)}
          accessibilityRole="button"
          accessibilityLabel={`${p.name}, ${p.defaultDurationSec} seconds`}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.poseName}>{p.name}</Text>
            <Text style={styles.poseMeta}>
              {fmt(p.defaultDurationSec)}
              {p.perSide ? ' per side' : ''} · level {p.level}
            </Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Practice({ emotion, index, inFlow, onExit, onNext }) {
  const pose = POSES[emotion.poseIds[index]];
  const [remaining, setRemaining] = useState(pose.defaultDurationSec);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const tick = useRef(null);

  // Reset timer whenever the pose changes (e.g. flow advance).
  useEffect(() => {
    setRemaining(pose.defaultDurationSec);
    setRunning(false);
    setDone(false);
  }, [pose.id]);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tick.current);
          setRunning(false);
          setDone(true);
          signalDone();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick.current);
  }, [running]);

  const adjust = useCallback(
    (delta) => {
      if (running) return;
      setRemaining((r) => Math.max(MIN_SEC, Math.min(MAX_SEC, r + delta)));
      setDone(false);
    },
    [running]
  );

  const reset = () => {
    setRunning(false);
    setDone(false);
    setRemaining(pose.defaultDurationSec);
  };

  const isLast = index >= emotion.poseIds.length - 1;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Pressable onPress={onExit} accessibilityRole="button">
        <Text style={styles.back}>← {emotion.label}</Text>
      </Pressable>

      {inFlow && (
        <Text style={styles.progress}>
          Pose {index + 1} of {emotion.poseIds.length}
        </Text>
      )}

      <Text style={styles.h1}>{pose.name}</Text>
      {pose.perSide && <Text style={styles.perSide}>Hold each side, then repeat on the other.</Text>}

      <View style={styles.steps}>
        {pose.instructions.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepNum}>{i + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
      {pose.cue ? <Text style={styles.cue}>💡 {pose.cue}</Text> : null}

      {/* Timer */}
      <View style={styles.timerBox}>
        <View style={styles.adjustRow}>
          <Pressable
            style={({ pressed }) => [styles.adjBtn, (running || remaining <= MIN_SEC) && styles.adjDisabled, pressed && styles.pressed]}
            onPress={() => adjust(-STEP)}
            disabled={running || remaining <= MIN_SEC}
            accessibilityLabel="Decrease time"
          >
            <Text style={styles.adjText}>−</Text>
          </Pressable>
          <Text style={styles.time}>{fmt(remaining)}</Text>
          <Pressable
            style={({ pressed }) => [styles.adjBtn, (running || remaining >= MAX_SEC) && styles.adjDisabled, pressed && styles.pressed]}
            onPress={() => adjust(STEP)}
            disabled={running || remaining >= MAX_SEC}
            accessibilityLabel="Increase time"
          >
            <Text style={styles.adjText}>+</Text>
          </Pressable>
        </View>
        <Text style={styles.adjHint}>{running ? 'Timer running' : 'Adjust, then start when you’re ready'}</Text>

        {done ? <Text style={styles.doneText}>✓ Done — nicely held.</Text> : null}

        <View style={styles.btnRow}>
          {!running ? (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              onPress={() => {
                if (remaining === 0) reset();
                setDone(false);
                setRunning(true);
              }}
              accessibilityLabel="Start timer"
            >
              <Text style={styles.primaryBtnText}>{remaining === 0 ? 'Restart' : 'Start'}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={() => setRunning(false)}
              accessibilityLabel="Pause timer"
            >
              <Text style={styles.secondaryBtnText}>Pause</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={reset}
            accessibilityLabel="Reset timer"
          >
            <Text style={styles.secondaryBtnText}>Reset</Text>
          </Pressable>
        </View>
      </View>

      {/* Flow navigation */}
      {inFlow ? (
        <Pressable
          style={({ pressed }) => [styles.flowBtn, pressed && styles.pressed]}
          onPress={onNext}
          accessibilityRole="button"
        >
          <Text style={styles.flowBtnText}>{isLast ? 'Finish flow' : 'Next pose →'}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

/* ---------------- Root ---------------- */

export default function App() {
  // screen: 'home' | 'poses' | 'practice'
  const [screen, setScreen] = useState('home');
  const [emotion, setEmotion] = useState(null);
  const [index, setIndex] = useState(0);
  const [inFlow, setInFlow] = useState(false);

  const goHome = () => {
    setScreen('home');
    setEmotion(null);
    setInFlow(false);
    setIndex(0);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {screen === 'home' && (
        <Home
          onPick={(e) => {
            setEmotion(e);
            setScreen('poses');
          }}
        />
      )}
      {screen === 'poses' && emotion && (
        <PoseList
          emotion={emotion}
          onBack={goHome}
          onPickPose={(i) => {
            setIndex(i);
            setInFlow(false);
            setScreen('practice');
          }}
          onStartFlow={() => {
            setIndex(0);
            setInFlow(true);
            setScreen('practice');
          }}
        />
      )}
      {screen === 'practice' && emotion && (
        <Practice
          emotion={emotion}
          index={index}
          inFlow={inFlow}
          onExit={() => setScreen('poses')}
          onNext={() => {
            if (index >= emotion.poseIds.length - 1) {
              setScreen('poses');
              setInFlow(false);
            } else {
              setIndex((i) => i + 1);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */

const INK = '#2e3a34';
const MUTE = '#6b7d74';
const ACCENT = '#4c8a72';
const CARD = '#ffffff';
const BG = '#eef4f0';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 48, maxWidth: 560, width: '100%', alignSelf: 'center' },

  brandHi: { fontSize: 24, fontWeight: '600', color: ACCENT, textAlign: 'center', marginTop: 14 },
  brand: { fontSize: 34, fontWeight: '700', color: ACCENT, textAlign: 'center', marginTop: 2 },
  tagline: { fontSize: 17, color: MUTE, textAlign: 'center', marginTop: 6 },
  prompt: { fontSize: 15, color: MUTE, textAlign: 'center', marginTop: 14, marginBottom: 18 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  emotionCard: {
    backgroundColor: CARD,
    width: '48%',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 14,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  emoji: { fontSize: 30, marginBottom: 8 },
  emotionLabel: { fontSize: 16, fontWeight: '600', color: INK, textAlign: 'center' },
  emotionSense: { fontSize: 12, color: MUTE, marginTop: 3, textAlign: 'center' },

  safety: { fontSize: 12, color: MUTE, textAlign: 'center', marginTop: 16, lineHeight: 18 },

  back: { fontSize: 15, color: ACCENT, marginBottom: 10, fontWeight: '600' },
  h1: { fontSize: 26, fontWeight: '700', color: INK, marginBottom: 4 },
  subtle: { fontSize: 15, color: MUTE, marginBottom: 18 },

  flowBtn: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  flowBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  poseCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  poseName: { fontSize: 17, fontWeight: '600', color: INK },
  poseMeta: { fontSize: 13, color: MUTE, marginTop: 3 },
  chev: { fontSize: 26, color: MUTE, marginLeft: 8 },

  progress: { fontSize: 13, fontWeight: '700', color: ACCENT, marginBottom: 6, letterSpacing: 0.5 },
  perSide: { fontSize: 14, color: MUTE, marginBottom: 12, fontStyle: 'italic' },

  steps: { marginTop: 8, marginBottom: 8 },
  stepRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#d9e8e1', color: ACCENT,
    textAlign: 'center', lineHeight: 24, fontWeight: '700', marginRight: 12, fontSize: 13,
  },
  stepText: { flex: 1, fontSize: 16, color: INK, lineHeight: 23 },
  cue: { fontSize: 14, color: MUTE, marginBottom: 8, lineHeight: 20 },

  timerBox: {
    backgroundColor: CARD, borderRadius: 18, padding: 20, marginTop: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  adjustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  adjBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#e3efe9',
    alignItems: 'center', justifyContent: 'center',
  },
  adjDisabled: { opacity: 0.35 },
  adjText: { fontSize: 26, color: ACCENT, fontWeight: '700', lineHeight: 28 },
  time: { fontSize: 52, fontWeight: '700', color: INK, marginHorizontal: 22, fontVariant: ['tabular-nums'], minWidth: 120, textAlign: 'center' },
  adjHint: { fontSize: 12, color: MUTE, marginTop: 8 },
  doneText: { fontSize: 16, color: ACCENT, fontWeight: '700', marginTop: 12 },

  btnRow: { flexDirection: 'row', marginTop: 18, gap: 12 },
  primaryBtn: { backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#e3efe9', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 26 },
  secondaryBtnText: { color: ACCENT, fontSize: 16, fontWeight: '600' },

  pressed: { opacity: 0.7 },
});
