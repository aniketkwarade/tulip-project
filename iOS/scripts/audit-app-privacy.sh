#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)"
APP_ROOT="$REPO_ROOT/iOS/TULIPiOS"
SOURCE_MANIFEST="$APP_ROOT/PrivacyInfo.xcprivacy"
ARCHIVE_PATH="${1:-}"

fail() {
  echo "App privacy audit failed: $*" >&2
  exit 1
}

plist_raw() {
  plutil -extract "$2" raw -o - "$1"
}

[ -f "$SOURCE_MANIFEST" ] || fail "source privacy manifest is missing"
plutil -lint "$SOURCE_MANIFEST" >/dev/null
[ "$(plist_raw "$SOURCE_MANIFEST" NSPrivacyTracking)" = "false" ] \
  || fail "source manifest enables tracking"
[ "$(plist_raw "$SOURCE_MANIFEST" NSPrivacyCollectedDataTypes)" = "0" ] \
  || fail "source manifest declares collected data"
[ "$(plist_raw "$SOURCE_MANIFEST" NSPrivacyTrackingDomains)" = "0" ] \
  || fail "source manifest declares tracking domains"

if rg -n \
  '(^|[^A-Za-z])(AppTrackingTransparency|AdSupport|ATTrackingManager|FirebaseAnalytics|GoogleMobileAds|Amplitude|Mixpanel|Sentry|Crashlytics)([^A-Za-z]|$)' \
  "$APP_ROOT" --glob '*.swift' --glob '*.m' --glob '*.mm' --glob '*.h' >/dev/null; then
  fail "tracking, advertising, analytics, or crash-reporting API reference found"
fi

if rg -n \
  '(^|[^A-Za-z])(URLSession|NWConnection|NWPathMonitor|Alamofire)([^A-Za-z]|$)' \
  "$APP_ROOT" --glob '*.swift' --glob '*.m' --glob '*.mm' --glob '*.h' >/dev/null; then
  fail "native networking API reference found; reassess App Privacy answers"
fi

usage_keys="$(plutil -p "$APP_ROOT/Info.plist" | rg 'NS[A-Za-z]+UsageDescription' || true)"
[ -z "$usage_keys" ] || fail "protected-resource usage descriptions exist; reassess permission behavior"

if [ -n "$ARCHIVE_PATH" ]; then
  [ -d "$ARCHIVE_PATH" ] || fail "archive does not exist: $ARCHIVE_PATH"
  ARCHIVE_APP="$ARCHIVE_PATH/Products/Applications/TULIP.app"
  ARCHIVE_MANIFEST="$ARCHIVE_APP/PrivacyInfo.xcprivacy"
  [ -f "$ARCHIVE_MANIFEST" ] || fail "archive privacy manifest is missing"
  plutil -lint "$ARCHIVE_MANIFEST" >/dev/null
  cmp -s "$SOURCE_MANIFEST" "$ARCHIVE_MANIFEST" \
    || fail "archive privacy manifest differs from source"

  framework_count="$(find "$ARCHIVE_APP" -type d -name '*.framework' | wc -l | tr -d ' ')"
  [ "$framework_count" = "0" ] \
    || fail "archive contains $framework_count embedded framework(s); audit each dependency manifest"
fi

echo "App privacy audit passed."
echo "Tracking: no"
echo "Collected data types: none"
echo "Tracking domains: none"
echo "Protected-resource permission prompts: none"
echo "Native analytics, advertising, crash-reporting, and networking SDK references: none"
if [ -n "$ARCHIVE_PATH" ]; then
  echo "Archive manifest matches source: $ARCHIVE_PATH"
else
  echo "Run again with a final .xcarchive path to verify the archived manifest and embedded frameworks."
fi
