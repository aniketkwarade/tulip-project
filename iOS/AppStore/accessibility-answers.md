# Accessibility Nutrition Labels baseline

Publish only claims confirmed against the release archive on a physical iPhone. Apple requires the app's primary tasks to satisfy each feature's evaluation criteria; partial support should not be claimed.

## Ready to verify for publication

- **Dark Interface:** supported throughout the native shell and bundled Explore experience.
- **Reduced Motion:** native custom motion observes Reduce Motion; the bundled web experience also needs a final device check before publishing this label.
- **Differentiate Without Color Alone:** key tabs, relationship direction, urgency status, and Activity Impact states use text and/or icons in addition to color. Verify all graph-only states before publishing.
- **Voice Control:** native controls expose visible names or accessibility labels. Verify the canvas and custom gestures before publishing.
- **Larger Text:** native screens use Dynamic Type styles for reading content. Test every primary task at the largest accessibility size before publishing.
- **VoiceOver:** native navigation and controls have semantic labels. Do not publish this claim until Explore canvas traversal and complete reading order pass on-device testing.
- **Sufficient Contrast:** do not publish until an Accessibility Inspector audit and device review confirm secondary/tertiary text and translucent controls.

## Required manual test routes

1. Search for a topic and open Analyse.
2. Expand/collapse Analyse, inspect a relationship, and open a source.
3. Change Activity Impact category and Impact/Actions mode.
4. Complete, review, and restart My Footprint.
5. Open and dismiss Pick a System and the full menu.
6. Repeat with VoiceOver, Voice Control, Larger Text, Bold Text, Button Shapes, Increase Contrast, and Reduce Motion.

Record tested device, OS version, build number, and outcome before publishing the labels in App Store Connect.
