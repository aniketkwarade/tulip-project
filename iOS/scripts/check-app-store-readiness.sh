#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)"
IOS_ROOT="$REPO_ROOT/iOS"
APP_ROOT="$IOS_ROOT/TULIPiOS"
INFO_PLIST="$APP_ROOT/Info.plist"
PRIVACY_MANIFEST="$APP_ROOT/PrivacyInfo.xcprivacy"
PROJECT_FILE="$IOS_ROOT/TULIPiOS.xcodeproj/project.pbxproj"
EXPORT_OPTIONS="$IOS_ROOT/ExportOptions-TestFlight.plist"
APP_ICON="$APP_ROOT/Assets.xcassets/AppIcon.appiconset/AppIcon.png"
SCREENSHOT_ROOT="$IOS_ROOT/AppStore/Screenshots/en-US/6.9-inch"

fail() {
  echo "App Store readiness check failed: $*" >&2
  exit 1
}

expect_plist_value() {
  plist_path="$1"
  key_path="$2"
  expected_value="$3"
  actual_value="$(plutil -extract "$key_path" raw -o - "$plist_path")"
  [ "$actual_value" = "$expected_value" ] || fail "$key_path in $plist_path is '$actual_value', expected '$expected_value'"
}

plutil -lint "$INFO_PLIST" "$PRIVACY_MANIFEST" "$EXPORT_OPTIONS" >/dev/null
expect_plist_value "$INFO_PLIST" "CFBundleShortVersionString" '$(MARKETING_VERSION)'
expect_plist_value "$INFO_PLIST" "CFBundleVersion" '$(CURRENT_PROJECT_VERSION)'
expect_plist_value "$INFO_PLIST" "ITSAppUsesNonExemptEncryption" "false"
expect_plist_value "$INFO_PLIST" "LSApplicationCategoryType" "public.app-category.education"
expect_plist_value "$INFO_PLIST" "UILaunchScreen.UIColorName" "LaunchBackground"
expect_plist_value "$PRIVACY_MANIFEST" "NSPrivacyTracking" "false"
expect_plist_value "$PRIVACY_MANIFEST" "NSPrivacyAccessedAPITypes.0.NSPrivacyAccessedAPIType" "NSPrivacyAccessedAPICategoryUserDefaults"
expect_plist_value "$PRIVACY_MANIFEST" "NSPrivacyAccessedAPITypes.0.NSPrivacyAccessedAPITypeReasons.0" "CA92.1"
expect_plist_value "$EXPORT_OPTIONS" "method" "app-store-connect"
expect_plist_value "$EXPORT_OPTIONS" "signingStyle" "automatic"
expect_plist_value "$EXPORT_OPTIONS" "teamID" "C4QJQJP2C8"

rg -q 'PRODUCT_BUNDLE_IDENTIFIER = com.tulipproject.ios;' "$PROJECT_FILE" || fail "unexpected bundle identifier"
rg -q 'MARKETING_VERSION = 1.0;' "$PROJECT_FILE" || fail "unexpected marketing version"
rg -q 'CURRENT_PROJECT_VERSION = 2;' "$PROJECT_FILE" || fail "build number is not the current upload candidate (2)"
rg -q 'IPHONEOS_DEPLOYMENT_TARGET = 17.0;' "$PROJECT_FILE" || fail "unexpected iOS deployment target"
rg -q 'TARGETED_DEVICE_FAMILY = 1;' "$PROJECT_FILE" || fail "target is not iPhone-only"

rg -q "PrivacyInfo.xcprivacy in Resources" "$PROJECT_FILE" || fail "privacy manifest is not in the Resources build phase"
rg -q "#if DEBUG" "$APP_ROOT/TULIPWebAppView.swift" || fail "Web Inspector is not protected by a Debug-only compilation guard"
rg -q "webView.isInspectable = true" "$APP_ROOT/TULIPWebAppView.swift" || fail "Debug Web Inspector declaration is missing"
rg -q "window.TULIPNative" "$APP_ROOT/TULIPWebAppView.swift" || fail "native integration bridge is missing"

