# TULIP App Store readiness

This directory contains the submission facts and reviewer copy for the native iPhone build. It does not replace App Store Connect or legal review.

## Repository-side readiness

- Bundle ID: `com.tulipproject.ios`
- Version: `1.0`
- Build: `2`
- iPhone only, portrait, iOS 17 or later
- App icon: opaque 1024 x 1024 universal iOS icon
- Privacy manifest: `TULIPiOS/PrivacyInfo.xcprivacy`
- Privacy policy: `https://tulip-project-six.vercel.app/privacy.html`
- Support URL: `https://tulip-project-six.vercel.app/support.html`
- No login, purchases, subscriptions, ads, or tracking
- Native Contact opens the system email app; the native app does not transmit personal information itself
- Search history, Analyse history, and footprint progress are on-device app functionality
- Scientific links open in the system browser; arbitrary remote pages do not load inside the app
- Confirmed controls use native iOS haptic feedback
- Explore exposes the native iOS share sheet without changing the website experience
- The last active tab is restored through native `UserDefaults`
- Web Inspector is compiled into Debug builds only
- Draft English (U.S.) screenshots are in `Screenshots/en-US/`
  - `6.9-inch/`: primary 1320 x 2868 JPEG set, no alpha channel
  - `6.3-inch/`: optional 1206 x 2622 JPEG set, no alpha channel

## Device verification

- Release archive installed successfully on an iPhone 16 Pro running iOS 26.5.2
- Previously verified device archive: `com.tulipproject.ios`, version `1.0`, build `1`
- Current upload candidate: version `1.0`, build `2` (requires a new Xcode 27 archive and device verification)
- Cold launch succeeded and the TULIP process remained alive after launch
- Still requires human observation on the device: haptic feel, system share sheet contents, Mail handoff, VoiceOver reading order, and gesture comfort

## App Store Connect work that still requires the account holder

1. Confirm the agreements, tax, banking, and paid/free app status.
2. Create or verify the app record with the exact bundle ID above.
3. Confirm the app name, subtitle, category, age rating, content rights, countries, DSA trader status, and copyright holder.
4. Publish the App Privacy answers from `app-privacy-answers.md`.
5. Add the privacy-policy and support URLs above after those pages are deployed.
6. Review the supplied Simulator screenshots, replace any frame that should use curated graph state, and upload the 6.9-inch set. App Store Connect accepts the supplied 1320 x 2868 JPEG dimensions.
7. Provide reviewer contact information and paste the notes from `metadata-en-US.md`.
8. Upload a Release archive built with Xcode 27 / iOS 27 SDK or later.
9. Test the processed build in TestFlight on at least one current iPhone before review.

## Guideline 4.2 review position

TULIP is not a remote website presented in a browser frame. The graph engine, datasets, fonts, and interaction code ship inside the app bundle and remain usable without loading a website. The app provides a purpose-built touch sphere, causal relationship exploration, node inspectors, Activity Impact comparisons, an interactive four-factor footprint estimator, native haptic feedback, native route restoration, a system share sheet, and system handling for external sources. Review notes should explicitly describe these app-specific interaction paths.

## Before submission

Run the repeatable repository gate:

```sh
iOS/scripts/check-app-store-readiness.sh
```

The gate includes `iOS/scripts/check-design-system.sh`. Use
`AppStore/submission-checklist.md` for the account-holder, legal, TestFlight,
and physical-device steps that cannot be certified from source alone.

- Replace any draft legal wording after owner review.
- Confirm Contact opens the system email composer or Mail app from the archived build.
- Confirm every external scientific source link opens in Safari.
- Verify VoiceOver labels and Dynamic Type expectations on a real iPhone.
- Test cold launch, background/foreground restoration, low-memory relaunch, airplane mode, and poor connectivity.
- Confirm no placeholder text, clipped content, dead controls, or debug UI remains.
- Archive with a new monotonically increasing build number for each upload.
