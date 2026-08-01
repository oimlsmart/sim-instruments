# TODO.integration/05 — the report-back

**To:** `oimlsmart/smart` TODO.integration/15 (composite SST session) +
TODO.integration/24 (the SST split pre-req) · **From:** the SST repo
owner · **Branch:** `v2` (this repo) · **Date:** 2026-08-01

## The two proof commands

### 1. The boundary check (TODO.integration/24 pre-req)

```
$ ~/src/oimlsmart/smart/scripts/sst-split/check-boundary.sh /Users/mulgogi/src/oimlsmart/sim-instruments
check-boundary: clean — no framework file imports @sim/*
```

Exit 0. The six violations the work orders named (the four boot-strategy
imports + the legacy fallbacks) are gone — phase 1 deleted the boot-
strategy files + the legacy family packages entirely. The runtime is
kind-agnostic by being data-driven, not by dispatching to per-kind
code.

### 2. The live composite acceptance (TODO.integration/15)

```
$ cd ~/src/oimlsmart/smart/browser
$ SIM_INSTRUMENTS_REPO=/Users/mulgogi/src/oimlsmart/sim-instruments \
    npx vitest run src/__tests__/composite-sst-acceptance.test.ts

 RUN  v4.1.6 /Users/mulgogi/src/oimlsmart/smart/browser

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  17:18:00
   Duration  2.08s
```

All three §7 legs pass against the v2 runtime:
- §7.1 the decomposed register set — every register the composition
  declares reads through the composite /twin.
- §7.2 the declared coupling — starving the sampling line decays the
  analyzer's indication through the runtime-computed coupling.
- §7.3 the composite state rule — `any_fault_else_analyzer` computed
  server-side: fault on the SL interlock, recovery returns the
  analyzer's state.

## The commit ids (items 01–04)

| Item | Commit | What |
|---|---|---|
| (phase 1 / "item 01") | `ed86725` | fix the lc500 data-driven boot (ComposedInstrument self-subscribes to clock advances; strain-unit mismatch normalized in both paths) |
|                      | `098ee95` | move twin contracts + bake scripts to kind packages; convention-based path resolution |
|                      | `6614562` | the universal plug-and-play boot — deleted all four `boot-strategy-*.ts` + the `KIND_BOOT_REGISTRY` |
|                      | `4f87fca` | delete `packages/{lc500,r91,md,gas-analyzer}/`; bench → `@primmel/sst-bench` under shell; re-bundle behavior.js inline |
| 02 | `91be6fc` | the sampling-line kind + the ACME CGM-200 sampling-line instance (transport-delay + dilution + stagnation physics) |
| 03 | `79ea016` | the composite package + loader leg (`composite-package.schema.json`, manifest validation, acme-cgm-system package) |
| 04 | `d167de2` | `composeSession` — the composite runtime boot (component sessions, twin delegation, world fan-out, per-tick couplings, state-rule registry, startup conformance) |

## Spec deviations (none)

specs/13 was followed verbatim. No silent divergences; the acceptance
suite passes unchanged.

One implementation note: the runtime's per-tick coupler runs in TWO
passes per clock advance — a pre-pass (subscribed before any component
boots) that propagates `analyzer.source_composition →
sampling_line.inlet_composition` so the SL sees fresh values, and a
post-pass (subscribed after all components) that propagates
`sampling_line.outlet_composition → analyzer.inlet_composition` so
the analyzer's bench reflects the SL's current outlet. Single-pass
coupling (post-tick only) introduced a 1-tick lag that broke the §7.2
decay assertion under the acceptance suite's one-shot `advanceTime`
calls; the two-pass design matches the spec's "computed by the runtime
each tick" intent.

## One v2 architectural call (a feature, not a deviation)

The runtime's v2 has no `@sim/*` packages. The four legacy family
packages (`@sim/lc500`, `@sim/r91`, `@sim/md`, `@sim/gas-analyzer`)
were deleted in phase 1 — the SST-native instance packages own their
physics through their bundled `behavior.js`. The smart side's
`sim-bin.ts` resolver points every family at the sst-runtime CLI
exclusively. The `prefer: 'legacy-bin'` legs on your side become
one-line edits (remove the flag); the `lc500` indication-reads-0-under-
load bug your `prefer: 'legacy-bin'` worked around is fixed at the
root (`ed86725`).

## What's next (your side, same day per the work orders)

- Run the full smart-repo gate set + the integration manifest against
  our landed packages (the composite legs join the 12 live contracts).
- The Twin Lab binds the composite session live (the R 144 twin.prl
  governs the analyzer; the decomposition maps to the endpoints).
- With the boundary clean: the SST split executes per
  `smart/scripts/sst-split/RUNBOOK.md`.
- TODO.integration/15 and /24 close on your side with our commit ids cited.

## The branch — DECIDED: v2 is the trunk

The user decided: **v2 is the new working branch**. The default branch
on this repo has been changed to `v2`. `v1` is preserved as the
pre-v2 reference (not deleted). The smart side's `SIM_INSTRUMENTS_REPO`
resolution (or any consumer that references this repo by branch)
should track `v2`.

With the boundary clean, the SST split executes per
`smart/scripts/sst-split/RUNBOOK.md` — at that point the framework
content of `v2` migrates to `primmel/sst` and the OIML instrument
library migrates to `oimlsmart/sst-instruments`, both carrying
`v2`'s history forward.
