# iOS 27 launch readiness — 2026-09-19

This record covers the first five launch gates selected for TULIP. It separates checks proven with the installed toolchain from the final checks that require Xcode 27.

## 1. Xcode 27 build and archive

**Blocked by local toolchain availability.** The only installed developer app is `/Applications/Xcode.app`, version 26.6 (build 17F113), with the iOS 26.5 SDK and simulator runtime. No iOS 27 SDK or runtime is present. The Mac is running macOS 26.3.1; the App Store lists Xcode 27 as requiring macOS 26.6 or later. `softwareupdate` offers macOS 26.7 and macOS 27, both of which require a restart.

The current source does build successfully with the installed toolchain. A fresh Release static analysis and signed validation archive succeeded at:

`iOS/Distribution/TULIP-1.0-2-xcode26-validation.xcarchive`

This validation archive is not the final App Store candidate. After Xcode 27 is installed, replace `iOS/Distribution/TULIP-1.0-2.xcarchive` with a new Xcode 27 archive and rerun every command below.

## 2. Launch and resilience checks

Verified on an iPhone 17 Pro simulator running iOS 26.5:

- Debug build, install, and launch succeeded.
- Cold process launch reached usable content and remained alive.
- Background and foreground transitions preserved the active My Footprint route.
- A process termination followed by relaunch restored the active My Footprint route and the locally stored footprint result.
- Explore, Search, Analyse, My Footprint, and Impacts remained usable with the app process configured to send HTTP, HTTPS, and SOCKS traffic to an unreachable loopback proxy. The primary experience is bundle-backed.
- Search was launched with `-TULIPDisableFoundationModels` to exercise the non-Apple-Intelligence path. “Why is the water near my home turning green and making people sick?” selected Harmful Algal Blooms; “Why are my allergies lasting longer every spring?” selected Air Pollution Health Burden.
- Simulator’s **Simulate Memory Warning** command was sent while the Analyse route was open. The app remained alive, retained the selected Global Temperature topic, and exposed the full interactive accessibility tree afterward.
- Runtime logs contained no app crash, fatal error, or fault. The simulator emitted its known duplicate WebKit accessibility-bundle warning; it did not terminate the app.

Still required with Xcode 27 and final hardware:

- Repeat cold launch and background/foreground checks on a physical iPhone running iOS 27.
- Repeat the offline test with system Airplane Mode rather than a process-level blackhole proxy.
- Repeat the process-eviction test under genuine device memory pressure.

## 3. Archive privacy audit

`iOS/scripts/audit-app-privacy.sh iOS/Distribution/TULIP-1.0-2-xcode26-validation.xcarchive` passed:

- `NSPrivacyTracking` is false.
- Collected data types and tracking domains are empty.
- The archive manifest is byte-for-byte identical to the source manifest.
- UserDefaults is declared with required-reason code `CA92.1`.
- No protected-resource usage-description keys are present.
- No native tracking, advertising, analytics, crash-reporting, or networking SDK references were found.
- No embedded third-party frameworks were present in the archive.

Xcode Organizer’s privacy report must still be generated from the final Xcode 27 archive, because the current report is a repository/archive audit rather than Apple’s final Organizer artifact.

## 4. App Privacy answer

The current source and validation archive continue to support the App Store Connect answer:

**Does this app or its third-party partners collect data from the app? No.**

This answer remains valid only while production retains the audited behavior: no analytics or crash SDK, no native contact endpoint, no advertising or tracking, and search/history/footprint information remaining on-device. The native Contact action hands off to the user’s email app.

## 5. Public policy and support URLs

**Complete.** The source pages are present at `public/privacy.html` and `public/support.html`. Pull request #15 merged as commit `edccf276d0a84994bb04e049b9726e8516438cd7`. Vercel deployment `dpl_5FxTmCSdRP8qaJ1AGfbe3o5atgei` is `READY`, reports that exact `githubCommitSha`, and owns the stable production alias. All three production checks return HTTP 200:

- `https://tulip-project-six.vercel.app/`
- `https://tulip-project-six.vercel.app/privacy.html`
- `https://tulip-project-six.vercel.app/support.html`
