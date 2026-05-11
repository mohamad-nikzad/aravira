# Native Style Migration Plan

## Purpose

Move `apps/native` away from NativeWind and Tailwind-style class strings toward maintainable React Native styles, while keeping the PWA and native app visually consistent through shared design tokens.

The target is semantic parity, not pixel-level parity. Shared tokens and component contracts should mean the same thing across web and native, but each platform can keep platform-appropriate layout, interaction, safe-area, navigation, and sheet behavior.

## Decisions

- `@repo/brand-tokens` becomes the source of truth for design tokens.
- The web/PWA app stays in `apps/app`; `apps/native` is treated as iOS/Android only.
- Native dark mode matches the PWA behavior: explicit `light | dark`, default `light`, no system-theme switching for now.
- Native theme preference uses `@react-native-async-storage/async-storage`, not SecureStore.
- The native storage key is `aravira-theme`.
- Native code consumes tokens through an app-level adapter in `apps/native/theme/*`, not by importing generated token files directly in components.
- Native primitives are native-owned with shared contracts, not copies of the web Radix/shadcn APIs.
- Converted native primitives remove `className` immediately and keep `style` as the escape hatch.
- Native variants use typed style maps, not `class-variance-authority`.
- Component and screen styles use local `StyleSheet.create` factories, usually via `useThemeStyles(createStyles)`.
- Do not introduce broad `Box` or `Stack` primitives during this migration.
- Add an `AppText` primitive and migrate native text through it.
- Ban raw colors, radii, font family names, and semantic shadows after migration. Local layout numbers remain allowed.
- Calendar/status/staff visual accents become theme-aware.
- Generated token outputs are checked into the repo and guarded by a drift check.
- Verification is code-only: typecheck, lint, tests, and token drift checks. No screenshot regression harness for this migration.
- Dependency removal happens only at the final cleanup milestone.

## Staff And Calendar Color Decision

The current color model leaks implementation details like `bg-staff-1` to users. That should be replaced with user-friendly calendar color options.

Target model:

```ts
type CalendarColorId = "rose" | "violet" | "mint" | "gold" | "coral";
```

User-facing color choices must show a swatch plus a Persian label, never internal IDs:

```ts
{ id: 'rose', labelFa: 'رز' }
{ id: 'violet', labelFa: 'بنفش' }
{ id: 'mint', labelFa: 'نعنایی' }
{ id: 'gold', labelFa: 'طلایی' }
{ id: 'coral', labelFa: 'مرجانی' }
```

Storage stays as text for now. Do not change the database schema in this migration.

Responsibilities:

- `@repo/brand-tokens`: calendar color design metadata, swatches, labels, light/dark values.
- `@repo/salon-core`: validation and normalization helpers.
- Renderers: accept both new values like `rose` and legacy values like `bg-staff-1`.
- Create/update paths: normalize saved values to new `CalendarColorId` values.

This lets old rows continue to render while new or edited records gradually clean the data.

## Phase 1: Foundation Contract

Outcome: the design contract is explicit, documented, generated, and safe to consume before rewriting native components.

Tasks:

1. Keep this plan in `docs/native-style-migration.md` as the migration reference.
2. Refactor `@repo/brand-tokens` so it owns:
   - semantic light/dark colors
   - radius values
   - font tokens
   - appointment status palettes
   - calendar color options
3. Add `CalendarColorId` options with swatch and Persian label metadata.
4. Add normalization helpers in `@repo/salon-core`:

```ts
isCalendarColorId(value: string): value is CalendarColorId
normalizeCalendarColorId(value: string | null | undefined): CalendarColorId
resolveCalendarColor(value: string | null | undefined): CalendarColorId
```

5. Support legacy mappings:

```ts
bg-staff-1 -> rose
bg-staff-2 -> violet
bg-staff-3 -> mint
bg-staff-4 -> gold
bg-staff-5 -> coral
```

6. Update user-facing color pickers so they render swatch plus Persian label instead of `staff-1`, `staff-2`, etc.
7. Normalize color values on create/update paths for services and staff-like records, while keeping readers compatible with old values.
8. Add generated outputs from `@repo/brand-tokens`:
   - generated web CSS
   - generated native token/theme data
9. Import generated web CSS inside `@repo/ui/styles.css`, so `apps/app` keeps its existing style dependency shape.
10. Check generated outputs into the repo.
11. Add `tokens:generate` and `tokens:check` scripts.

Do not remove NativeWind or convert native primitives in this phase.

## Phase 2: Native Theme Adapter

Outcome: `apps/native` has a native theme runtime that can power converted components without direct token coupling.

Status: complete.

Created `apps/native/theme/*` with:

- `ThemeProvider`
- `useTheme`
- `useThemeStyles`
- `lightTheme`
- `darkTheme`
- `withAlpha`
- icon color roles
- status bar style mapping
- React Navigation theme mapping
- themed appointment status helpers
- themed calendar color helpers
- pressed, disabled, and loading state conventions

Theme behavior:

- values: `light | dark`
- default: `light`
- persistence: `@react-native-async-storage/async-storage`
- storage key: `aravira-theme`
- no automatic system-theme switching
- avoid a startup flash by loading the stored preference before hiding the splash screen where practical

## Phase 3: Native Primitive Migration

