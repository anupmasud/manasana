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

const APP_VERSION = 'v1.0.0';
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

/* ---------------- Shared bits ---------------- */

// Tappable wordmark that returns to the home screen — on every sub-page.
function Wordmark({ onHome }) {
  return (
    <Pressable onPress={onHome} accessibilityRole="button" accessibilityLabel="Home" hitSlop={8}>
      <Text style={styles.wordmark}>
        <Text style={styles.wordmarkDev}>मनस् आसन</Text>
        <Text style={styles.wordmarkDot}>  ·  </Text>manasana
      </Text>
    </Pressable>
  );
}

/* ---------------- Screens ---------------- */

function Splash({ onBegin }) {
  return (
    <View style={styles.splash}>
      <View style={styles.splashCenter}>
        <Text style={styles.splashDev}>मनस् आसन</Text>
        <Text style={styles.splashLatin}>manas · āsana</Text>
        <View style={styles.divider} />
        <Text style={styles.splashTagline}>a seat for every feeling</Text>
        <Text style={styles.splashEtym}>
          from Sanskrit — manas, the feeling mind · āsana, a steady seat
        </Text>
        <Pressable
          style={({ pressed }) => [styles.beginBtn, pressed && styles.pressed]}
          onPress={onBegin}
          accessibilityRole="button"
          accessibilityLabel="Begin"
        >
          <Text style={styles.beginText}>Begin</Text>
        </Pressable>
      </View>
      <Text style={styles.splashVersion}>{APP_VERSION}</Text>
    </View>
  );
}

function Home({ onPick }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.homeDev}>मनस् आसन</Text>
      <Text style={styles.homeLatin}>manas · āsana</Text>
      <Text style={styles.homeTagline}>a seat for every feeling</Text>
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
      <Text style={styles.version}>{APP_VERSION}</Text>
    </ScrollView>
  );
}

function PoseList({ emotion, onHome, onPickPose, onStartFlow }) {
  const poses = emotion.poseIds.map((id) => POSES[id]);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.topbar}>
        <Pressable onPress={onHome} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.back}>← Home</Text>
        </Pressable>
        <Wordmark onHome={onHome} />
        <View style={styles.topbarSpacer} />
      </View>

      <Text style={styles.h1}>
        {emotion.emoji} {emotion.label}
      </Text>
      <Text style={styles.subtle}>A few seats to help you feel more settled.</Text>

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

