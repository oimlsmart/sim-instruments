# 00 — The integration work orders (from oimlsmart/smart) — master overview

**From:** `oimlsmart/smart` TODO.integration (the integration series,
complete on our side) · **For:** the SST repo owner · **Read first:**
[`specs/13-composite-session.md`](../specs/13-composite-session.md)

## Why this series exists

The SMART platform's side of the composite-twin integration is landed
and gated: the Primmel composite package
(`smart/primmel-packages/acme-cgm-system/`, kernel rules C100–C102),
the composition calculus + composite runtime binding
(`smart/browser/src/twin-cert/`, model-side green), the joint session
spec (specs/13, in THIS repo), and two armed judges that wait for the
runtime:

1. **The live composite acceptance** —
   `smart/browser/src/__tests__/composite-sst-acceptance.test.ts`,
   skip-guarded on `packages/instances/acme-cgm-system` existing here.
   The day it boots, three legs judge the contract: the decomposed
   register set, the sampling-line → analyzer coupling, the
   `any_fault_else_analyzer` state rule.
2. **The boundary check** —
   `smart/scripts/sst-split/check-boundary.sh` (runs anywhere; names
   every framework → instruments import). Today it counts 6 violations
   in two boot strategies; the repo split (smart TODO.integration/24,
   tooling + runbook already proven by dry-run) executes the day this
   reads clean.

This series is your work orders. Each item names its judging test and
the artifact to report back. When 05 is satisfied, the full chain —
composite boot, the repo split, the Twin Lab's live composite
certification — closes.

## The items

| # | Item | Judged by | Independent? |
|---|---|---|---|
| [01](01-kind-boot-registry.md) | the kind-registry boot move (r91/r129) | check-boundary.sh clean | yes — start here or in parallel |
| [02](02-sampling-line-kind.md) | the sampling-line kind + instance | its own unit tests (new) | yes |
| [03](03-composite-package.md) | the composite package + loader + schema | `primmel-sst validate` on the composite | needs 02 |
| [04](04-composite-runtime-boot.md) | the composite session runtime | the runtime's own new tests | needs 03 |
| [05](05-acceptance-handshake.md) | the acceptance + the report-back | smart's armed suite, live | needs 04 |

## The report-back contract

Reply (PR comment, issue, or commit message referencing
`oimlsmart/smart` TODO.integration/15 + 24) with:

- the outputs of the two proof commands in [05](05-acceptance-handshake.md);
- the commit ids of each landed item;
- any spec deviations you needed (specs/13 is normative-target — if a
  detail proved wrong in implementation, say so and we amend the spec
  together; do not silently diverge — the acceptance suite judges the
  spec, and a silent divergence reads as a failure, not a discussion).

Our side on your report: un-skip nothing (the suites arm themselves —
your package landing IS the trigger), run the full integration
manifest, and execute the repo split (24's RUNBOOK) the same day the
boundary check is clean.
