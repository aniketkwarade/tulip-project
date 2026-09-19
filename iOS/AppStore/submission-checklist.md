# App Store submission checklist

This is the release checklist for TULIP 1.0 (build 2). Repository checks are automated where possible; account, legal, and human-review decisions remain explicit.

## Repository and binary

- [x] iPhone bundle identifier is `com.tulipproject.ios`.
- [ ] Deployment target is iOS 17; rebuild and verify the project with Xcode 27 / iOS 27 SDK before submission. This machine currently has Xcode 26.6 / iOS 26.5.
- [x] Version is 1.0 and upload build number is 2.
- [x] App icon is a 1024 × 1024 opaque image.
- [x] Privacy manifest is included in the target and declares no tracking or collected data.
- [x] UserDefaults required-reason API use is declared with reason `CA92.1`.
- [x] Export-compliance declaration is present (`ITSAppUsesNonExemptEncryption = NO`). Confirm this remains legally accurate before submission.
- [x] Web Inspector is compiled into Debug only.
- [x] Core data, graph, fonts, and web code are bundled; the primary experience is not a remote website wrapper.
- [x] Design-system and motion consistency gates are part of App Store readiness.
- [ ] Produce and retain a fresh signed Xcode 27 Release archive for version 1.0 (2) at `iOS/Distribution/TULIP-1.0-2.xcarchive`.
- [ ] Pass Xcode 27's local App Store bundle validation, static analysis, privacy-manifest audit, and strict code-signature verification.
- [ ] Run Organizer validation on that exact archive without uploading.
- [ ] Test the processed build through TestFlight.

## App Store Connect — account holder or App Manager

- [ ] Accept current Apple Developer agreements and clear any compliance review.
- [ ] Create/verify the app record using the exact bundle ID and SKU.
- [ ] Confirm app name, subtitle, categories, countries/regions, price (free), copyright holder, content rights, and DSA trader status.
- [ ] Complete the current age-rating questionnaire; TULIP has no user-generated content, gambling, purchases, unrestricted web browsing, or social features.
- [ ] Paste the privacy answers from `app-privacy-answers.md` and publish them.
- [x] Publish and verify `https://tulip-project-six.vercel.app/privacy.html` and `https://tulip-project-six.vercel.app/support.html`; both return HTTP 200 from the production deployment for `main` commit `edccf276`.
- [ ] Review `accessibility-answers.md`, test the release build, and publish only verified Accessibility Nutrition Labels.
- [ ] Upload final 6.9-inch screenshots (one to ten, no alpha); replace the existing draft set after final visual QA.
- [ ] Paste localized name, subtitle, description, keywords, URLs, and review notes from `metadata-en-US.md`.
- [ ] Supply App Review contact information. No demo account is required.
- [ ] Select build 2, answer export-compliance questions consistently, add it for review, then submit the draft submission.

## Human release QA

- [ ] Cold launch shows the breathing TULIP mark immediately and reaches usable content without a blank frame.
- [ ] Airplane mode supports Explore, Search, Analyse, Activity Impacts, My Footprint, and menu content; external sources fail gracefully.
- [x] Simulator background/foreground, process-eviction relaunch, and **Simulate Memory Warning** preserve the active route and app responsiveness. Repeat under real memory pressure on final iOS 27 hardware.
- [ ] All tabs, long press, gestures, search, inspector, links, Share, and Contact work on a current physical iPhone.
- [ ] No content sits behind the dock; no black overscroll strip, clipped text, placeholder, dead control, or debug UI remains.
- [ ] VoiceOver order, Dynamic Type, Reduce Motion, Increase Contrast, and 44 pt controls pass the routes in `accessibility-answers.md`.
- [ ] Scientific-source links open in Safari and Contact opens Mail.

## Review risk to watch

The main review risk is App Review Guideline 4.2 (minimum functionality) because Explore uses a bundled web renderer. Review notes must emphasize the offline bundled graph engine plus native Search, Analyse, Activity Impacts, My Footprint, haptics, route restoration, Share sheet, and system link handling. Keep screenshots focused on those app-specific interactions.
