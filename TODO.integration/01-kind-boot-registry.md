# 01 — The kind-registry boot move (the split's pre-req)

**Priority:** P1 · **Size:** small-medium · **Independent of 02–05** ·
**Report back to:** oimlsmart/smart TODO.integration/24

## Context

The runtime's kind boot strategies for R 91 and R 129 import the
legacy family sims directly:

- `packages/runtime/sst-runtime/src/kinds/boot-strategy-r91.ts` → `@sim/r91` (3 imports)
- `packages/runtime/sst-runtime/src/kinds/boot-strategy-r129.ts` → `@sim/md` (3 imports)

This is the "mid-rewire" state specs/05 already names: R 60 and R 144
boot through pure kind packages (`packages/kinds/sst-r60`,
`sst-r144`) registered in the kind registry; R 91 and R 129 never got
the same treatment. It is the ONLY framework → instruments coupling —
and it blocks the repo split (a framework repo cannot depend on the
instrument library it hosts).

## Deliverables

1. `packages/kinds/sst-r91` and `packages/kinds/sst-r129` register
   their own boot strategies through the kind registry — the same
   shape `sst-r60`/`sst-r144` already use (read those two first; the
   pattern is established, this is application, not invention).
2. The legacy imports in the two boot-strategy files disappear; the
   strategies either move into the kind packages wholesale or shrink
   to registry wiring with the physics living in the kind package.
3. The legacy family packages (`packages/r91`, `packages/md`) remain
   for the legacy bins — untouched; this is about where the
   sst-runtime's boot path points, never about deleting the legacy
   path (the smart repo's sim-bin prefers sst-runtime but falls back
   to legacy bins by design).

## Acceptance criteria

```
# from anywhere (the check is self-contained):
~/src/oimlsmart/smart/scripts/sst-split/check-boundary.sh <this repo>
# → check-boundary: clean — no framework file imports @sim/*
```

- Your own suite green end to end (`npm test` at the repo root), with
  the r91/md instance boots (`primmel-sst run packages/instances/
  acme-rs180`, `acme-md3xx`) serving the same twin behavior as before
  the move (the kind packages' existing behavior tests are the proof;
  add none you don't need, change none you don't have to).

## Report back

The check-boundary output + the commit ids + one line per moved
strategy (what moved, what the registry entry is). We then execute
the split the same day (RUNBOOK in
`smart/scripts/sst-split/RUNBOOK.md` — already dry-run-proven).
