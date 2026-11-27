# flint, guided attempt

A second attempt with flint, guided by a reviewer (Claude Opus 5.5) over 10 rounds on the `flint-guided` branch. It is not an independent run:

- Each round flint got a written brief from the reviewer, ran headless in a sandbox limited to its own folder, and went through `tools/tool-name-proxy`.
- The reviewer ran build, lint and tests, walked through the demo in a browser, and committed each round (`fix(courier): guided round N (flint)`).
- From round 8 the briefs named the cause and the file to change, not only the symptom.
- The reviewer made two mistakes: in round 8 the brief pointed at a component the page does not use, and in round 10 the first fix idea would not have closed the layout gap (corrected before sending).

## Result

Run the demo with `flint/scripts/demo/run-demo.sh` (mock backend on 4999, customer 3000, agent 3002, admin 3003; sign-ins are printed at start).

Works in the browser: all three roles sign in; the customer books a parcel, pays with the demo checkout (local mock, no Razorpay call) and sees the order as Paid; admin shows it as Paid on phone cards and in the desktop table; the agent sees its pickup under a header with Sign out. Build, lint and 83 tests pass.

Known gaps:

- **Agent sign-in hangs when signed out.** `apps/agent/app/layout-agent.tsx` wraps `/auth/login` too and has no check for sign-in pages, so a signed-out visitor sees "Loading..." forever. flint's round 8 report said the gate skipped `/auth/*`; it does not.
- The admin Actions column at 1280 px needs a small scroll inside its own box.
- The live Razorpay path (without the demo flag) was not exercised.

## Files

- `courier-demo-customer-admin.mp4`: 69 s recording of the customer booking and paying on a phone, then admin on a phone and at 1280 px. The agent scene is missing because of the sign-in hang above.
- `round6/` to `round10/`: browser snapshots the reviewer took after each round (390 px phone and 1280 px desktop).
