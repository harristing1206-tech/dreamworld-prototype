# Dreamworld Health & Fitness Design Reference Audit

## Source access

The supplied Mobbin Health & Fitness category URL was inspected directly on 2026-08-27. Its category search redirects unauthenticated visitors to Mobbin's login/marketing page. No login, credential guessing, paywall bypass, or automated account creation was attempted.

The redesign instead used publicly accessible Mobbin screen pages and preview images:

- Headspace — Timeline & History: https://mobbin.com/explore/screens/1cba404f-413c-4a8b-be36-d791e9ca4fed
- Nike Run Club — Dashboard: https://mobbin.com/explore/screens/1b907e0c-a490-4ba8-8f52-9c494d0b2e18
- Nike Run Club — Progress: https://mobbin.com/explore/screens/a46bfab3-9dc7-4318-9f98-d27fb663f3dd
- How We Feel — Sleep & Mood: https://mobbin.com/explore/screens/45dc4ddb-f9b2-49ff-a5c9-a5315f6cc5e7
- Calm — Browse & Discover: https://mobbin.com/explore/screens/f6cd0f44-dae8-4d6c-9fa4-721148f696f3
- Oura — Explore/Recents: https://mobbin.com/explore/screens/8a6c7d6c-4d37-47cb-9e75-d9bae00597f7

These sources were used as behavioral and visual references only. No screenshots, assets, proprietary branding, or distinctive compositions are shipped with Dreamworld.

## Transferable patterns

1. **Content-first hierarchy** — one clear title, restrained context text, and fewer simultaneous focal points.
2. **Native list density** — compact rows, thin dividers, strong primary text, quiet secondary metadata.
3. **Purposeful surfaces** — elevated cards only for grouped or glanceable information; operational rows remain flat.
4. **Quiet navigation** — icon color and a restrained selected state instead of large decorative capsules.
5. **Health data through type** — metrics use aligned labels and values rather than repeated illustrated icon tiles.
6. **Small semantic palette** — neutral canvas, one primary green, one warm capture accent, and red only for danger.
7. **Consistent geometry** — recurring 12–14px surface radii and 44px minimum controls.
8. **Morning-friendly contrast** — warm near-neutral light canvas and deep forest-neutral dark surfaces.
9. **Platform honesty** — installed iPhone uses the real safe area and status bar rather than a simulated fixed-time bar.

## Dreamworld diagnosis before refinement

Claude Design slop diagnostic: **4/10**.

Triggered tells:

- Repeated rounded icon tiles in Insights and Settings.
- Several unrelated large-title scales.
- Overly prominent selected-tab capsules competing with the center Log action.
- Flat ivory treatment across nearly every light-mode surface.

The product did not trigger tech-gradient, generic-purple, feature-grid, accent-rail, glassmorphism, or wrong-surface problems.

## Implemented refinement

- Normalized major screen titles to 30–32px and reduced eyebrow/context labels.
- Reduced regular selected-tab treatment to 42×38px at 62% opacity while retaining the established 58px Log action.
- Reworked light mode into warm-neutral canvas plus clear white grouped surfaces.
- Reworked dark mode into deep forest-neutral canvas, surface, and raised layers.
- Removed repeated Insight metric icon tiles and let labels/values carry hierarchy.
- Simplified Settings icons into unboxed 24px glyphs.
- Reduced Profile avatar and statistic scale.
- Tightened History and Alarm density without reducing touch targets.
- Standardized calendar and detail surfaces to 14px radii.
- Hid the simulated status bar on installed/coarse-pointer iPhones and used safe-area geometry.

## Post-refinement diagnostic

Claude Design slop diagnostic: **1/10**.

The remaining centered composition is intentional on the voice-capture state, where one immediate action should dominate. The rest of the product uses native list, configure, and monitor surfaces.