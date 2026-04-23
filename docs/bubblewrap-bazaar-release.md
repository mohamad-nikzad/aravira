# Bubblewrap Bazaar Release Plan

This repo already has the main PWA pieces Bubblewrap needs:

- production manifest at `https://aravira-saloon.vercel.app/manifest.json`
- production service worker
- install prompt and standalone display mode
- launcher icons and screenshots

This branch adds the missing production endpoint for Android Digital Asset Links:

- `apps/app/app/.well-known/assetlinks.json/route.ts`

That route serves `/.well-known/assetlinks.json` when the production environment has the Android package name and signing fingerprint configured.

## What Bubblewrap Does Here

Bubblewrap creates an Android Trusted Web Activity project that opens the hosted app in a full-screen Android shell.

For this project, the hosted app stays on Vercel:

- host: `https://aravira-saloon.vercel.app`
- manifest: `https://aravira-saloon.vercel.app/manifest.json`

Bubblewrap then generates:

- a signed `APK` for device testing
- a signed `AAB` for store submission workflows

## Repo Scripts

Use these scripts from the repo root:

```bash
pnpm android:bubblewrap:init
pnpm android:bubblewrap:update
pnpm android:bubblewrap:build
pnpm android:bubblewrap:assetlinks
```

What they do:

- `android:bubblewrap:init`: creates the Android wrapper in `android/twa`
- `android:bubblewrap:update`: regenerates the Android project from `android/twa/twa-manifest.json`
- `android:bubblewrap:build`: builds signed Android artifacts from `android/twa`
- `android:bubblewrap:assetlinks`: generates a local asset links file from the Bubblewrap project fingerprints

## Recommended Android Identity

Use a permanent package name such as:

`ir.aravira.saloon`

Do not change it later unless you want a different Android app identity.

## First-Time Setup

1. Install Bubblewrap dependencies the first time it prompts.
2. Run:

```bash
pnpm android:bubblewrap:init
```

3. During the prompts, use values along these lines:

- Manifest URL: `https://aravira-saloon.vercel.app/manifest.json`
- Domain / host: `https://aravira-saloon.vercel.app`
- Package ID: `ir.aravira.saloon`
- App name: `آراویرا`
- Launcher name: `آراویرا`
- Start URL: `/`
- Display mode: `standalone`
- Orientation: `portrait`

4. Choose a keystore location that is not casually shared and keep its passwords safe.

Bubblewrap will create `android/twa/twa-manifest.json` with the Android app configuration.

## Building

After initialization:

```bash
pnpm android:bubblewrap:build
```

Bubblewrap supports password env vars for non-interactive builds:

```bash
BUBBLEWRAP_KEYSTORE_PASSWORD=...
BUBBLEWRAP_KEY_PASSWORD=...
pnpm android:bubblewrap:build
```

If your shell supports inline env vars:

```bash
BUBBLEWRAP_KEYSTORE_PASSWORD=... BUBBLEWRAP_KEY_PASSWORD=... pnpm android:bubblewrap:build
```

## Asset Links And Verification

Trusted Web Activity verification depends on matching:

- Android package name
- signing certificate SHA-256 fingerprint
- website origin

After Bubblewrap init/build, collect the final package name and signing fingerprint.

You can also generate a local asset links file from the Bubblewrap project with:

```bash
pnpm android:bubblewrap:assetlinks
```

Then set these production environment variables on Vercel:

- `ANDROID_TWA_PACKAGE_NAME=ir.aravira.saloon`
- `ANDROID_TWA_SHA256_CERT_FINGERPRINTS=<bubblewrap SHA-256 fingerprint>`

Optional:

- `ANDROID_TWA_RELATION=delegate_permission/common.handle_all_urls`

After redeploying production, verify:

```bash
curl -i https://aravira-saloon.vercel.app/.well-known/assetlinks.json
```

Expected result:

- HTTP `200`
- JSON containing the exact Android package name
- JSON containing the exact signing fingerprint used by Bubblewrap

If this endpoint does not match the built Android app, Chrome will fall back to showing browser UI instead of trusted full-screen mode.

## Bazaar Flow

1. Initialize the Bubblewrap project.
2. Build the Android artifacts.
3. Configure the production env vars for `assetlinks.json`.
4. Redeploy Vercel.
5. Install the built APK on a real Android phone and verify:
   - launches full-screen
   - no browser address bar
   - login works
   - core salon flows work
6. Upload the package format Bazaar accepts in your publisher panel.

## Practical Notes

- `android/twa` is generated local project output, not hand-maintained source.
- Re-run `pnpm android:bubblewrap:update` after changing `twa-manifest.json`.
- Keep the keystore backed up. Losing it makes future app updates painful or impossible under the same app identity.
- The app currently uses the `vercel.app` production host. A custom domain is optional, but cleaner long-term for a production mobile app identity.
