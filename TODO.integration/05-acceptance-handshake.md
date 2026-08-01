# 05 — The acceptance handshake (the report-back)

**Priority:** P1 · **Size:** small · **Depends on:** 04 (and 01 for
the split) · **Report back to:** oimlsmart/smart TODO.integration/15 + 24

## Context

Two armed judges wait on the smart side. They arm themselves — your
packages landing IS the trigger; nothing needs un-skipping by hand.
This item is running them and reporting the outputs.

## The two proof commands

**1. The live composite acceptance** (the 15 contract, specs/13 §7):

```
cd ~/src/oimlsmart/smart/browser
npx vitest run src/__tests__/composite-sst-acceptance.test.ts
```

Before 04: `3 skipped` (the loud skip is the armed state). After 04:
**3 passed** — the decomposed register set reads, the sampling-line
starvation decays the analyzer's indication through the declared
coupling, and `operationalState` faults on the line interlock and
returns the analyzer's state on recovery. If the runtime needs the
sibling override: `SIM_INSTRUMENTS_REPO=<this repo>` (default already
resolves `../sim-instruments`).

**2. The boundary check** (the 24 pre-req):

```
~/src/oimlsmart/smart/scripts/sst-split/check-boundary.sh <this repo>
# → check-boundary: clean — no framework file imports @sim/*
```

## Report back with

- both outputs verbatim;
- the commit ids of 01–04;
- any specs/13 deviations (with reasons — we amend the spec together
  rather than discover a silent divergence as a test failure);
- anything the acceptance exposed that the spec got WRONG (the
  acceptance judges the spec; if reality disproves a §7 leg, that is
  a spec bug to fix on our side — say so).

## What happens next (our side, same day)

- the full smart-repo gate set + the integration manifest against
  your landed packages (the composite legs join the 12 live
  contracts);
- the Twin Lab binds the composite session live (the R 144 twin.prl
  governs the analyzer; the decomposition maps to the endpoints);
- with the boundary clean: the SST split executes per
  `smart/scripts/sst-split/RUNBOOK.md` (split.sh, repo creation with
  the org admin, the consumer sweep — your repo becomes
  `primmel/sst` + `oimlsmart/sst-instruments` with history intact);
- TODO.integration/15 and /24 close on our side with your commit ids
  cited.
