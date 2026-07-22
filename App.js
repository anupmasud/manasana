import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { EMOTIONS, POSES, SAFETY_NOTE } from './src/data';

const APP_VERSION = 'v1.2.0';
const MIN_SEC = 10;
const MAX_SEC = 600;
const STEP = 10;
const REST_STEP = 5;
const REST_MAX = 120;
const REPEAT_MAX = 10;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

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

function TopBar({ backLabel, onBack, onHome }) {
  return (
    <View style={styles.topbar}>
      <Pressable onPress={onBack} accessibilityRole="button" hitSlop={8}>
        <Text style={styles.back}>← {backLabel}</Text>
      </Pressable>
      <Wordmark onHome={onHome} />
      <View style={styles.topbarSpacer} />
    </View>
  );
}

function Stepper({ label, onDec, onInc, decDisabled, incDisabled }) {
  return (
    <View style={styles.stepper}>
      <Pressable
        style={({ pressed }) => [styles.adjBtnSm, decDisabled && styles.adjDisabled, pressed && styles.pressed]}
        onPress={onDec}
        disabled={decDisabled}
        accessibilityLabel="Decrease"
      >
        <Text style={styles.adjTextSm}>−</Text>
      </Pressable>
      <Text style={styles.stepperVal}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.adjBtnSm, incDisabled && styles.adjDisabled, pressed && styles.pressed]}
        onPress={onInc}
        disabled={incDisabled}
        accessibilityLabel="Increase"
      >
        <Text style={styles.adjTextSm}>+</Text>
      </Pressable>
    </View>
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

function EmotionCard({ e, onPick }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.emotionCard, pressed && styles.pressed]}
      onPress={() => onPick(e)}
      accessibilityRole="button"
      accessibilityLabel={`I'm feeling ${e.label}`}
    >
      <Text style={styles.emoji}>{e.emoji}</Text>
      <Text style={styles.emotionLabel}>{e.label}</Text>
      <Text style={styles.emotionSense}>{e.sense}</Text>
    </Pressable>
  );
}

