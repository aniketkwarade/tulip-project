#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
IOS_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
APP_ROOT="$IOS_ROOT/TULIPiOS"
DESIGN_SYSTEM="$APP_ROOT/TULIPDesignSystem.swift"

fail() {
  echo "TULIP design-system check failed: $*" >&2
  exit 1
}

for symbol in TULIPPalette TULIPSpacing TULIPRadius TULIPLayout TULIPTypography TULIPMotion TULIPIconography TULIPHaptics TULIPMaterialRole; do
  rg -q "enum $symbol" "$DESIGN_SYSTEM" || fail "$symbol is missing"
done

raw_motion="$(rg -n '\.(easeIn|easeOut|easeInOut|linear|smooth|snappy|spring|interactiveSpring)\([^)]*(duration|response):' "$APP_ROOT" --glob '*.swift' --glob '!TULIPDesignSystem.swift' || true)"
[ -z "$raw_motion" ] || {
  printf '%s\n' "$raw_motion" >&2
  fail "hard-coded SwiftUI motion found outside TULIPDesignSystem.swift"
}

rg -q 'TULIPLayout.minimumTouchTarget' "$APP_ROOT/TULIPApp.swift" || fail "app shell does not use the shared touch target"
rg -q 'TULIPMotion.animation' "$APP_ROOT/TULIPNativeScreens.swift" || fail "native screens do not use shared motion"
rg -q 'accessibilityReduceMotion' "$APP_ROOT/TULIPApp.swift" || fail "app shell does not honor Reduce Motion"
rg -q 'accessibilityReduceMotion' "$APP_ROOT/TULIPNativeScreens.swift" || fail "native screens do not honor Reduce Motion"

raw_haptics="$(rg -n 'UI(Selection|Impact|Notification)FeedbackGenerator' "$APP_ROOT" --glob '*.swift' --glob '!TULIPDesignSystem.swift' || true)"
[ -z "$raw_haptics" ] || {
  printf '%s\n' "$raw_haptics" >&2
  fail "direct haptic generators found outside TULIPDesignSystem.swift"
}

raw_glass="$(rg -n '\.glassEffect\(|GlassEffectContainer|\.background\(\.ultraThinMaterial' "$APP_ROOT" --glob '*.swift' --glob '!TULIPDesignSystem.swift' || true)"
[ -z "$raw_glass" ] || {
  printf '%s\n' "$raw_glass" >&2
  fail "direct Liquid Glass or material usage found outside TULIPDesignSystem.swift"
}

legacy_glass="$(rg -n '\.tulipGlass\(' "$APP_ROOT" --glob '*.swift' || true)"
[ -z "$legacy_glass" ] || {
  printf '%s\n' "$legacy_glass" >&2
  fail "legacy unscoped tulipGlass usage found"
}

rg -q 'TULIPGlassGroup' "$DESIGN_SYSTEM" || fail "shared Liquid Glass container is missing"
rg -q 'accessibilityReduceTransparency' "$DESIGN_SYSTEM" || fail "glass surfaces do not honor Reduce Transparency"

raw_spacing="$(rg -n '(VStack|HStack|LazyVStack|LazyHStack)\([^\n]*spacing:[[:space:]]*[0-9]|\.padding\([^\n]*,[[:space:]]*[0-9]|\.padding\([0-9]' "$APP_ROOT" --glob '*.swift' --glob '!TULIPDesignSystem.swift' || true)"
[ -z "$raw_spacing" ] || {
  printf '%s\n' "$raw_spacing" >&2
  fail "hard-coded SwiftUI spacing found outside TULIPDesignSystem.swift"
}

rg -q 'TULIPLayout.sectionSpacing' "$APP_ROOT/TULIPNativeScreens.swift" || fail "native sections do not use the shared spacing hierarchy"
rg -q 'TULIPLayout.screenHorizontalPadding' "$APP_ROOT/TULIPNativeScreens.swift" || fail "native screens do not use the shared page gutter"
rg -q 'TULIPLayout.dockContentClearance' "$APP_ROOT/TULIPNativeScreens.swift" || fail "native screens do not reserve shared dock clearance"

echo "TULIP native design-system checks passed."
