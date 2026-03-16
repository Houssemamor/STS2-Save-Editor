#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8080}"

if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "Python was not found. Install Python 3 and try again."
    exit 1
fi

URL="http://127.0.0.1:${PORT}/"
echo "Starting local server at ${URL}"

"${PYTHON_CMD}" -m http.server "${PORT}" --bind 127.0.0.1 &
SERVER_PID=$!

cleanup() {
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

sleep 1
open "${URL}" || true

wait "${SERVER_PID}"
