# Plan: React Native (Expo) Sibling App for Saloora

## Context

Saloora today is a Next.js 16 PWA at `apps/app` (Persian-first, RTL, Vazirmatn font, OKLch token system, ~61 Radix-based primitives in `packages/ui`). The user wants to build a parallel **React Native (Expo) app** that mirrors the web UI as closely as possible so Saloora can ship to the App Store / Play Store while keeping the PWA. Brand identity, color palette, typography, and primitive component shapes should match across platforms.

The user asked for a **phased plan**, with **Phase 1 = a working RTL-only Expo app with all foundational assets in place** (font, logos, color tokens, core UI primitives) — no business logic yet. Phases beyond 1 are sketched here but executed later.

The skills that drive the technical choices:
- `expo/skills@building-native-ui` — Expo Router (kebab-case files, `_layout.tsx`), `expo-image`, `react-native-safe-area-context`, flexbox + inline styles, no Radix/HTML elements.
- `expo/skills@expo-tailwind-setup` — NativeWind v5 + Tailwind v4, no babel config, `@theme` blocks instead of `tailwind.config.js`, metro config via `withNativewind`.
- `vercel-labs/agent-skills@vercel-react-native-skills` — performance/optimization rules across 8 categories (list perf, animation, navigation, UI patterns, state, rendering, monorepo, config). Apply selectively as features grow:
  - **Phase 1 immediate hits:** `expo-image` for the logo (vs `Image`); `Pressable` (not `TouchableOpacity`) for the Button primitive; `react-native-safe-area-context` in `_layout.tsx`; monorepo rule — keep RN-only deps in `apps/native/package.json`, not at root.
  - **Phase 2+ (as scope grows):** FlashList for client/appointment lists; Reanimated for transitions; native stack/tab navigators (Expo Router already uses these); `Gesture.Tap` over `Pressable` for animated targets; React Compiler-friendly destructuring.

## Architecture (target)

```
apps/
  app/                  # existing Next.js PWA (UNTOUCHED)
  web/                  # existing landing (UNTOUCHED)
  native/               # NEW — Expo Router app (Phase 1)
packages/
  ui/                   # existing — Radix + Tailwind v4 (web)
  native-ui/            # NEW — NativeWind v5 primitives (Phase 1)
  brand-tokens/         # NEW — shared color/radius/font tokens (Phase 1)
  salon-core/           # existing — domain logic (jalali, persian-digits, availability) — RN-safe
  auth/                 # existing — JWT (jose, bcryptjs) — server-only, RN consumes via API
  data-client/          # existing — Dexie/IndexedDB — RN-incompatible, replace later
  database/             # existing — server-only
```

Phase 1 uses only `@repo/brand-tokens` and `@repo/native-ui` from the workspace; later phases pull in `@repo/salon-core` (RN-safe) and a new sync layer to replace Dexie.

---

## Phase 1 — Foundation: Working RTL Expo Shell with Brand System

**Outcome:** `pnpm dev:native` boots an Expo Router app (iOS + Android + web preview) that renders a single brand-showcase screen in Persian RTL using Vazirmatn, the Saloora color palette, and 8 NativeWind primitives that visually match the web counterparts.

### 1.1 Create `packages/brand-tokens`

Single source of truth consumed by both `packages/ui/styles/globals.css` (existing web) and `apps/native/global.css` (new).

