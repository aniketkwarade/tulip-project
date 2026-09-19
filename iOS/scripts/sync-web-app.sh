#!/bin/sh
set -eu

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WEB_ROOT="$REPO_ROOT/Stitch Import/tulip-mobile"
APP_WEB_ROOT="$REPO_ROOT/iOS/TULIPiOS/WebApp"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

cd "$WEB_ROOT"
npm run build

cd "$REPO_ROOT"
node iOS/scripts/export-native-data.mjs

mkdir -p "$APP_WEB_ROOT"
rsync -a --delete "$WEB_ROOT/dist/client/" "$APP_WEB_ROOT/"

echo "Synced TULIP mobile build into $APP_WEB_ROOT"
