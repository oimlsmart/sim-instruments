# 02 — The sampling-line kind + instance

**Priority:** P1 · **Size:** medium · **Depends on:** nothing (start
with 01 in parallel) · **Report back to:** oimlsmart/smart
TODO.integration/15

## Context

The composite session (specs/13) composes the analyzer
(`packages/instances/acme-cgm-200`, exists) with its **sampling
line** — the physical chain (probe, pump, conditioning) that
transports the gas sample to the analyzer. Real continuous gas
monitoring systems fail here as often as at the analyzer: flow
restrictions, leaks, condensation, transport lag. The composite's
whole point is modeling the SYSTEM; the sampling line is the missing
component.

The full contract is specs/13 §1 (third block) + §3 (the coupling) —
read it before writing a line.

## Deliverables

1. **The kind package** `packages/kinds/sst-sampling-line` (additive
   per specs/08 — no existing file changes):
   - stages: transport delay, dilution, line losses (the physics
     declared in the kind, coefficients in the instance);
   - world handlers: `setFlowRate(lPerMin)`, `setLineTemperature(degC)`,
     `introduceLeak(fraction)`;
   - serves: `sampleFlow`, `linePressure`, `gasTemperature`,
     `transportDelayS`;
   - **the interlock fault rule**: flow below the declared minimum
     faults the line (this is what the composite state rule reads —
     specs/13 §4's acceptance leg drives it);
   - the coupling declaration: the line's `outlet_composition` feeds
     the analyzer kind's `inlet_composition` (specs/13 §3 — declared
     in the kind packages, computed by the runtime per tick).
2. **The instance** `packages/instances/acme-cgm-sampling-line` — the
   ACME CGM-200 system's sampling line (coefficients: nominal flow
     1.5 L/min matching the analyzer's `sample_flow_l_min` design
     parameter, the minimum-flow interlock threshold, transport
     delay on the order of seconds, samples: healthy / restricted
     filter / leaking probe).
3. Unit tests at the level the existing kinds carry: boot, serves
   respond, the world verbs move the physics, the interlock faults
   and recovers.

## Acceptance criteria

- `primmel-sst run packages/instances/acme-cgm-sampling-line` boots
  standalone (every component of a composite must also boot alone —
  specs/13 §2);
- the new tests pass; the repo suite stays green.

## Report back

The commit ids + the standalone boot log (one serving of each serve).
