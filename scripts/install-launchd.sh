#!/usr/bin/env bash
set -euo pipefail

# Installs a macOS LaunchAgent to start local-scheduler-express-server on login.
# Usage: ./scripts/install-launchd.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LABEL="com.localscheduler.express"
PLIST_PATH="${HOME}/Library/LaunchAgents/${LABEL}.plist"
LOG_DIR="${HOME}/Library/Logs/local-scheduler"

mkdir -p "${LOG_DIR}"

cat > "${PLIST_PATH}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd "${REPO_ROOT}" && npm start</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/express.out.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/express.err.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PORT</key>
    <string>4120</string>
  </dict>
</dict>
</plist>
EOF

launchctl unload "${PLIST_PATH}" 2>/dev/null || true
launchctl load "${PLIST_PATH}"

echo "✅ Installed LaunchAgent: ${PLIST_PATH}"
echo "   Logs: ${LOG_DIR}/express.out.log"
