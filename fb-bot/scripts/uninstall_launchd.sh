#!/bin/zsh
set -euo pipefail

LABEL="com.bayder.fbbot"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

launchctl unload "$PLIST" 2>/dev/null || true
rm -f "$PLIST"
echo "Zamanlanmış görev kaldırıldı."
