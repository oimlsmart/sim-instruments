# The packages directory — grouped by tier

```
packages/
  base/                          Tier 1 — OIML SST base packages
    sst-oiml-base/                   D 11 environmental conditions

  kinds/                         Tier 2 — OIML SST kind packages (one per OIML Recommendation)
    sst-r60/                         load cells (R 60) — fully authored
    sst-r91/                         radar speed meters (R 91) — stub
    sst-r129/                        multi-dimensional dimensioners (R 129) — stub
    sst-r144/                        continuous gas monitors (R 144) — stub

  instances/                     Tier 3 — Primmel SST instance packages (one per instrument model)
    acme-lc500/                      ACME LC-500 load cell — fully authored
    acme-rs180/                      ACME RS-180 radar — stub
    acme-md3xx/                      ACME MD-300 dimensioner — stub
    acme-cgm-200/                    ACME CGM-200 gas analyzer — stub

  runtime/                       SST runtime (Phase 3 — pending)
  shell/                         SST shell  (Phase 4 — pending)

  # Legacy pre-SST packages — kept in place during the migration window (Phase 9)
  core/                          @primmel/sst-runtime (the runtime-to-be)
  lc500/                         @sim/lc500 (folds into instances/acme-lc500 + kinds/sst-r60)
  lc500/bench/                   @sim/bench (becomes @primmel/sst-bench in Phase 6)
  r91/                           @sim/r91   (folds into instances/acme-rs180 + kinds/sst-r91)
  md/                            @sim/md    (folds into instances/acme-md3xx + kinds/sst-r129)
  gas-analyzer/                  @sim/gas-analyzer (folds into instances/acme-cgm-200 + kinds/sst-r144)
```

## Tier responsibilities

| Tier | What it owns | Examples |
|---|---|---|
| **base** | Passive environmental conditions (D 11 §2) — influence + disturbance classes, severity tables, chamber time-programs | D 11 base (climatic, mechanical, EMC) |
| **kind** | Active-domain vocabulary, classification axes, MPE envelopes, physics-stage template, the TypeScript interface every instance must satisfy | R 60, R 91, R 129, R 144 |
| **instance** | Manufacturer/model, classification values, design parameters, physics coefficients, sample variants, **bundled behavior.js**, **glTF 3D model** | ACME LC-500, ACME RS-180, ACME MD-300, ACME CGM-200 |
| **runtime** | The kind-agnostic loader: ZIP→validated package, behavior.js interface check, kind-interface registry, physics-stage registry, /twin + /world schema composition | `@primmel/sst-runtime` |
| **shell** | The web UI host: kinds gallery → instances gallery → session view (the bench); upload-a-package | `@primmel/sst-shell`, `@primmel/sst-bench` |

## Composition rule

A running SST session loads **exactly one instance package**, which references **exactly one kind package**, which references **exactly one base package**. The runtime composes the three into a single HTTP server with `/twin`, `/world`, and `/` (the bench).

Adding a new instance of an existing kind = authoring one directory under `instances/` (zero code changes anywhere).
Adding a new kind = authoring one directory under `kinds/` + one entry in the runtime's kind-interface registry (zero edits to other kinds).
Updating D 11 = authoring new conditions under `base/sst-oiml-base/` (zero changes to kinds or instances).
