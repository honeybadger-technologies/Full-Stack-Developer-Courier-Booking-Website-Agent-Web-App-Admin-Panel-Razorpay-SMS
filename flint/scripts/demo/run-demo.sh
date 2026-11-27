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
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOCK_PORT="${MOCK_PORT:-4999}"

export PORT="$MOCK_PORT"

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

echo "[run-demo] mock backend on http://127.0.0.1:$MOCK_PORT"
echo "[run-demo] customer app on http://127.0.0.1:3000"
echo "[run-demo] agent app on http://127.0.0.1:3002"
echo "[run-demo] admin app on http://127.0.0.1:3003"

wait $MOCK_PID $CUSTOMER_PID $AGENT_PID $ADMIN_PID