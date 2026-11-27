#!/usr/bin/env bash
# Start the full Courier Booking demo:
#   - mock backend on :4999 (Supabase auth/REST, Razorpay, MSG91, SMTP)
#   - customer app on :3000
#   - agent app on :3002
#   - admin app on :3003
#
# Demo credentials:
#   customer: demo.courier@example.com / courier-demo
#   agent:    demo.agent@example.com / courier-demo
#   admin:    demo.admin@example.com / courier-demo
#
# Usage: ./scripts/demo/run-demo.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOCK_PORT="${MOCK_PORT:-4999}"

export PORT="$MOCK_PORT"

# The inotify-based file watcher can hit EMFILE ("too many open files, watch")
# in this environment and take Next.js dev's route discovery down with it, which
# makes every route fall through to the not-found page. Polling is slower but
# reliable here.
export WATCHPACK_POLLING=true

checkPort() {
  local port="$1"
  if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:${port}/" ; then
    echo "[run-demo] port ${port} is already in use - aborting (nothing was killed)" >&2
    exit 1
  fi
}

checkPort 4999
checkPort 3000
checkPort 3002
checkPort 3003

node "$ROOT/scripts/demo/mock-backend.mjs" > "$TMPDIR/courier-mock-backend.log" 2>&1 &
MOCK_PID=$!

pnpm --dir "$ROOT/apps/customer" dev > "$TMPDIR/courier-customer-dev.log" 2>&1 &
CUSTOMER_PID=$!

pnpm --dir "$ROOT/apps/agent" dev > "$TMPDIR/courier-agent-dev.log" 2>&1 &
AGENT_PID=$!

pnpm --dir "$ROOT/apps/admin" dev > "$TMPDIR/courier-admin-dev.log" 2>&1 &
ADMIN_PID=$!

cleanup() {
  kill $MOCK_PID $CUSTOMER_PID $AGENT_PID $ADMIN_PID 2>/dev/null || true
}
trap cleanup EXIT

waitForPort() {
  local port="$1"
  local tries=0
  until curl -s -o /dev/null --max-time 2 "http://127.0.0.1:${port}/"; do
    tries=$((tries + 1))
    if [ "$tries" -ge 60 ]; then
      echo "[run-demo] timed out waiting for server on port ${port}" >&2
      exit 1
    fi
    sleep 2
  done
}

waitForPort "$MOCK_PORT"
waitForPort 3000
waitForPort 3002
waitForPort 3003

echo "[run-demo] mock backend on http://127.0.0.1:$MOCK_PORT"
echo "[run-demo] customer app on http://127.0.0.1:3000"
echo "[run-demo] agent app on http://127.0.0.1:3002"
echo "[run-demo] admin app on http://127.0.0.1:3003"

echo "[run-demo] demo sign-ins: customer demo.courier@example.com / courier-demo, agent demo.agent@example.com / courier-demo, admin demo.admin@example.com / courier-demo"

wait $MOCK_PID $CUSTOMER_PID $AGENT_PID $ADMIN_PID