function Practice({ emotion, index, inFlow, onHome, onExit, onNext }) {
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
      <View style={styles.topbar}>
        <Pressable onPress={onExit} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Wordmark onHome={onHome} />
        <View style={styles.topbarSpacer} />
      </View>

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
  // screen: 'splash' | 'home' | 'poses' | 'practice'
  const [screen, setScreen] = useState('splash');
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
      {screen === 'splash' && <Splash onBegin={() => setScreen('home')} />}
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
          onHome={goHome}
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
          onHome={goHome}
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

/* ---------------- Theme ---------------- */

const BG = '#FBF8F1';      // warm cream
const CARD = '#FFFFFF';
const PURPLE = '#5A4FCF';  // brand indigo-purple
const GREEN = '#34A981';   // accent green
const DGREEN = '#1C6B4C';  // deep green (serif italic)
const INK = '#33413B';
const MUTE = '#8A897F';    // warm gray
const TINT = '#ECEAF9';    // soft purple surface
const TINTG = '#E4F1EA';   // soft green surface
const SERIF = Platform.OS === 'web' ? 'Georgia, "Times New Roman", serif' : 'Georgia';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { padding: 20, paddingBottom: 48, maxWidth: 560, width: '100%', alignSelf: 'center' },

  /* Splash */
  splash: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 28 },
  splashCenter: { alignItems: 'center', maxWidth: 520 },
  splashDev: { fontSize: 40, color: PURPLE, fontWeight: '600', textAlign: 'center' },
  splashLatin: { fontSize: 26, color: PURPLE, letterSpacing: 3, marginTop: 6, textAlign: 'center' },
  divider: { width: 96, height: 1.5, backgroundColor: GREEN, marginVertical: 24, opacity: 0.8 },
  splashTagline: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 27, color: DGREEN, textAlign: 'center' },
  splashEtym: { fontSize: 14, color: MUTE, textAlign: 'center', marginTop: 20, lineHeight: 21, paddingHorizontal: 8 },
  beginBtn: { marginTop: 36, backgroundColor: PURPLE, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 52 },
  beginText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 1 },
  splashVersion: { position: 'absolute', bottom: 24, alignSelf: 'center', fontSize: 12, color: MUTE, letterSpacing: 1 },
  version: { fontSize: 12, color: MUTE, textAlign: 'center', marginTop: 10, letterSpacing: 1 },

  /* Home brand */
  homeDev: { fontSize: 30, color: PURPLE, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  homeLatin: { fontSize: 17, color: PURPLE, letterSpacing: 2, textAlign: 'center', marginTop: 4 },
  homeTagline: { fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, color: DGREEN, textAlign: 'center', marginTop: 10 },
  prompt: { fontSize: 15, color: MUTE, textAlign: 'center', marginTop: 14, marginBottom: 18 },

  /* Top bar / wordmark on sub-pages */
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  topbarSpacer: { width: 72 },
  back: { fontSize: 15, color: PURPLE, fontWeight: '600', width: 72 },
  wordmark: { fontSize: 14, color: PURPLE, fontWeight: '600', textAlign: 'center' },
  wordmarkDev: { fontSize: 14, color: PURPLE },
  wordmarkDot: { color: GREEN },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  emotionCard: {
    backgroundColor: CARD,
    width: '48%',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 14,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#5a4fcf',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  emoji: { fontSize: 30, marginBottom: 8 },
  emotionLabel: { fontSize: 16, fontWeight: '600', color: INK, textAlign: 'center' },
  emotionSense: { fontSize: 12, color: MUTE, marginTop: 3, textAlign: 'center' },

  safety: { fontSize: 12, color: MUTE, textAlign: 'center', marginTop: 16, lineHeight: 18 },

  h1: { fontSize: 26, fontWeight: '700', color: INK, marginBottom: 4 },
  subtle: { fontSize: 15, color: MUTE, marginBottom: 18 },

  flowBtn: {
    backgroundColor: PURPLE,
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
    shadowColor: '#5a4fcf',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  poseName: { fontSize: 17, fontWeight: '600', color: INK },
  poseMeta: { fontSize: 13, color: MUTE, marginTop: 3 },
  chev: { fontSize: 26, color: PURPLE, marginLeft: 8 },

  progress: { fontSize: 13, fontWeight: '700', color: PURPLE, marginBottom: 6, letterSpacing: 0.5 },
  perSide: { fontSize: 14, color: MUTE, marginBottom: 12, fontStyle: 'italic' },

  steps: { marginTop: 8, marginBottom: 8 },
  stepRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: TINTG, color: DGREEN,
    textAlign: 'center', lineHeight: 24, fontWeight: '700', marginRight: 12, fontSize: 13,
  },
  stepText: { flex: 1, fontSize: 16, color: INK, lineHeight: 23 },
  cue: { fontSize: 14, color: MUTE, marginBottom: 8, lineHeight: 20 },

  timerBox: {
    backgroundColor: CARD, borderRadius: 18, padding: 20, marginTop: 16, alignItems: 'center',
    shadowColor: '#5a4fcf', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  adjustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  adjBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: TINT,
    alignItems: 'center', justifyContent: 'center',
  },
  adjDisabled: { opacity: 0.35 },
  adjText: { fontSize: 26, color: PURPLE, fontWeight: '700', lineHeight: 28 },
  time: { fontSize: 52, fontWeight: '700', color: INK, marginHorizontal: 22, fontVariant: ['tabular-nums'], minWidth: 120, textAlign: 'center' },
  adjHint: { fontSize: 12, color: MUTE, marginTop: 8 },
  doneText: { fontSize: 16, color: GREEN, fontWeight: '700', marginTop: 12 },

  btnRow: { flexDirection: 'row', marginTop: 18, gap: 12 },
  primaryBtn: { backgroundColor: PURPLE, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: TINT, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 26 },
  secondaryBtnText: { color: PURPLE, fontSize: 16, fontWeight: '600' },

  pressed: { opacity: 0.7 },
});