Outcome: the shared native UI primitives no longer depend on NativeWind class strings.

Status: complete.

Convert primitives first:

- `AppText`
- `Button`
- `Card`
- `Input`
- `Badge`
- `Skeleton`
- `Separator`
- `Screen`
- `Surface`

Primitive rules:

- no `className`
- `style` remains available as an escape hatch
- use theme values for colors, radius, fonts, and semantic shadows
- use typed variant maps instead of CVA
- own common interaction states like pressed, disabled, and loading
- `AppText` owns Vazirmatn family selection, typography variants, semantic colors, RTL defaults, and text alignment defaults
- icon colors come from theme roles by default, with explicit token-based overrides allowed

Avoid broad layout primitives like `Box` and `Stack`. Layout should stay local through `StyleSheet.create`.

## Phase 4: Shared Shells And Navigation

Outcome: app-level surfaces render from the native theme before feature screens are migrated.

Status: complete.

Migrate:

- root layout
- theme provider wiring
- status bar behavior
- auth gate
- screen shell
- bottom navigation
- common loading states
- common empty/error surfaces

This phase should establish dark-mode support across the app frame even if individual feature screens still contain legacy NativeWind usage.

## Phase 5: User Flow Migration

Outcome: feature screens move from NativeWind classes to local native styles in a low-risk order.

Status: complete.

Migration order:

1. Login and signup.
2. Settings, including native dark-mode toggle.
3. Today.
4. Clients.
5. Staff and services.
6. Calendar.

Calendar is last because it has the densest visual logic:

- staff/service calendar colors
- appointment status palettes
- month/week/day/agenda views
- filters
- create/edit modal surfaces
- appointment blocks

Calendar should use the theme adapter's status and calendar color helpers, not direct token imports or raw hex values.

## Phase 6: Guardrails

Outcome: the migrated architecture is protected from design drift.

Status: complete.

Added `apps/native/scripts/check-style-guardrails.mjs`, wired into `@repo/native` lint through:

```sh
pnpm --filter @repo/native style:check
```

The check is baseline-aware so it blocks new drift while existing Phase 7 cleanup debt remains visible in `apps/native/style-guardrails-baseline.json`. Refresh the baseline only when intentionally accepting or removing tracked debt:

```sh
pnpm --filter @repo/native style:check -- --update-baseline
```

Add checks that block or flag:

- new `className` usage in `apps/native`
- raw hex/rgb/hsl colors outside token/theme files
- direct `saloora.*` imports in native components
- direct generated token imports in native components
- hard-coded Vazirmatn family names outside theme/font loading
- ad hoc radius values outside tokens/theme
- new use of CVA for native style variants

Allowed:

- local layout numbers like `padding: 16`
- explicit style arrays
- token-based color overrides for identity marks, statuses, and calendar swatches

## Phase 7: Final Cleanup

Outcome: NativeWind and related dependencies are removed only after native usage is gone.

Status: complete.

Before removing dependencies, these searches should be clean or intentionally documented:

```sh
rg "className=|cn\\(|cva\\(" apps/native
rg "nativewind|react-native-css|tailwind" apps/native
```

Then remove native-only dependencies and files:

- `nativewind`
- `react-native-css`
- Tailwind/PostCSS dependencies from `apps/native`
- `clsx`
- `tailwind-merge`
- `class-variance-authority`

Removed native NativeWind wiring and cleanup files:

- `apps/native/global.css`
- `apps/native/postcss.config.mjs`
- `apps/native/nativewind-env.d.ts`
- `nativewind/metro` wrapping in `apps/native/metro.config.js`
- Tailwind-aware Prettier plugin configuration in `apps/native/prettier.config.js`

The remaining `tw()` helper in `apps/native/lib/utils.ts` is intentionally dependency-free compatibility debt tracked by the style guardrail baseline. It should be retired separately by converting the remaining older screen-local styles to `StyleSheet.create` factories.
- `apps/native/global.css`
- `apps/native/nativewind-env.d.ts`
- NativeWind Metro wiring

Keep unrelated web Tailwind dependencies intact.

## Verification

This migration uses code-only verification.

Run the relevant subset as phases land:

```sh
pnpm --filter @repo/brand-tokens typecheck
pnpm --filter @repo/salon-core test
pnpm --filter @repo/native typecheck
pnpm --filter @repo/native lint
pnpm tokens:check
```

If `tokens:check` lives under `@repo/brand-tokens`, use the package-scoped command instead:

```sh
pnpm --filter @repo/brand-tokens tokens:check
```

Runtime simulator smoke checks can be done when needed, but screenshot regression testing is out of scope for this migration.

## Rollback Strategy

Keep phases separable:

- Token generation can be rolled back without touching native screens.
- Native theme adapter can coexist with NativeWind while primitives are migrated.
- Converted primitives should be reviewed one at a time because they drop `className`.
- Feature screens can migrate flow by flow.
- Dependency removal is last, so earlier phases remain reversible.

## Non-Goals

- Do not change the database schema for color fields during this migration.
- Do not add Expo Web parity for `apps/native`.
- Do not force pixel-level parity between web and native.
- Do not introduce a Tailwind compatibility layer.
- Do not build a broad `Box` or `Stack` utility system.
- Do not remove NativeWind dependencies until the final cleanup phase.
