# Manasana — Requirements (Lean)

*Emotion-driven yoga: pick how you feel, get a short curated set of poses with guided setup and an optional timer.*

---

## 1. Purpose

Help a user move from an emotional state toward a more balanced one by suggesting a small, curated set of yoga poses matched to the emotion they select — with clear setup instructions and an optional per-pose timer.

## 2. Goals

- Let the user express a current emotion in one tap.
- Suggest a **short, focused** set of poses for that emotion (roughly 2–4), never an overwhelming list.
- Give clear, step-by-step setup instructions for a chosen pose.
- Offer a timer the user *may* start — practice is never forced or auto-started.
- Feel calm, fast, and low-friction end to end.

## 3. Non-Goals (v1)

- No accounts, login, or cloud sync.
- No live video, motion tracking, or pose-correctness detection.
- No social features, sharing, or streaks/gamification.
- No medical or therapeutic claims.
- No custom pose creation by the user.

## 4. Core User Flow

1. **Select emotion** — user picks from the fixed v1 list (see §6.1).
2. **See suggestions** — app shows only the poses mapped to that emotion (e.g., *Confused → Modified Tree Pose, Seated Twist, Eagle Arms*), with the option to **Start guided flow** (all 3 in order) or tap a single pose.
3. **Practice a pose** — app displays step-by-step setup instructions and a timer for that pose.
4. **Optional timer** — user may start the timer. It only runs if started (never auto-starts).
5. **Advance** — in a guided flow, on timer completion (or a *Next* tap) the app moves to the next pose, showing progress (e.g., *2 of 3*). A single-pose user returns to the list.
6. **Finish / repeat** — after the last pose (or manual exit) the user can return to the pose list or pick another emotion.

## 5. Functional Requirements

### Emotion selection
- FR-1: Display a fixed set of selectable emotions on the home screen.
- FR-2: Selecting an emotion navigates to that emotion's suggested poses.

### Pose suggestions
- FR-3: Each emotion maps to a predefined, ordered list of 3 poses.
- FR-4: Only poses mapped to the selected emotion are shown — nothing else.
- FR-5: Each pose shows at minimum a name and an image/illustration.

### Guided flow
- FR-12: From the pose list the user can either tap a single pose, or **Start guided flow** through all 3 poses in the listed order.
- FR-13: In a guided flow, each pose shows its instructions and timer; timers still never auto-start (FR-8 applies).
- FR-14: On timer completion (or a *Next* action) the flow advances to the next pose and shows progress (e.g., *2 of 3*).
- FR-15: The user can exit the flow at any point and return to the pose list without losing the emotion selection.

### Pose instructions
- FR-6: Selecting a pose shows step-by-step setup instructions.
- FR-7: Instructions include a suggested default duration (used to pre-fill the timer).

### Timer
- FR-8: The timer does **not** start automatically — it starts only on explicit user action.
- FR-9: Timer is pre-filled with the pose's default duration; user can start/pause/reset.
- FR-9a: The user can **adjust the duration** (up/down) before starting, within a sensible range (e.g. 10s–600s in 5–10s steps). The default is only a starting point.
- FR-9b: An adjusted duration applies to the current pose only and does **not** persist between poses or launches (stateless, §7).
- FR-10: On completion, signal the user (sound and/or haptic/visual) and offer to return to the list.

### Navigation
- FR-11: User can go back at any step (pose → list → emotions) without losing their emotion selection.

## 6. Data Model (v1)

Static, bundled content — no backend required.

**Emotion**
- `id`, `label`, `poseIds[]` (ordered)

**Pose**
- `id`, `name`, `imageRef`, `instructions[]` (ordered steps), `defaultDurationSec`, `perSide` (bool)

An emotion's ordered `poseIds[]` also defines the **guided-flow order**. Pose instructions and default durations are maintained in [poses.md](poses.md).

*Example:*
```
Emotion: Confused → [ modified-tree, seated-twist, eagle-arms ]   // also the flow order
Pose: modified-tree → name, image, [step1, step2, ...], defaultDurationSec: 30, perSide: true
```

### 6.1 v1 Emotions

Ten emotions ship in v1, each with 3 candidate poses (beginner–intermediate). These are **drafts pending review** by someone with yoga knowledge (see §8). Level key: **B** = beginner, **B–I** = beginner with an intermediate variation, **I** = intermediate (offer a beginner modification).