function Home({ onPick }) {
  const difficult = EMOTIONS.filter((e) => e.group === 'difficult');
  const good = EMOTIONS.filter((e) => e.group === 'good');
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.homeDev}>मनस् आसन</Text>
      <Text style={styles.homeLatin}>manas · āsana</Text>
      <Text style={styles.homeTagline}>a seat for every feeling</Text>
      <Text style={styles.prompt}>How are you feeling right now?</Text>

      <Text style={styles.groupLabel}>Difficult feelings</Text>
      <View style={styles.grid}>
        {difficult.map((e) => (
          <EmotionCard key={e.id} e={e} onPick={onPick} />
        ))}
      </View>

      <Text style={styles.groupLabel}>Good feelings</Text>
      <View style={styles.grid}>
        {good.map((e) => (
          <EmotionCard key={e.id} e={e} onPick={onPick} />
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
      <TopBar backLabel="Home" onBack={onHome} onHome={onHome} />

      <Text style={styles.h1}>
        {emotion.emoji} {emotion.label}
      </Text>
      <Text style={styles.subtle}>A few seats to help you feel more settled.</Text>

      <Pressable
        style={({ pressed }) => [styles.flowBtn, pressed && styles.pressed]}
        onPress={onStartFlow}
        accessibilityRole="button"
        accessibilityLabel="Set up a guided flow"
      >
        <Text style={styles.flowBtnText}>▶  Guided flow · {poses.length} poses</Text>
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

function FlowSetup({ emotion, onBack, onHome, onStart }) {
  const poses = emotion.poseIds.map((id) => POSES[id]);
  const [include, setInclude] = useState(poses.map(() => true));
  const [durations, setDurations] = useState(poses.map((p) => p.defaultDurationSec));
  const [restSec, setRestSec] = useState(15);
  const [repeats, setRepeats] = useState(1);
  const [continuous, setContinuous] = useState(true);

  const includedCount = include.filter(Boolean).length;
  const toggle = (i) => setInclude((inc) => inc.map((v, k) => (k === i ? !v : v)));
  const setDur = (i, delta) =>
    setDurations((ds) => ds.map((d, k) => (k === i ? clamp(d + delta, MIN_SEC, MAX_SEC) : d)));

  const estimate = () => {
    let total = 0;
    const incl = poses.map((p, i) => i).filter((i) => include[i]);
    for (let r = 0; r < repeats; r++) {
      incl.forEach((i, k) => {
        total += durations[i];
        const lastOverall = r === repeats - 1 && k === incl.length - 1;
        if (restSec > 0 && !lastOverall) total += restSec;
      });
    }
    return total;
  };

  const start = () => {
    if (includedCount === 0) return;
    const incl = poses.map((p, i) => ({ p, i })).filter((x) => include[x.i]);
    const steps = [];
    for (let r = 1; r <= repeats; r++) {
      incl.forEach((x, k) => {
        steps.push({
          type: 'pose',
          poseId: x.p.id,
          duration: durations[x.i],
          perSide: x.p.perSide,
          poseNum: k + 1,
          totalPoses: incl.length,
          round: r,
          totalRounds: repeats,
        });
        const lastOverall = r === repeats && k === incl.length - 1;
        if (restSec > 0 && !lastOverall) steps.push({ type: 'rest', duration: restSec });
      });
    }
    onStart(steps, continuous);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <TopBar backLabel="Back" onBack={onBack} onHome={onHome} />

      <Text style={styles.h1}>Guided flow</Text>
      <Text style={styles.subtle}>
        {emotion.emoji} {emotion.label} — set it up your way.
      </Text>

      {/* Choose which to include + change duration */}
      <Text style={styles.sectionLabel}>Poses & durations</Text>
      {poses.map((p, i) => (
        <View key={p.id} style={[styles.setupCard, !include[i] && styles.setupCardOff]}>
          <View style={styles.setupRow}>
            <Switch
              value={include[i]}
              onValueChange={() => toggle(i)}
              trackColor={{ true: PURPLE, false: '#cfccc4' }}
              thumbColor="#fff"
              accessibilityLabel={`Include ${p.name}`}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.setupName, !include[i] && styles.dim]}>{p.name}</Text>
              {p.perSide ? <Text style={styles.setupSub}>per side</Text> : null}
            </View>
          </View>
          {include[i] && (
            <Stepper
              label={fmt(durations[i])}
              onDec={() => setDur(i, -STEP)}
              onInc={() => setDur(i, STEP)}
              decDisabled={durations[i] <= MIN_SEC}
              incDisabled={durations[i] >= MAX_SEC}
            />
          )}
        </View>
      ))}

      {/* Rest */}
      <View style={styles.optRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.optName}>Rest between poses</Text>
          <Text style={styles.optSub}>a pause to breathe</Text>
        </View>
        <Stepper
          label={restSec === 0 ? 'None' : fmt(restSec)}
          onDec={() => setRestSec((r) => clamp(r - REST_STEP, 0, REST_MAX))}
          onInc={() => setRestSec((r) => clamp(r + REST_STEP, 0, REST_MAX))}
          decDisabled={restSec <= 0}
          incDisabled={restSec >= REST_MAX}
        />
      </View>

      {/* Repeats */}
      <View style={styles.optRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.optName}>Repeat flow</Text>
          <Text style={styles.optSub}>run the whole set again</Text>
        </View>
        <Stepper
          label={`${repeats}×`}
          onDec={() => setRepeats((n) => clamp(n - 1, 1, REPEAT_MAX))}
          onInc={() => setRepeats((n) => clamp(n + 1, 1, REPEAT_MAX))}
          decDisabled={repeats <= 1}
          incDisabled={repeats >= REPEAT_MAX}
        />
      </View>

      {/* Continuous */}
      <View style={styles.optRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.optName}>Run continuously</Text>
          <Text style={styles.optSub}>
            {continuous
              ? 'timer flows through poses & rests automatically'
              : 'you start each pose yourself'}
          </Text>
        </View>
        <Switch
          value={continuous}
          onValueChange={setContinuous}
          trackColor={{ true: PURPLE, false: '#cfccc4' }}
          thumbColor="#fff"
          accessibilityLabel="Run continuously"
        />
      </View>

      <Text style={styles.estimate}>
        {includedCount === 0
          ? 'Select at least one pose'
          : `${includedCount} pose${includedCount > 1 ? 's' : ''}${repeats > 1 ? ` · ${repeats}×` : ''} · about ${Math.round(estimate() / 60) || 1} min`}
      </Text>

      <Pressable
        style={({ pressed }) => [styles.flowBtn, includedCount === 0 && styles.adjDisabled, pressed && styles.pressed]}
        onPress={start}
        disabled={includedCount === 0}
        accessibilityRole="button"
        accessibilityLabel="Start flow"
      >
        <Text style={styles.flowBtnText}>Start flow →</Text>
      </Pressable>
    </ScrollView>
  );
}

function FlowRunner({ emotion, steps, continuous, onHome, onExit }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [remaining, setRemaining] = useState(steps[0].duration);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const started = useRef(false);
  const tick = useRef(null);

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;
  const pose = step.type === 'pose' ? POSES[step.poseId] : null;

  // On step change: reset the clock; auto-start next step in continuous mode.
  useEffect(() => {
    setRemaining(steps[stepIndex].duration);
    if (continuous && started.current && !finished) {
      setRunning(true);
    } else {
      setRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // Countdown.
  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tick.current);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick.current);
  }, [running]);

  // Handle a step reaching zero.
  useEffect(() => {
    if (remaining !== 0) return;
    signalDone();
    if (isLast) {
      setFinished(true);
    } else if (continuous && started.current) {
      setStepIndex((i) => i + 1);
    }
    // manual & not last: wait for the user to tap Next
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const beginTimer = () => {
    started.current = true;
    if (remaining === 0) setRemaining(step.duration);
    setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    setRemaining(step.duration);
  };
  const goNext = () => {
    if (isLast) {
      setFinished(true);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  if (finished) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <TopBar backLabel="Poses" onBack={onExit} onHome={onHome} />
        <View style={styles.finishBox}>
          <Text style={styles.finishEmoji}>🙏</Text>
          <Text style={styles.finishTitle}>Flow complete</Text>
          <Text style={styles.finishSub}>Take a breath. Notice how you feel now.</Text>
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={onExit}>
            <Text style={styles.primaryBtnText}>Back to poses</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]} onPress={onHome}>
            <Text style={styles.linkBtnText}>Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const paused = started.current && !running && remaining > 0 && remaining < step.duration;
  const completedManual = !running && remaining === 0 && !isLast;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <TopBar backLabel="Poses" onBack={onExit} onHome={onHome} />

      <View style={styles.progressRow}>
        <Text style={styles.progress}>
          {step.type === 'rest'
            ? 'Rest'
            : `Pose ${step.poseNum} of ${step.totalPoses}${step.totalRounds > 1 ? ` · round ${step.round}/${step.totalRounds}` : ''}`}
        </Text>
        {continuous ? <Text style={styles.contChip}>continuous</Text> : null}
      </View>

      {step.type === 'rest' ? (
        <>
          <Text style={styles.h1}>Rest</Text>
          <Text style={styles.perSide}>Soften. Let your breath settle before the next pose.</Text>
        </>
      ) : (
        <>
          <Text style={styles.h1}>{pose.name}</Text>
          {pose.perSide && <Text style={styles.perSide}>Hold each side, then repeat on the other.</Text>}
          <View style={styles.steps}>
            {pose.instructions.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </View>
          {pose.cue ? <Text style={styles.cue}>💡 {pose.cue}</Text> : null}
        </>
      )}

      {/* Timer */}
      <View style={styles.timerBox}>
        <Text style={styles.time}>{fmt(remaining)}</Text>
        <Text style={styles.adjHint}>
          {running ? (continuous ? 'flowing…' : 'timer running') : completedManual ? 'done — tap Next' : paused ? 'paused' : 'tap Start when ready'}
        </Text>

        <View style={styles.btnRow}>
          {running ? (
            <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={() => setRunning(false)}>
              <Text style={styles.secondaryBtnText}>Pause</Text>
            </Pressable>
          ) : completedManual ? (
            <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={goNext}>
              <Text style={styles.primaryBtnText}>Next →</Text>
            </Pressable>
          ) : (
            <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={beginTimer}>
              <Text style={styles.primaryBtnText}>{paused ? 'Resume' : 'Start'}</Text>
            </Pressable>
          )}

          {running || paused ? (
            <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={reset}>
              <Text style={styles.secondaryBtnText}>Reset</Text>
            </Pressable>
          ) : null}

          {!isLast ? (
            <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={goNext}>
              <Text style={styles.secondaryBtnText}>Skip</Text>
            </Pressable>
          ) : (
            <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={() => setFinished(true)}>
              <Text style={styles.secondaryBtnText}>Finish</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function Practice({ emotion, index, onHome, onExit }) {
  const pose = POSES[emotion.poseIds[index]];
  const [remaining, setRemaining] = useState(pose.defaultDurationSec);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const tick = useRef(null);

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
      setRemaining((r) => clamp(r + delta, MIN_SEC, MAX_SEC));
      setDone(false);
    },
    [running]
  );

  const reset = () => {
    setRunning(false);
    setDone(false);
    setRemaining(pose.defaultDurationSec);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <TopBar backLabel="Back" onBack={onExit} onHome={onHome} />

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
            <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={() => setRunning(false)}>
              <Text style={styles.secondaryBtnText}>Pause</Text>
            </Pressable>
          )}
          <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={reset}>
            <Text style={styles.secondaryBtnText}>Reset</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

/* ---------------- Root ---------------- */

export default function App() {
  // screen: 'splash' | 'home' | 'poses' | 'practice' | 'flowSetup' | 'flowRun'
  const [screen, setScreen] = useState('splash');
  const [emotion, setEmotion] = useState(null);
  const [index, setIndex] = useState(0);
  const [flow, setFlow] = useState({ steps: [], continuous: true });

  const goHome = () => {
    setScreen('home');
    setEmotion(null);
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
            setScreen('practice');
          }}
          onStartFlow={() => setScreen('flowSetup')}
        />
      )}
      {screen === 'flowSetup' && emotion && (
        <FlowSetup
          emotion={emotion}
          onBack={() => setScreen('poses')}
          onHome={goHome}
          onStart={(steps, continuous) => {
            setFlow({ steps, continuous });
            setScreen('flowRun');
          }}
        />
      )}
      {screen === 'flowRun' && emotion && flow.steps.length > 0 && (
        <FlowRunner
          emotion={emotion}
          steps={flow.steps}
          continuous={flow.continuous}
          onHome={goHome}
          onExit={() => setScreen('poses')}
        />
      )}
      {screen === 'practice' && emotion && (
        <Practice emotion={emotion} index={index} onHome={goHome} onExit={() => setScreen('poses')} />
      )}
    </SafeAreaView>
  );
}

