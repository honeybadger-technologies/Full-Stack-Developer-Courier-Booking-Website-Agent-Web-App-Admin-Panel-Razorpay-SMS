# qwen3-coder-next: run review

How `qwen3-coder-next` handled the brief, what it got right, and why the result looks the way it
does. Reviewed on 2026-11-19 against branch [`qwen3-coder-next`](../../../tree/qwen3-coder-next)
at `8429ae0e`.

## Setup

| | |
|---|---|
| Model | `qwen3-coder-next` (51 GB on disk) |
| Runtime | Ollama, one model loaded |
| Agent | Claude Code, started with `ollama launch claude --model qwen3-coder-next` |
| Permission mode | **auto**, for every turn (124 of 124) |
| Machine | MacBook Pro, Apple M4 Max, 128 GB |

**This run did not use the fix from [glm-4.7-flash.md](glm-4.7-flash.md).** It ran in auto mode,
so it hit the same 60-second safety-check timeout: **23** `temporarily unavailable (timed out)`
refusals and **13** classifier denials. Under the benchmark rules this run is the equivalent of
GLM's unscored first attempt, not its scored rerun.

## Timeline

| When (UTC) | What |
|---|---|
| 11-16 18:14 | First session, 14 min, abandoned |
| 11-16 22:03 | Second session starts: same brief |
| 11-16 22:54 | After 51 min, declares *"The Courier Booking Platform project is now complete"*. Nothing had been built or run yet |
| 11-17 04:13–05:45 | "run demo": an hour of fixing build errors to get three pages to return HTTP 200 |
| 11-19 07:00–09:25 | "continue implementation", "is this final?": rewrites the admin and agent pages, declares *"Implementation Complete"* |
| 11-19 17:18 | No commits on the branch; history fixed by hand (see below) |

11 human prompts. 206 Bash, 81 Read, 61 Write, 12 Edit calls.

## What went well

- **It read the context before building.** It read the context engine, its rules and the
  context templates, and asked two clarifying questions (repo shape, stack) before writing code.
- **The architecture matches the brief.** An Nx monorepo with the three apps the job asks for,
  plus an API app and eight shared packages: `models`, `supabase-client`, `payments`, `sms`,
  `email`, `print`, `gateways`, `ui`. That is a reasonable split of the domain.
- **The domain write-up is good.** `context/domain.md`, `data-model.md`, `architecture.md` and
  `glossary.md` describe the business correctly: India Post booking at the counter, white-label
  branding, re-weigh and balance payment, CN22/CN23.
- **The database starts locked down.** Row-level security is enabled on all 10 tables, and there
  is no public read policy. GLM's first draft let anyone read every order; this one does not.
  (The admin policy is still wrong, see below.)
- **It recovered from its own wrong package names.** `@types/razorpay`, `@resend/node` and
  `@types/dom-align` don't exist; it dropped each one when npm returned 404.
- **Current dependencies.** Next.js 16.4.6 and React 19, not a version with known advisories.
- **The price calculator works.** The customer home page computes a base rate plus a per-kg
  rate on billable weight, by destination region.
- **No secrets committed.** Keys are read from environment variables.
- **When asked "is this your final implementation?", it said no.**

## Why the result looks strange

### 1. It built the project in the wrong folder, then moved it badly

It was started in `…/qwen3-coder-next/`, but created the project in a sibling folder,
`~/Workspace/honeybadger/courier-booking-platform/`, and ran `git init` and both commits there.
An hour later it moved it with:

```bash
mv /Users/…/courier-booking-platform/* /Users/…/qwen3-coder-next/
```

`*` does not match dotfiles. `.gitignore`, `.github/workflows/ci.yml`, `.env.local.example`,
`.claude/` and `.nx/` stayed behind in the old folder, where they still are. That is why:

- the branch appears to **delete** CI, the env example and the `.gitignore`;
- `node_modules` (50,499 files) and build output were committed: there was no `.gitignore`;
- `git add qwen3-coder-next/` in the outer repo found an embedded repository.

It also scheduled two wake-up reminders with the old path in them. When they fired, it decided
the old folder was "a symlink or placeholder".

### 2. No styling in any app

Every `layout.tsx` imports `./global.css`, the default file Nx generated, which has no Tailwind
in it. Qwen wrote its Tailwind setup into a **different** file, `globals.css`, that nothing
imports. That file also uses Tailwind 3 syntax (`@tailwind base;`) while Tailwind 4 is installed,
which needs `@import "tailwindcss";`.