Files:
- `packages/brand-tokens/package.json` — `"name": "@repo/brand-tokens"`, exports `./colors`, `./radius`, `./fonts`, `./index`. Side-effect-free TS.
- `packages/brand-tokens/src/colors.ts` — Saloora palette as both **OKLch strings** (for web `@theme inline`) and **hex equivalents** (for NativeWind / RN, which doesn't yet handle OKLch consistently across runtimes). Light + dark semantic maps.
- `packages/brand-tokens/src/radius.ts` — `{ base: '0.75rem', sm, md, lg, xl }` plus pixel equivalents (12, 8, 10, 12, 16) for RN.
- `packages/brand-tokens/src/fonts.ts` — `{ sans: 'Vazirmatn', mono: 'ui-monospace' }` and weight constants.
- `packages/brand-tokens/src/staff-colors.ts` — 5 staff color codes.
- `packages/brand-tokens/src/index.ts` — barrel.
- `packages/brand-tokens/tsconfig.json` — extends `@repo/typescript-config/base.json`.

Source values come from `packages/ui/styles/globals.css:9-95`. Convert OKLch → hex once (Saloora plum `oklch(0.414 0.072 359.8)` ≈ `#6B3A4A` per `apps/app/app/manifest.ts:16`); keep OKLch as `string` for web reuse and hex as `string` for native.

**Wire into web (non-breaking):** rewrite `packages/ui/styles/globals.css:11-16` to read CSS custom properties whose values are emitted from `@repo/brand-tokens` via a small generated `tokens.css` (or simply re-export the same hex/oklch literals from TS and keep CSS hand-written for now). For Phase 1 we **won't refactor web**; we just ensure the TS module's values match the CSS exactly so future drift is caught by a snapshot test.

### 1.2 Scaffold `apps/native`

Use Expo template with TypeScript + Expo Router:

```
apps/native/
  app.json              # expo: name "Saloora", slug "saloora", scheme "saloora",
                        # locales: { fa: ./locales/fa.json },
                        # ios.supportsTablet false (phone-first like the PWA),
                        # ios.userInterfaceStyle "automatic",
                        # android.userInterfaceStyle "automatic",
                        # extra.router.origin false,
                        # plugins: [expo-router, expo-font]
  package.json          # "@repo/native" (private), depends on
                        # @repo/brand-tokens, @repo/native-ui (workspace:*)
  metro.config.js       # withNativewind(getDefaultConfig(__dirname),
                        # { inlineVariables: false, globalClassNamePolyfill: false })
                        # + monorepo setup: watchFolders to repo root,
                        #   nodeModulesPaths to apps/native/node_modules + repo root
  postcss.config.mjs    # { plugins: { '@tailwindcss/postcss': {} } }
  babel.config.js       # presets: ['babel-preset-expo'] only (NativeWind v5 needs no babel)
  tsconfig.json         # extends @repo/typescript-config/base.json
  global.css            # @import 'tailwindcss/theme.css' layer(theme);
                        # @import 'tailwindcss/preflight.css' layer(base);
                        # @import 'tailwindcss/utilities.css';
                        # @theme { --color-primary: #6B3A4A; ... } pulled from @repo/brand-tokens
  app/
    _layout.tsx         # Stack root; loads fonts via useFonts; forces RTL via I18nManager
    index.tsx           # Brand showcase screen (Phase 1 demo)
    +not-found.tsx
  assets/
    fonts/              # Vazirmatn-{Regular,Medium,SemiBold,Bold,ExtraBold}.ttf
    images/
      saloora-logo-clean.png   # copied from apps/app/public/brand/
      saloora-mark-clean.png   # copied from apps/app/public/brand/
      icon.png                 # 1024x1024 — copied from apps/app/public/icon-base.png
      adaptive-icon.png        # for Android (foreground; bg comes from app.json)
      splash-icon.png          # for splash screen
      favicon.png              # for web preview
```

Resolution `lightningcss: 1.30.1` added to **root** `package.json` (per skill).

### 1.3 Vazirmatn font

Two options; pick the second to avoid a runtime download dependency:

**Chosen:** Bundle `.ttf` files locally under `apps/native/assets/fonts/` (download once from Google Fonts repo). Load via `expo-font`'s `useFonts` in `app/_layout.tsx`:

```tsx
const [loaded] = useFonts({
  'Vazirmatn-Regular': require('../assets/fonts/Vazirmatn-Regular.ttf'),
  'Vazirmatn-Medium': require('../assets/fonts/Vazirmatn-Medium.ttf'),
  'Vazirmatn-SemiBold': require('../assets/fonts/Vazirmatn-SemiBold.ttf'),
  'Vazirmatn-Bold': require('../assets/fonts/Vazirmatn-Bold.ttf'),
  'Vazirmatn-ExtraBold': require('../assets/fonts/Vazirmatn-ExtraBold.ttf'),
})
if (!loaded) return null
```

NativeWind `@theme` maps `--font-sans` to `'Vazirmatn-Regular'`. Weighted utilities (`font-medium`, `font-semibold`, `font-bold`) map to the matching weighted family name via `@theme` overrides — RN doesn't read CSS `font-weight`, so the `font-{weight}` Tailwind utilities must resolve to a `fontFamily` token at the NativeWind layer.

### 1.4 RTL configuration

In `app/_layout.tsx` before the first render:

```tsx
import { I18nManager } from 'react-native'
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true)
  I18nManager.forceRTL(true)
}
```

Notes:
- `forceRTL` only takes effect after a reload on first install; Expo Go shows a one-time prompt.
- Dev menu toggle exists; document this in a `apps/native/README.md`.
- Set `expo.locales` in `app.json` so iOS picks `fa` for system-localized items (back button, etc.).

### 1.5 Brand assets pipeline

For Phase 1, **copy** these files from `apps/app/public/` into `apps/native/assets/images/`:
- `brand/saloora-logo-clean.png`
- `brand/saloora-mark-clean.png`
- `icon-base.png` → `assets/images/icon.png`
- `apple-touch-icon.png` → reference for `adaptive-icon.png` (may need padding)

Reference them in `app.json`:
```json
"icon": "./assets/images/icon.png",
"splash": { "image": "./assets/images/splash-icon.png", "backgroundColor": "#f8eff0" },
"ios": { "icon": "./assets/images/icon.png" },
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/adaptive-icon.png",
    "backgroundColor": "#f8eff0"
  }
}
```

Background `#f8eff0` matches the Saloora "mist" used in the web manifest (`apps/app/app/manifest.ts:15`). `theme_color: '#6B3A4A'` is reused as iOS status bar tint.

Defer building a generation script (`scripts/generate-saloora-native-icons.mjs`) to Phase 2; for Phase 1 the existing PNG sizes are sufficient for Expo Go testing.

### 1.6 `packages/native-ui` — Core 8 primitives

Each primitive is the React Native counterpart of the same-named file under `packages/ui/src/`. We **do not** depend on Radix; we re-implement using RN built-ins + NativeWind className. Variant logic stays identical (CVA + `cn()`) so callers feel identical.

Files:
- `packages/native-ui/package.json` — exports `./*` (per-component imports like web).
- `packages/native-ui/src/utils.ts` — copy `cn()` from `packages/ui/src/utils.ts:1-7` verbatim.
- `packages/native-ui/src/button.tsx` — `Pressable` + `Text` (icon support via children — Vercel RN skill: prefer `Pressable` over `TouchableOpacity`). Mirror variants/sizes from `packages/ui/src/button.tsx:7-37`. Translate web-only classes (`focus-visible:ring-*`, `[&_svg]:size-4`) to RN-meaningful equivalents (drop focus ring; use opacity on `pressed`).
- `packages/native-ui/src/card.tsx` — `View` mirroring `packages/ui/src/card.tsx:5-82` (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction).
- `packages/native-ui/src/input.tsx` — `TextInput` styled like `packages/ui/src/input.tsx:5-19`. Add `textAlign: 'right'` default for RTL.
- `packages/native-ui/src/label.tsx` — `Text` with `font-medium text-sm`.
- `packages/native-ui/src/badge.tsx` — `View` + `Text` with CVA variants matching the web Badge.
- `packages/native-ui/src/separator.tsx` — `View` with `h-px bg-border` (or `w-px` for vertical).
- `packages/native-ui/src/skeleton.tsx` — animated `View` (`Animated` API, opacity pulse) with `bg-muted rounded-md`.
- `packages/native-ui/src/spinner.tsx` — wrap `ActivityIndicator`, accept className for color via `tintColor`.

NativeWind v5 detail per skill: components must be wrapped with `useCssElement` (or use NativeWind's exported `View`/`Text`/`Pressable` from `nativewind`) to honor `className`. Use the `nativewind` exports — short, consistent, no per-component boilerplate. Document this in `packages/native-ui/README.md`.

### 1.7 Brand showcase screen (`apps/native/app/index.tsx`)

ScrollView (`contentInsetAdjustmentBehavior="automatic"`) containing:
1. Saloora logo (`expo-image` per both Expo and Vercel RN skills, source = bundled `saloora-logo-clean.png`, height 64).
2. H1: «سالورا» — `text-4xl font-bold text-primary` (verifies Vazirmatn + RTL).
3. Body text: «سامانه مدیریت هوشمند نوبت‌دهی سالورا» — `text-base text-muted-foreground`.
4. Color swatches grid: 6 cards (plum, rose, blush, mist, paper, sage) — each a `<View className="h-20 rounded-lg bg-saloora-plum" />` with hex label below.
5. Button variants row: default, outline, ghost, destructive.
6. Card sample with Persian title + description.
7. Input with placeholder «نام مشتری».
8. Badge row + Separator + Skeleton placeholder + Spinner.

This screen verifies fonts render, RTL flows right-to-left, all 8 primitives style correctly, and the palette matches the web.

### 1.8 Workspace wiring

- `pnpm-workspace.yaml` — already covers `apps/*` and `packages/*`, no change.
- Root `package.json` — add `"dev:native": "pnpm --filter @repo/native dev"`. Update `dev` script's turbo filter list to include `@repo/native` if running RN should boot in parallel; otherwise leave the existing `dev` (web only) alone and let `dev:native` be opt-in.
- `turbo.json` — add a `dev` task config for `@repo/native` if not inferred. Add `build` task for typecheck only (no production native build in Phase 1).
- Add `lightningcss: 1.30.1` to root `package.json` `resolutions`.

### 1.9 Critical files to be modified or created

**New:**
- `packages/brand-tokens/**` (~7 files)
- `packages/native-ui/**` (~10 files including 8 primitives + utils + index + package.json)
- `apps/native/**` (~15 files: app.json, metro.config.js, postcss.config.mjs, babel.config.js, tsconfig.json, global.css, package.json, app/_layout.tsx, app/index.tsx, app/+not-found.tsx, README.md, assets/)

**Modified:**
- root `package.json` — add `dev:native` script, add `lightningcss` resolution.
- `pnpm-lock.yaml` (auto-regenerated by `pnpm install`).

**Untouched in Phase 1:** `apps/app/**`, `apps/web/**`, `packages/ui/**` (web), `packages/auth/**`, `packages/data-client/**`, `packages/database/**`, `packages/salon-core/**`.

### 1.10 Verification (end-to-end)

1. `pnpm install` from repo root completes cleanly.
2. `pnpm --filter @repo/native typecheck` passes.
3. `pnpm dev:native` (== `expo start` inside `apps/native`) prints QR code.
4. Open Expo Go on iOS device → app loads → splash uses mist background → showcase screen renders.
5. Visual checks on the showcase screen:
   - Vazirmatn glyphs render correctly for «سالورا» (no fallback rectangles).
   - Layout flows right-to-left: logo on right, scroll origin on right.
   - Plum swatch matches web `--saloora-plum` (eyeball against `apps/app` open in browser side-by-side).
   - Button "default" renders plum bg + white text; outline shows border; pressed state dims.
   - Input cursor and placeholder align right.
6. `expo start --android` → emulator → same checks.
7. `expo start --web` → web preview boots (sanity check that NativeWind compiles to web CSS as a bonus).
8. `pnpm --filter @repo/web dev` and `pnpm --filter @repo/app dev` still work unchanged (regression check).

If any check fails, fix root cause before declaring Phase 1 done. Don't paper over font fallbacks or color drift — those are the whole point of Phase 1.

---

## Phase 2+ (sketch — execute later)

- **Phase 2 — Navigation shell:** Expo Router tab layout matching the PWA's bottom nav (today, calendar, clients, staff, settings). Auth gate stub. Persian copy via inline strings (matches web pattern).
- **Phase 3 — Auth + API client:** Reuse `@repo/salon-core` (RN-safe). New `@repo/api-client` package wrapping `fetch` to Next.js `/api/*` routes from `apps/app`. JWT storage via `expo-secure-store`. Login/signup screens.
- **Phase 4 — Domain screens (read-only):** Today, Clients list, Staff list, Services. Mirror the web information density. `expo-image` for client avatars. Jalali date display via existing `@repo/salon-core/jalali-display`.
- **Phase 5 — Calendar:** Replace FullCalendar with `react-native-calendars` (or custom RN agenda) + the existing Jalali date helpers.
- **Phase 6 — Offline & sync:** Replace `@repo/data-client` (Dexie) with an Expo-SQLite or MMKV-backed equivalent; share the queue/projection abstractions with web behind a new `@repo/storage` interface.
- **Phase 7 — Push notifications:** Expo Notifications, server-side bridge to existing `/api/push` infrastructure.
- **Phase 8 — Production builds:** EAS Build profiles, App Store / Play Store metadata, screenshot generation matching the existing PWA screenshots.

---

## Reused existing utilities (do not duplicate)

- `cn()` — copy verbatim from `packages/ui/src/utils.ts:1-7` into `packages/native-ui/src/utils.ts`. Same `clsx + tailwind-merge` combo.
- CVA variant pattern from `packages/ui/src/button.tsx:7-37` — reuse the variant string maps as a starting point; strip web-only utilities.
- Color values from `packages/ui/styles/globals.css:11-95` — single source migrated into `@repo/brand-tokens`.
- Brand assets from `apps/app/public/brand/` and `apps/app/public/icon-base.png`.
- Manifest theme/background colors from `apps/app/app/manifest.ts:15-16`.

## Out of scope for Phase 1

- Auth wiring, API calls, real screens beyond the showcase.
- Replacing Dexie / data sync.
- Replacing FullCalendar.
- Generating a full RN icon set via script (use existing PNGs).
- Refactoring `packages/ui` to consume `@repo/brand-tokens` (token sync is value-equality only).
- i18n library — Persian strings stay inline, matching the web app.
- Push notifications, deep links, EAS Build.