[ -f "$REPO_ROOT/public/privacy.html" ] || fail "public/privacy.html is missing"
[ -f "$REPO_ROOT/public/support.html" ] || fail "public/support.html is missing"
[ -f "$APP_ROOT/WebApp/index.html" ] || fail "bundled WebApp/index.html is missing; run iOS/scripts/sync-web-app.sh"
[ -f "$APP_ROOT/Assets.xcassets/LaunchBackground.colorset/Contents.json" ] || fail "black launch background asset is missing"
[ -f "$APP_ROOT/Assets.xcassets/LaunchMark.imageset/LaunchMark@3x.png" ] || fail "launch mark asset is missing"
[ -f "$IOS_ROOT/TULIPDesignSystem.md" ] || fail "native design-system contract is missing"
[ -f "$IOS_ROOT/AppStore/submission-checklist.md" ] || fail "submission checklist is missing"
[ -f "$IOS_ROOT/AppStore/accessibility-answers.md" ] || fail "accessibility-label checklist is missing"

icon_width="$(sips -g pixelWidth "$APP_ICON" | awk '/pixelWidth/ { print $2 }')"
icon_height="$(sips -g pixelHeight "$APP_ICON" | awk '/pixelHeight/ { print $2 }')"
icon_alpha="$(sips -g hasAlpha "$APP_ICON" | awk '/hasAlpha/ { print $2 }')"
[ "$icon_width" = "1024" ] || fail "AppIcon width is $icon_width, expected 1024"
[ "$icon_height" = "1024" ] || fail "AppIcon height is $icon_height, expected 1024"
[ "$icon_alpha" = "no" ] || fail "AppIcon contains an alpha channel"

sdk_version="$(xcrun --sdk iphoneos --show-sdk-version)"
sdk_major="${sdk_version%%.*}"
[ "$sdk_major" -ge 27 ] || fail "iOS SDK $sdk_version is too old for the iOS 27 launch gate; install Xcode 27 and select it with xcode-select"

"$SCRIPT_DIR/check-design-system.sh"
"$SCRIPT_DIR/audit-app-privacy.sh"

for screenshot_name in 01-explore 02-activity-impacts 03-analyse-relationships 04-my-footprint; do
  screenshot_path="$SCREENSHOT_ROOT/$screenshot_name.jpg"
  [ -f "$screenshot_path" ] || fail "missing 6.9-inch screenshot $screenshot_name.jpg"
  screenshot_width="$(sips -g pixelWidth "$screenshot_path" | awk '/pixelWidth/ { print $2 }')"
  screenshot_height="$(sips -g pixelHeight "$screenshot_path" | awk '/pixelHeight/ { print $2 }')"
  screenshot_alpha="$(sips -g hasAlpha "$screenshot_path" | awk '/hasAlpha/ { print $2 }')"
  [ "$screenshot_width" = "1320" ] || fail "$screenshot_name.jpg width is $screenshot_width, expected 1320"
  [ "$screenshot_height" = "2868" ] || fail "$screenshot_name.jpg height is $screenshot_height, expected 2868"
  [ "$screenshot_alpha" = "no" ] || fail "$screenshot_name.jpg contains an alpha channel"
done

if [ "${TULIP_CHECK_LIVE_URLS:-0}" = "1" ]; then
  for url in \
    "https://tulip-project-six.vercel.app/" \
    "https://tulip-project-six.vercel.app/privacy.html" \
    "https://tulip-project-six.vercel.app/support.html"; do
    curl --fail --location --silent --show-error --max-time 12 --output /dev/null "$url" \
      || fail "public App Store URL is unavailable: $url"
  done
fi

echo "App Store repository readiness checks passed."
echo "External checks still required: distribution signing, App Store Connect decisions, TestFlight, and real-device QA."
echo "Set TULIP_CHECK_LIVE_URLS=1 to include privacy, support, and marketing URL reachability."
