#!/bin/bash
# Swift test gate WITHOUT app-ghost fallout.
#
# Every `xcodebuild` build/test registers its product with LaunchServices
# (the RegisterWithLaunchServices build step), so raw test runs leave ghost
# "Loom" entries in Spotlight/Launchpad pointing at DerivedData (or any
# -derivedDataPath). This wrapper runs the suite, then deletes the built
# product AND unregisters it, so /Applications/Loom.app stays the only
# registered Loom on the machine. Verify with:
#   lsregister -dump | grep 'path:.*Loom.app'
set -o pipefail
cd "$(dirname "$0")/../macos-app/Loom" || exit 1

# -skip-testing:LoomUITests — the XCUITest target needs an interactive TCC
# automation grant (it times out with "control session with daemon" when run
# from a non-authorized process tree), so the fast gate is unit-tests-only.
# Run UI tests explicitly from an authorized Terminal:
#   xcodebuild test -scheme LoomUITests -destination 'platform=macOS'
LOOM_SKIP_WEB_STAGE=1 xcodebuild -project Loom.xcodeproj -scheme Loom \
  -destination 'platform=macOS' CODE_SIGNING_ALLOWED=NO \
  -skip-testing:LoomUITests test "$@"
status=$?

LSREGISTER=/System/Library/Frameworks/CoreServices.framework/Versions/Current/Frameworks/LaunchServices.framework/Versions/Current/Support/lsregister
"$LSREGISTER" -dump 2>/dev/null | grep -oE "path: +/.*Loom\.app" | sed 's/path: *//' | sort -u | while read -r p; do
  if [ "$p" != "/Applications/Loom.app" ]; then
    "$LSREGISTER" -u "$p" 2>/dev/null
    rm -rf "$p" 2>/dev/null
  fi
done
find ~/Library/Developer/Xcode/DerivedData -maxdepth 5 -name "Loom.app" -type d -exec rm -rf {} + 2>/dev/null
"$LSREGISTER" -gc 2>/dev/null

exit $status
