# Manasana

Emotion-driven yoga. Pick how you're feeling, get a short curated set of yoga poses matched to that emotion, follow guided setup instructions, and — if you choose — run a timer for each pose.

> Example: choose **"I'm feeling confused"** → Manasana suggests *Modified Tree Pose, Seated Twist, and Eagle Arms* only. Tap one, read the setup steps, and start the timer if you want.

## Status

**v1 live (web/PWA):** https://anupmasud.github.io/manasana/ — open on your phone and *Add to Home Screen* to install.

Built with Expo (React Native + React Native Web) — one codebase, mobile-first, targeting a native iOS app and web/PWA. The web build is deployed to GitHub Pages from the `gh-pages` branch. Native iOS (TestFlight via EAS) and a yoga review of the poses are still pending.

## Develop & deploy

```bash
npm run web        # local dev in the browser
npm run ios        # local dev in the iOS Simulator (needs Xcode)
npm run build:web  # export static web build to dist/ (for GitHub Pages)
```

## Docs

- [Requirements (lean)](docs/requirements.md)
- [Pose instructions & durations](docs/poses.md)

## Principles

- **Calm and low-friction** — any pose reachable in ≤ 2 taps.
- **Never forced** — the timer only runs if the user starts it.
- **Offline-first** — pose content is bundled; no account required.
- **No medical claims** — a wellness aid, not therapy or medical advice.

## License

© 2026 Anupma. Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) — share and adapt with attribution, non-commercially, under the same license. See [LICENSE](LICENSE).
