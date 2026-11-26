#!/usr/bin/env bash
# Starts Claude Code on a local Ollama model through tool-name-proxy, with the same
# environment `ollama launch claude --model <model>` sets. Run it from the model's folder.
set -euo pipefail

model="${1:?usage: launch.sh <ollama-model> [claude args...]}"
shift
port="${PROXY_PORT:-11435}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$here/logs"
log="$here/logs/${model//[:\/]/-}-$(date +%Y%m%d-%H%M%S).jsonl"

for tool in claude python3 curl ollama; do
  command -v "$tool" >/dev/null || { echo "launch.sh: $tool not found" >&2; exit 1; }
done
# Claude Code doesn't know a local model's window, so it never auto-compacts before Ollama refuses.
context="${CONTEXT_TOKENS:-$(ollama show "$model" | awk '/context length/ {print $3}')}"
[[ "$context" =~ ^[0-9]+$ ]] || { echo "launch.sh: no context length for $model; set CONTEXT_TOKENS" >&2; exit 1; }
if curl -s -o /dev/null "http://127.0.0.1:$port/"; then
  echo "launch.sh: port $port is already in use; set PROXY_PORT" >&2
  exit 1
fi

PORT="$port" REWRITE_LOG="$log" python3 -I "$here/proxy.py" 2>>"$here/logs/proxy.stderr" &
proxy_pid=$!
trap 'kill "$proxy_pid" 2>/dev/null || true' EXIT
for _ in $(seq 1 50); do
  curl -s -o /dev/null "http://127.0.0.1:$port/" && break
  sleep 0.1
done

echo "tool-name-proxy on port $port, rewrites logged to $log, context $context tokens" >&2
CLAUDE_CODE_MAX_CONTEXT_TOKENS="$context" \
ANTHROPIC_BASE_URL="http://127.0.0.1:$port" \
ANTHROPIC_API_KEY="" \
ANTHROPIC_AUTH_TOKEN="ollama" \
CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST=1 \
CLAUDE_CODE_ATTRIBUTION_HEADER=0 \
CLAUDE_CODE_TOTAL_TOKENS_REMINDER=off \
DISABLE_ERROR_REPORTING=1 \
DISABLE_FEEDBACK_COMMAND=1 \
CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY=1 \
CLAUDE_CODE_AUTO_MODE_SERVER=0 \
ANTHROPIC_DEFAULT_OPUS_MODEL="$model" \
ANTHROPIC_DEFAULT_SONNET_MODEL="$model" \
ANTHROPIC_DEFAULT_HAIKU_MODEL="$model" \
CLAUDE_CODE_SUBAGENT_MODEL="$model" \
  claude --model "$model" "$@"
