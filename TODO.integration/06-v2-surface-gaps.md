# 06 — The v2 surface gaps (found during consumer integration)

**Priority:** P2 · **Size:** small · **From:** the smart-repo consumer
sweep (oimlsmart/smart, integrating your v2 report-back) ·
**Report back to:** oimlsmart/smart (the sim-practice + acceptance
consumers)

## Context

The v2 universal boot is a better design — the custody-bound sample
model (one boot, one sample) is more honest metrology than runtime
scenario morphing, and the smart repo's behavioral legs are adapted
to it (boot-time samples for physics, `setFidelity` knobs for twin
fidelity — both cleaner than what they replaced). Two surface deltas,
however, read as **gaps, not redesigns** — the gas surface kept both
capabilities, so the lc500 surface losing them looks like unwired
surface, not intent.

## Gap 1 — the environment read-back

v1/legacy: `groundTruth.environment { temperatureDegC humidityPercentRh
pressureKPa }` was queryable on `/world`. v2: the `Environment` type
and the `setEnvironment` mutation exist, but **no query exposes the
environment** — not on `Query`, not on `WorldState`, not on
`GroundTruth`. The gas twin kept `environmentalContext` on `/twin`;
the lc500 has it nowhere.

Consumer impact: the smart repo's practice flows and acceptance legs
can SET conditions but never VERIFY them — a teaching flow that says
"now at 40 °C" cannot show the 40 °C. The smart-side client
(`sim-client.ts`) marks the field optional with a pointer here until
the surface lands.

**Ask:** expose the environment (any of: `Query.environment`,
`WorldState.environment`, or back on `GroundTruth`) — or, if the
omission is deliberate (conditions observable only through physics),
a normative line in specs/10 saying so, so consumers design against
the decision instead of the silence.

## Gap 2 — the warm-up arc is unreachable

v1/legacy: boot started at `warming`; `advanceTime` past the warm-up
tau transitioned to `ready`. v2: boot and `reset` both land straight
on `ready` — `warming` remains in the kind's `operationalState()`
union (`sst-r60/interface.d.ts`) and `warm_up_tau_s` in the
coefficients, but no path enters it.

Consumer impact: warm-up is real R 60 behavior (instruments under
power-on stabilization drift measurably); the legacy legs taught and
tested it. The smart-side streaming leg now proves transitions via
injectFault/clearFault instead — but the off→warming→ready arc is a
behavior the kind interface still advertises and nothing can reach.

**Ask:** either start the kind's state machine at `warming` per
`warm_up_tau_s` (with `reset` returning there), or declare boot-is-
stabilized normatively in specs/10 and drop `warming` from the union
so the interface stops promising a state it can't enter.

## Gap 3 — the mechanical stage does not integrate (strain = 0, creep never develops)

Found by the behavioral legs (behavior-probe's CREEP-CELL and the
sim acceptance's creep phase — the two legs whose whole job is creep
physics). Direct probes against a live v2 lc500 (both the `fresh` and
`creep-fail` samples):

```
mutation { placeLoad(massKg: 450) { clock } }
mutation { advanceTime(seconds: 900) { clock } }
→ /twin indication: 450.05 kg            (no creep; creep-fail expects ≈ 451.8)
→ /world groundTruth: { appliedLoadKg: 450, strainMm: 0 }   ← the tell
```

The strain is zero UNDER LOAD — the mechanical stage (strain,
hysteresis, creep, resonance — `stages/composer.ts`'s own list) is not
integrating into the served indication. The creep-fail sample's
overrides (`creep_coefficient: 0.004`, `creep_tau_s: 120` — the keys
match `coefficients.yaml` and `behavior.ts`'s mapping) make no
difference, so this is below the sample-override layer: the stage
itself appears unwired in the data-driven boot. (The reads-0-under-
load fix, ed86725, restored the ELASTIC indication; the time-domain
stages did not come with it.)

Consumer impact: every creep/drift leg on the smart side is
skip-guarded on this gap (named in the suites) — the behavioral
fidelity class has no physics to judge until it lands.

**Ask:** wire the mechanical stage's integration in the data-driven
boot (the probe above is the acceptance: strain ≠ 0 under load; the
creep-fail sample creeps ≈ coefficient × load × (1 − e^(−t/τ))).

## Not gaps (documented here so consumers find the map once)

- **Runtime `scenario(name:)` → boot-time samples** (`run <instance>
  <port> <sample>`): deliberate (custody); consumers reboot to change
  physics. Adapted smart-side.
- **Fidelity scenarios (`lying-twin`, `stale-twin`) → `setFidelity(
  servedOffsetKg, servedLagS)` + `fidelityReset`**: deliberate (twin
  fidelity is runtime, physics is boot). Adapted smart-side.
- **`clockS` → `worldState.clock`**: a rename; mapped at the
  smart-side seam.
