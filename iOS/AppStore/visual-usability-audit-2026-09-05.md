# TULIP iPhone visual and usability audit — 2026-09-05

Evidence: current Simulator captures in `artifacts/design-audit/app-store-system-2026-09-05/`, code review of the SwiftUI shell and native screens, and the supplied My Footprint reference.

## Summary

The visual direction is distinctive and the main navigation model is strong, but the implementation previously depended on many local spacing and animation values. That created subtle rhythm drift and made interaction speed difficult to govern. The current pass establishes one native token and component layer, migrates shared paths onto it, and makes native destinations independent of the bundled Explore engine during startup.

## Severity findings

### Blocker

- Cold launch gated every destination on both native data and the bundled web graph. This made even native screens remain behind the breathing mark while Explore initialized. The app shell now gates native destinations only on native data and continues preloading Explore in parallel.
- The submitted privacy-policy and support URLs are not live yet. Both documents exist in `public/`, but the current production deployment returns 404. App Store Connect metadata must not be submitted until the next authorized web release makes those URLs public.

### High

- Animation durations and springs were distributed across the dock, inspector, Activity Impacts, and My Footprint. They now route through `TULIPMotion`, including Reduce Motion behavior.
- Spacing, touch targets, and dock clearance had no single source of truth. `TULIPSpacing` and `TULIPLayout` now define these values and the readiness gate prevents new ad-hoc motion.
- App Store submission facts existed in several notes but not one actionable owner checklist. `submission-checklist.md` now separates automated, account-holder, and physical-device tasks.

### Medium

- SF Symbol selection was local to individual views, which had already caused category-icon drift. Shared semantic symbols now live in `TULIPIconography`; the five branded dock assets remain unchanged.
- Accessibility support was described generally but not mapped to Apple's product-page labels. The new accessibility checklist avoids overclaiming unverified support.
- The 6.9-inch screenshot set is structurally valid but must be regenerated after final UI approval so Store imagery matches the submitted binary.

### Low

- Several fixed-size brand and visualization labels remain appropriate exceptions to Dynamic Type. Continue checking fitted text at the smallest supported iPhone width.
- Reading cards remain opaque while Liquid Glass is limited to navigation and controls, preserving the requested evidence-first visual hierarchy.

## Follow-up validation

Run `iOS/scripts/check-app-store-readiness.sh`, a Release archive, Simulator screenshot comparison, and physical-device accessibility/gesture QA for every candidate uploaded to App Store Connect.

This pass produced a signed version 1.0 (2) archive, passed Xcode static analysis and local App Store bundle validation, and verified a fresh install on an iPhone 17 Pro Max simulator. At 0.2 seconds the launch screen already shows the TULIP mark on black; at 1.0 seconds the native Search screen is usable.
