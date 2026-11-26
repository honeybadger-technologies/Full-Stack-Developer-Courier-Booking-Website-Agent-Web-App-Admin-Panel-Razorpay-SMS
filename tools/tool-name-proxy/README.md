# tool-name-proxy

A small proxy between Claude Code and Ollama for models that don't use the tool names they are
given.

## Why

`flint` ignores Claude Code's tool list and calls the names it was trained on: `bash` instead
of `Bash`, `read` with a `path` argument instead of `Read` with `file_path`. Claude Code rejects
every such call (`No such tool available: bash`), and flint retries the same call forever: 374
failed calls in 13 minutes on 2026-11-24 (369 of them `pwd && ls -la`), 10 in auto mode on 2026-11-16. The error message does not
correct it.

Tested straight against Ollama, without Claude Code: with two tools and a one-line request flint
uses the right names; with Claude Code's tool list and the brief it calls `bash`. With the shell
tool renamed `RunShell`, it calls `read`, a tool that was not offered at all. So the model
uses its own tool vocabulary on real tasks. Ollama's parser is not lowercasing names.

## What it does

For every `/v1/messages` request it reads the tools the request offered, and for every tool call
in the response:

- **Name:** maps the call to an offered tool when they match ignoring case, `_` and `-`
  (`bash` → `Bash`, `write_file` → `Write`), plus a short alias list (`shell` → `Bash`). Unknown
  names pass through unchanged, so Claude Code still rejects them.
- **Arguments:** renames an argument the tool doesn't have to one it does, the same way
  (`filePath` → `file_path`), plus `path` → `file_path` and `cmd` → `command`. Never overwrites
  an argument that is already there.

Streaming responses are handled: a tool call's arguments are held until the call ends, then sent
in one piece. Everything else passes through unchanged.

Every rewrite is logged as one JSON line in `logs/<model>-<time>.jsonl`. **This is harness help,
and the benchmark write-up must say how much of it a model needed.**

## Use

From the model's folder, instead of `ollama launch claude --model <model>`:

```bash
../tools/tool-name-proxy/launch.sh flint:latest --permission-mode acceptEdits
```

It starts the proxy on port 11435 (`PROXY_PORT` to change), sets the same environment `ollama
launch claude` sets, with `ANTHROPIC_BASE_URL` pointed at the proxy, and stops the proxy when
Claude Code exits.

It also sets `CLAUDE_CODE_MAX_CONTEXT_TOKENS` to the model's context length from `ollama show`
(`CONTEXT_TOKENS` to override). Without it Claude Code doesn't know the window of a local
model and never auto-compacts: flint's session reached 278k tokens against a 262k window, and
`/compact` then failed too, because compacting sends the whole conversation.