| # | Emotion | Candidate poses | Why these |
|---|---------|-----------------|-----------|
| 1 | **Exhausted** *(depleted)* | Legs-Up-the-Wall (B) · Supported Child's Pose (B) · Reclined Bound Angle (B) | Fully supported, near-zero effort — restore rather than exert. |
| 2 | **Confused** *(mental fog)* | Modified Tree Pose (B) · Seated Twist (B) · Eagle Arms (B) | Balance and gentle twists to clear fog and refocus. |
| 3 | **Afraid** *(fear/anxiety)* | Mountain Pose (B) · Standing Forward Fold (B) · Cat-Cow (B) | Grounding and folding inward to calm the nervous system. |
| 4 | **Hopeless** *(despair)* | Cobra Pose (B) · Bridge Pose (B–I) · Warrior II (B–I) | Gentle chest-opening and an expansive standing pose lift a collapsed, low posture. |
| 5 | **Restless** *(can't settle)* | Tree Pose (B–I) · Warrior II (B–I) · Seated Forward Fold (B) | Balance and standing poses channel excess energy into focus. |
| 6 | **Overwhelmed** *(too much)* | Child's Pose (B) · Standing Forward Fold (B) · Legs-Up-the-Wall (B) | Contained, inward shapes reduce input and reset. |
| 7 | **Numb** *(flat)* | Cat-Cow (B) · Low Lunge (B) · Bridge Pose (B–I) | Breath-linked movement and strong leg sensation to reconnect with the body. |
| 8 | **Lonely** *(disconnected)* | Sphinx Pose (B) · Reclined Bound Angle (B) · Cow Face Arms (B) | Gentle heart-openers and a self-embrace to feel held and open. |
| 9 | **Unmotivated / Stuck** | Chair Pose (B–I) · Low Lunge (B) · Upward Salute (B) | Strong, heat-building poses to spark momentum. |
| 10 | **Ashamed** *(guilt)* | Child's Pose (B) · Cobra Pose (B) · Reclined Bound Angle (B) | Safe grounding and gentle openness to ease self-judgment. |

*Notes:* poses recur across related states (e.g. restorative shapes for both *exhausted* and *overwhelmed*) — this is intentional. Deep backbends (Camel, Fish) were removed for accessibility. **Cobra**, **Bridge**, and **Sphinx** remain as gentle, beginner-friendly backbends — flag if you'd like these swapped for non-backbend openers too.

## 7. Non-Functional Requirements

- **Simplicity**: Any pose reachable in ≤ 2 taps from launch.
- **Offline**: Fully functional with no network (content bundled in-app).
- **Performance**: Instant transitions; no loading spinners for core content.
- **Accessibility**: Legible type, sufficient contrast, screen-reader labels for emotions/poses; timer state announced.
- **Calm UX**: Quiet visual design; no ads, popups, or interruptions during a timed pose.
- **Privacy**: No personal data collected in v1.
- **Stateless**: No data persists between launches in v1 — no saved emotion, history, or favorites.

## 8. Content Requirements

- A curated emotion→pose mapping reviewed by someone with yoga knowledge (§6.1).
- Each pose: an accurate illustration/photo, safe setup steps, and a sensible default duration — drafted in [poses.md](poses.md).
- A brief safety note ("move gently, never into pain; not medical advice").

## 9. Platform & Architecture

**v1 targets:** iOS (mobile-first) **and** a web/PWA build, from a **single shared codebase**.

- **Stack:** Expo (React Native + React Native Web). One codebase compiles to a genuinely native iOS app (native UI, not a webview) and a responsive web/PWA. ~90% of code — screens, emotion→pose data, timer logic — is shared; only small platform touches differ (haptics, install prompt).
- **Why Expo:** Flutter also does iOS+web but its web output is heavier and weaker as a PWA; separate SwiftUI + web means two codebases for no real gain at this scope. Shared-codebase Expo is the fastest path to shipping both.
- **iOS delivery:** native build via Expo/EAS; distributed through TestFlight → App Store.
- **Web/PWA delivery:** static hosting; installable to home screen, works offline (content bundled).
- **Android:** not a v1 target, but the same codebase can add it later at low cost.
- **No backend:** content is bundled and the app is stateless (§7) — no server, accounts, or network required.

## 10. Open Questions

- Yoga review to confirm/adjust the candidate pose mappings (§6.1) and the draft instructions/durations ([poses.md](poses.md)).

## 11. Future (Out of Scope for v1)

- Hands-free auto-advance and breath-paced transitions between poses (v1 advances on user action / timer end).
- Breathing/audio guidance during holds.
- Local history or favorites.
- Expanded emotion and pose library.
