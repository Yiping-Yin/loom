#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-run}"
APP_NAME="Loom"
BUNDLE_ID="com.yinyiping.loom"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$ROOT_DIR/macos-app/Loom"
DERIVED_DATA="$ROOT_DIR/.codex/DerivedData/Loom"
APP_BUNDLE="$DERIVED_DATA/Build/Products/Debug/$APP_NAME.app"

usage() {
  echo "usage: $0 [run|--debug|--logs|--telemetry|--verify]" >&2
}

stop_app() {
  /usr/bin/pkill -x "$APP_NAME" >/dev/null 2>&1 || true
}

build_app() {
  /usr/bin/env node "$ROOT_DIR/scripts/ensure-xcode27-environment.mjs"

  if command -v xcodegen >/dev/null 2>&1; then
    (cd "$PROJECT_DIR" && xcodegen generate)
  fi

  /usr/bin/xcodebuild \
    -project "$PROJECT_DIR/Loom.xcodeproj" \
    -scheme "$APP_NAME" \
    -configuration Debug \
    -derivedDataPath "$DERIVED_DATA" \
    -destination "platform=macOS" \
    build
}

open_app() {
  /usr/bin/open -n "$APP_BUNDLE"
}

stop_app
build_app

case "$MODE" in
  run)
    open_app
    ;;
  --debug|debug)
    /usr/bin/lldb -- "$APP_BUNDLE/Contents/MacOS/$APP_NAME"
    ;;
  --logs|logs)
    open_app
    /usr/bin/log stream --info --style compact --predicate "process == \"$APP_NAME\""
    ;;
  --telemetry|telemetry)
    open_app
    /usr/bin/log stream --info --style compact --predicate "subsystem == \"$BUNDLE_ID\""
    ;;
  --verify|verify)
    open_app
    sleep 2
    /usr/bin/pgrep -x "$APP_NAME" >/dev/null
    echo "$APP_NAME is running from $APP_BUNDLE"
    ;;
  *)
    usage
    exit 2
    ;;
esac