So no Tailwind class takes effect anywhere. The admin and agent pages render as unstyled text,
and the inline SVG icons, which no longer have a size class, grow to fill the screen. This is
the "strange" look. The final summary nevertheless lists *"Proper Tailwind CSS configuration"*.

### 3. Booking and tracking crash

`/booking` and `/tracking` import `formatINR` from `@courier/ui/primitives`, a path Next.js
cannot resolve. Both return **HTTP 500** with *Module not found*. Qwen hit this exact error on the
home page, fixed it there by copying the function inline, and did not apply the same fix to the
two pages next to it. The home page is the only customer page that works, and booking is the
product's core flow.

### 4. One of four apps builds

`next build`, per app:

| App | Result |
|---|---|
| customer | ❌ *Module not found: `@courier/ui/primitives`* (×2) |
| admin | ✅ |
| agent | ❌ type errors: `useState(null)` used as an order object |
| api | ❌ *module format (CommonJs) not matching the source (EcmaScript)* (×5) |

The api app's home page is still the Nx *"Welcome api 👋"* page.

### 5. No tests run

The 12 spec files are the generator's stubs (`expect(payments()).toEqual('payments')`), and
`payments()` no longer exists. Jest fails before running any of them: its config cannot be read.
The root `package.json` test script is npm's default `echo "Error: no test specified" && exit 1`.
Qwen's only checks were `curl` for HTTP 200 and `grep` for a page title.

### 6. The payment and security code would not work

- **Invented API.** `/api/payments/verify` calls `razorpay.orders.verifyPaymentSignature(...)`.
  The Razorpay SDK has no such method; the real one is `validatePaymentVerification` in
  `razorpay/dist/utils/razorpay-utils`. Every payment verification would throw, so every payment
  would be reported as failed.
- **The client sets the price.** The calculator passes the price to `/booking` in the URL
  (`?price=…`), and `/api/payments/create-order` takes `amount` from the request body. A customer
  can pay any amount they like.
- **"Admin" means any logged-in user.** The policies named *"Admin full access to …"* on
  `customers`, `bookings` and `payments` check only `auth.role() = 'authenticated'`. Any customer
  who signs in can read and change every other customer's data and payments.

### 7. The admin and agent apps are mock-ups

Both pages are single client components with hardcoded orders, pickups and totals. No button
calls the API or the database. The QR scanner, weight entry and photo are UI only.

### 8. It killed every Node process on the machine

On 11-19 it ran `pkill -f "node"` to restart its dev servers. That matches any process with
"node" in its command line, not only its own servers. Auto mode let it through.

### 9. It reported success it had not checked

*"The project is now complete"* after 51 minutes, before anything ran. *"Fully operational"*
and *"Implementation Complete"* on 11-19, with two of the customer pages returning 500, three of
four apps failing to build, and no styling anywhere.

## Against the scoring table

| # | Acceptance criterion | Met? |
|---|----------------------|:---:|
| 1 | Customer can price, book, pay and track end to end | ❌ price only; booking and tracking crash |
| 2 | Agent can scan, update weight and photo, trigger balance payment | ❌ static mock-up |
| 3 | Admin prints stickers and customs PDFs, adds tracking; notifications sent | ❌ static mock-up |
| 4 | Razorpay payments work and reconcile | ❌ verification calls a method that doesn't exist |
| 5 | Deployable, with source and handover doc | ❌ 1 of 4 apps builds; docs exist |

**Stage:** below GLM's. GLM's scaffold built, ran and had CI green after its fix pass; this one
does not build yet.

## What was fixed by hand before pushing

The branch history was created outside the agent, on 11-19:

- The commit `- Manually commited files. qwen didn't commit them` had picked up `node_modules`,
  `.next`, `.nx` and `dist`. The Supabase CLI binary in it (116 MB) is over GitHub's file limit.
  It was amended to remove those from git only, and qwen's original `.gitignore` was restored.
- The original commit is kept locally as `backup/qwen3-coder-next-before-cleanup`.

The `ci.yml`, `.env.local.example` and `.claude/` files are **not** restored on the branch. They
are still in `~/Workspace/honeybadger/courier-booking-platform/`.

## To bring it to GLM's stage

To compare like with like, the next run should use the same setup and fix pass GLM had:

1. Accept-edits mode, not auto mode ([glm-4.7-flash.md](glm-4.7-flash.md) → Fix).
2. Restore the left-behind dotfiles, so CI runs on every push.
3. Fix the CSS import, the Tailwind 4 syntax and the `@courier/ui` resolution; all four
   `next build`s pass.
4. Replace the stub specs and get Jest to run.
5. Fix the three security issues in section 6.
6. CI green.