/* ---------------- Theme ---------------- */

const BG = '#FBF8F1';
const CARD = '#FFFFFF';
const PURPLE = '#5A4FCF';
const GREEN = '#34A981';
const DGREEN = '#1C6B4C';
const INK = '#33413B';
const MUTE = '#8A897F';
const TINT = '#ECEAF9';
const TINTG = '#E4F1EA';
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
  prompt: { fontSize: 15, color: MUTE, textAlign: 'center', marginTop: 14, marginBottom: 8 },
  groupLabel: { fontSize: 13, fontWeight: '700', color: PURPLE, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 14, marginBottom: 12 },

  /* Top bar */
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  topbarSpacer: { width: 72 },
  back: { fontSize: 15, color: PURPLE, fontWeight: '600', width: 72 },
  wordmark: { fontSize: 14, color: PURPLE, fontWeight: '600', textAlign: 'center' },
  wordmarkDev: { fontSize: 14, color: PURPLE },
  wordmarkDot: { color: GREEN },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  emotionCard: {
    backgroundColor: CARD, width: '48%', borderRadius: 18, paddingVertical: 20, paddingHorizontal: 14,
    marginBottom: 14, alignItems: 'center',
    shadowColor: '#5a4fcf', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  emoji: { fontSize: 30, marginBottom: 8 },
  emotionLabel: { fontSize: 16, fontWeight: '600', color: INK, textAlign: 'center' },
  emotionSense: { fontSize: 12, color: MUTE, marginTop: 3, textAlign: 'center' },
  safety: { fontSize: 12, color: MUTE, textAlign: 'center', marginTop: 16, lineHeight: 18 },

  h1: { fontSize: 26, fontWeight: '700', color: INK, marginBottom: 4 },
  subtle: { fontSize: 15, color: MUTE, marginBottom: 18 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: PURPLE, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },

  flowBtn: { backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 18 },
  flowBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  poseCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#5a4fcf', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  poseName: { fontSize: 17, fontWeight: '600', color: INK },
  poseMeta: { fontSize: 13, color: MUTE, marginTop: 3 },
  chev: { fontSize: 26, color: PURPLE, marginLeft: 8 },

  /* Flow setup */
  setupCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#5a4fcf', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  setupCardOff: { opacity: 0.6 },
  setupRow: { flexDirection: 'row', alignItems: 'center' },
  setupName: { fontSize: 16, fontWeight: '600', color: INK },
  setupSub: { fontSize: 12, color: MUTE, marginTop: 2 },
  dim: { color: MUTE },
  optRow: {
    backgroundColor: CARD, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#5a4fcf', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  optName: { fontSize: 16, fontWeight: '600', color: INK },
  optSub: { fontSize: 12, color: MUTE, marginTop: 2 },
  estimate: { fontSize: 14, color: DGREEN, fontWeight: '600', textAlign: 'center', marginTop: 6, marginBottom: 14 },

  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  stepperVal: { fontSize: 18, fontWeight: '700', color: INK, minWidth: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },
  adjBtnSm: { width: 40, height: 40, borderRadius: 20, backgroundColor: TINT, alignItems: 'center', justifyContent: 'center' },
  adjTextSm: { fontSize: 22, color: PURPLE, fontWeight: '700', lineHeight: 24 },

  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  progress: { fontSize: 13, fontWeight: '700', color: PURPLE, letterSpacing: 0.5 },
  contChip: { fontSize: 11, fontWeight: '700', color: DGREEN, backgroundColor: TINTG, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  perSide: { fontSize: 14, color: MUTE, marginBottom: 12, fontStyle: 'italic' },

  steps: { marginTop: 8, marginBottom: 8 },
  stepRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: TINTG, color: DGREEN, textAlign: 'center', lineHeight: 24, fontWeight: '700', marginRight: 12, fontSize: 13 },
  stepText: { flex: 1, fontSize: 16, color: INK, lineHeight: 23 },
  cue: { fontSize: 14, color: MUTE, marginBottom: 8, lineHeight: 20 },

  timerBox: {
    backgroundColor: CARD, borderRadius: 18, padding: 20, marginTop: 16, alignItems: 'center',
    shadowColor: '#5a4fcf', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  adjustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  adjBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: TINT, alignItems: 'center', justifyContent: 'center' },
  adjDisabled: { opacity: 0.35 },
  adjText: { fontSize: 26, color: PURPLE, fontWeight: '700', lineHeight: 28 },
  time: { fontSize: 52, fontWeight: '700', color: INK, marginHorizontal: 22, fontVariant: ['tabular-nums'], minWidth: 120, textAlign: 'center' },
  adjHint: { fontSize: 12, color: MUTE, marginTop: 8 },
  doneText: { fontSize: 16, color: GREEN, fontWeight: '700', marginTop: 12 },

  btnRow: { flexDirection: 'row', marginTop: 18, gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  primaryBtn: { backgroundColor: PURPLE, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 36 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: TINT, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 22 },
  secondaryBtnText: { color: PURPLE, fontSize: 16, fontWeight: '600' },
  linkBtn: { marginTop: 14, paddingVertical: 8 },
  linkBtnText: { color: PURPLE, fontSize: 15, fontWeight: '600' },

  /* Finish */
  finishBox: { alignItems: 'center', paddingVertical: 40 },
  finishEmoji: { fontSize: 48, marginBottom: 12 },
  finishTitle: { fontSize: 26, fontWeight: '700', color: INK, marginBottom: 6 },
  finishSub: { fontSize: 15, color: MUTE, textAlign: 'center', marginBottom: 26, lineHeight: 21 },

  pressed: { opacity: 0.7 },
});
