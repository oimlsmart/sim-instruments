# 03 — The composite package + the loader leg

**Priority:** P1 · **Size:** medium · **Depends on:** 02 ·
**Report back to:** oimlsmart/smart TODO.integration/15

## Context

specs/13 §1 defines the composite package: an instance-tier package
whose manifest carries `composition` (components + decomposition +
state rule) instead of a single `kind`. The loader must accept it,
validate it against a schema, and expose the composition to the boot
path (04 builds the session; this item is the package + the loading).

The authoritative semantics (the Primmel bridge, specs/13 §5) live in
`smart/primmel-packages/acme-cgm-system/payload/composition.yaml` —
the SST manifest is its projection. Use the SAME register names the
smart repo's acceptance queries (specs/13 §7): `indicationCo`,
`indicationNox`, `state`, `environmentalContext`, `sampleFlow`,
`samplePressure`, `sampleTemperature`, `operationalState`.

## Deliverables

1. **The schema** `specs/schemas/composite-package.schema.json`
   (specs/13 §5 shape leg): composition required with exactly the
   §1 keys; decomposition total (every composite register sourced
   exactly once); state rule in the closed registry set; component
   instance paths resolvable.
2. **The loader leg** (`packages/runtime/sst-runtime/src/
   package-loader.ts`): manifests with `composition` load as
   composite packages — `validate` accepts them, the loaded shape
   carries components + decomposition + state rule to the boot path.
3. **The package** `packages/instances/acme-cgm-system/
   package.sst.yaml` — the projection of the Primmel composite,
   components `analyzer` (→ `../acme-cgm-200`) and `sampling_line`
   (→ `../acme-cgm-sampling-line`), the §1 decomposition block,
   `state_rule: any_fault_else_analyzer`.
4. Loader tests: a valid composite loads; each schema violation
   class fails with the violation named (untotal decomposition,
   unknown state rule, unresolvable component path).

## Acceptance criteria

```
npx tsx packages/runtime/sst-runtime/src/bin.ts validate packages/instances/acme-cgm-system
# → ✓ acme-cgm-system (primmel-instance) — composite: 2 components, 8 registers
```

- The loader tests pass; the repo suite stays green.

## Report back

The validate output + the commit ids + any schema-field renames you
needed (we mirror them into specs/13 and the acceptance the same
day — the register names are the contract, rename nothing without
saying so).
