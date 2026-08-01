# The packages directory — grouped by tier (v2)

```
packages/
  base/                          Tier 1 — OIML SST base packages
    sst-oiml-base/                   D 11 environmental conditions (35 classes)

  kinds/                         Tier 2 — OIML SST kind packages (one per OIML Recommendation)
    sst-r60/                         load cells (R 60) — production
    sst-r91/                         radar speed meters (R 91) — production
    sst-r129/                        multi-dimensional dimensioners (R 129) — production
    sst-r144/                        continuous gas monitors (R 144) — production

  instances/                     Tier 3 — Primmel SST instance packages (one per instrument model)
    acme-lc500/                      ACME LC-500 load cell
    acme-rs180/                      ACME RS-180 radar
    acme-md3xx/                      ACME MD-300 dimensioner
    acme-cgm-200/                    ACME CGM-200 gas analyzer

  runtime/                       The framework (kind-agnostic)
    sst-runtime/                     @primmel/sst-runtime — the universal boot + the physics library
    sst-gltf/                        @primmel/sst-gltf — the glTF 2.0 loader

  shell/                         The UI host + the bench SPA
    sst-shell/                       @primmel/sst-shell — gallery + upload + session tabs (Astro + Vue)
    sst-bench/                       @primmel/sst-bench — the running-instrument view (terminal + WebGL2 + dial)
```

## Tier responsibilities

| Tier | What it owns | Examples |
|---|---|---|
| **base** | Passive environmental conditions (D 11 §2) — influence + disturbance classes, severity tables, chamber time-programs | D 11 base (climatic, mechanical, EMC) |
| **kind** | Active-domain vocabulary, classification axes, MPE envelopes, physics-stage template, the TypeScript interface every instance must satisfy, the baked twin contract | R 60, R 91, R 129, R 144 |
| **instance** | Manufacturer/model, classification values, design parameters, physics coefficients, sample variants, **bundled behavior.js**, **glTF 3D model** | ACME LC-500, ACME RS-180, ACME MD-300, ACME CGM-200 |
| **runtime** | The kind-agnostic loader: ZIP→validated package, behavior.js interface check, kind-interface registry, physics-stage registry, /twin + /world schema composition | `@primmel/sst-runtime` |
| **shell** | The web UI host + the bench: kinds gallery → instances gallery → session view (the bench); upload-a-package | `@primmel/sst-shell`, `@primmel/sst-bench` |

## Composition rule

A running SST session loads **exactly one instance package**, which references **exactly one kind package**, which references **exactly one base package**. The runtime composes the three into a single HTTP server with `/twin`, `/world`, and `/` (the bench).

Adding a new instance of an existing kind = authoring one directory under `instances/` + bundling its behavior.js. Zero code changes anywhere.
Adding a new kind = authoring one directory under `kinds/` + baking its twin contract. Zero edits to the runtime.
Updating D 11 = authoring new conditions under `base/sst-oiml-base/`. Zero changes to kinds or instances.

## v2 — the legacy family packages are gone

The pre-SST family packages (`@sim/lc500`, `@sim/r91`, `@sim/md`,
`@sim/gas-analyzer`) and their bins are deleted. The instance
`behavior.js` files now bundle the runtime's physics library inline;
every instance is self-contained (loads from a directory checkout, an
uploaded ZIP, or any future deployment with zero node_modules
resolution). The bench SPA moved from `packages/lc500/bench/` to
`packages/shell/sst-bench/` and renamed `@sim/bench` →
`@primmel/sst-bench`.
