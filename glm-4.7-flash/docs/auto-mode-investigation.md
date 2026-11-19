# glm-4.7-flash: configuration and known issue

How `glm-4.7-flash` is run in this benchmark, and why its first attempt failed to create files.

## Setup

| | |
|---|---|
| Model | `glm-4.7-flash:latest` (29.9B params, MoE, Q4_K_M, 19 GB on disk) |
| Context | 202,752 tokens (model maximum) |
| Runtime | Ollama 0.40.16, llama.cpp runner, 100% GPU |
| Agent | Claude Code 2.1.311, started with `ollama launch claude --model glm-4.7-flash` |
| Machine | MacBook Pro, Apple M4 Max, 40-core GPU, 128 GB unified memory |

`ollama launch claude` points Claude Code at the local Ollama server and routes **every** model
role to GLM: the main model, subagents, and the auto-mode safety check.

## Symptom

During its first run, GLM stopped writing code and said:

> I'm experiencing persistent timeout issues with the file creation tools. Let me create a setup
> guide for you to set up the project manually...

## Root cause: auto mode's safety check never answers in time

With Claude Code in **auto mode**, every Write or Bash action is first sent to a model that
decides whether it is safe. Under `ollama launch claude`, that model is GLM itself. The check
has a **60-second** limit; when it runs out, Claude Code refuses the action and tells the model:

`glm-4.7-flash is temporarily unavailable (timed out), so auto mode cannot determine the safety of Write right now.`

The message names the model as "unavailable", which is misleading: the model was busy on the
check, not down. GLM read it as "file tools are broken" and fell back to writing a manual setup
guide. During the session the only visible symptom was the agent stopping every few actions;
it had to be nudged with Enter to continue.

### What was sent

Claude Code saved the last failed check to
`~/.claude/projects/<project>/<session>/auto-mode-classifier-error.txt`. It holds:

- **Instructions:** a 141,000-character security-monitor prompt (hard blocks, soft blocks,
  exceptions, a classification procedure). The expected answer is one line:
  `<block>no</block>`, or `<block>yes</block>` with a rule name.
- **The session so far:** 93,000 characters: the pasted brief plus all 57 tool calls made up to
  that point.
- **The action:** a Write of `apps/customer-web/app/page.tsx`.
- **Size:** about **56,000 tokens** for this check. Checks grew from 31k tokens at the start of
  the session to 56k at the end, because the session history is resent every time.

### What GLM replied

**Nothing, in all 20 checks.** The transcript records 20 checks (`classifierBoundary`), and the
Ollama log has exactly 20 matching HTTP 500s at 59.9–70 s. They failed in two ways:

| Checks | Cut off while | Detail |
|---:|---|---|
| 10 | **reading the prompt** | GLM reads prompts at 120–290 tokens/s, so a 31k–56k prompt needs 2–6 minutes. The main session and the check share one prompt cache in Ollama, so each evicted the other and the history was reread every time |
| 10 | **writing its answer** | With the prompt mostly cached, GLM started answering, but it is a reasoning model: it wrote **275–766 tokens** of reasoning at about **13 tokens/s** and never reached the 5-token verdict |

Every Write that succeeded came after the session was switched to *accept edits* (20:02 UTC).
The last two failures happened when the mode briefly went back to auto.

The failure is in the setup, not in GLM's coding ability. A slow-reading reasoning model cannot
fit a 30–56k-token safety check into 60 seconds.

## Fix

**Do not run benchmark sessions in auto mode.** Either:

- press **Shift+Tab** in the session until the mode reads *accept edits*, or
- start Claude Code with `--permission-mode acceptEdits`.

File writes then skip the safety check. Bash commands not on the allow list ask for approval
instead of being checked.

No setting was found that raises the 60-second limit of the safety check. Claude Code's own
stream timeouts (`CLAUDE_STREAM_IDLE_TIMEOUT_MS`, `API_TIMEOUT_MS`) already default to 3–10
minutes and do not affect it.

## Also: run one model at a time

At full context each model needs 54–90 GiB, so 128 GB cannot hold all four local models at once.
Running them in parallel made Ollama load and evict them repeatedly, and one load timed out.
Run the models one after another, or set `OLLAMA_MAX_LOADED_MODELS=1`. Parallel runs also distort
the time-per-task numbers.

## Benchmark rules this implies

- Every model runs in the same permission mode (*accept edits*), never auto mode.
- One model loaded at a time.
- GLM's first attempt is not scored. Its rerun under these settings is.

## Status (2026-11-16)

Branch [`glm-4.7-flash`](../../../../tree/glm-4.7-flash) is at `aec9833`, with CI green on every push
since the workflows moved to the repo root (including `aec9833`).

**Stage:** scaffold only. All three apps build and run, but they are placeholder pages; no
features from the brief are built yet. Against the scoring table, no acceptance criterion is met.

8 fix commits on top of the initial scaffold (`e819856`):

| Commit | What |
|---|---|
| `3c178ec` | Migration creates tables in the right order. Removed the access policies that let anyone read all orders and customers; price rates are read-only to the public |
| `4dea79f` | All apps build: Turbo 2 config, missing CSS and tsconfig files, dangling exports. Added the lockfile |
| `03bc029` | Admin database client is server-only and created on first use, so browser code no longer crashes |
| `eeaa0ef` | CI moved to the repo root so GitHub runs it; lint, test and build pass. Dropped the Docker job and retired actions |
| `797c13b` | Removed the `/api` rewrite to `localhost:3001` |
| `2da6a7e` | Next.js 15.5.29 and React 19.3.1, clearing all 25 Next.js advisories, including the critical remote-code-execution ones |
| `d2d180c` | Shared types match the schema. Fixed status lists, with database checks and a migration |
| `aec9833` | The database generates random `HBC-…` order numbers in a unique `order_number` column |

### Open

1. **Migrations not run.** None has been applied to a database. Check with `npx supabase db reset`
   against a local Supabase.
2. **`xlsx`.** The npm package has high-severity advisories with no fix. Switch to SheetJS's own
   CDN release before building bulk Excel upload.
3. **Next.js's bundled postcss.** Still flagged by `npm audit`. It only runs at build time on our
   own CSS, so risk is low; the fix is Next 16.
4. **`orders.customer_id`** can be null. Making it required is optional.
5. **Smaller items:**
   - Favicon returns 404 in all three apps.
   - Customer page subtitle isn't centred on desktop.
   - API spec examples still use the old `HBC-123456` ID format.
   - `--passWithNoTests` should come off once real tests exist.
6. **Merge to main.** The branch shares no history with `main`, so merging needs
   `--allow-unrelated-histories`, or a PR that GitHub will flag the same way.
