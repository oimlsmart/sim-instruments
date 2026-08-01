# 04 — The composite session runtime

**Priority:** P1 · **Size:** medium-large · **Depends on:** 03 ·
**Report back to:** oimlsmart/smart TODO.integration/15

## Context

The heart of the work: `primmel-sst run packages/instances/
acme-cgm-system` boots ONE process — components as in-process
sessions, one `/twin`, one `/world` — per specs/13 §2–§4 and §6.
Everything the smart repo's acceptance drives (§7) is specified
there; this file is the checklist, not the contract.

## Deliverables (each is a specs/13 section — implement against it)

1. **The in-process component boot** (§2): each component instance
   loads and boots as a session object (no ports, no HTTP) held by
   the composite; boot order component-then-composite; a component
   conformance failure fails the composite boot with the component's
   error wrapped (`composite component analyzer: …`).
2. **The twin delegation** (§3): the composite `/twin` schema exposes
   exactly the decomposition keys + `operationalState`; each read
   delegates in-process and returns the component's own `servedAt` /
   freshness metadata; a component read failure is that register's
   `unavailable` — never a silent zero, never fatal to siblings.
   The merged watch/stream: one ordered stream, register ids on every
   frame.
3. **The world fan-out** (§3): both mutation shapes
   (`component(id: "…") { … }` and `<component_id> { … }`);
   single-match unscoped delegation; ambiguous unscoped mutations
   rejected with the ambiguity named.
4. **The coupling** (§3): per tick, the sampling line's
   `outlet_composition` feeds the analyzer's `inlet_composition` —
   declared in the kind packages (02), computed by the runtime.
5. **The state rule registry** (§4): the closed rule set with
   `any_fault_else_analyzer` implemented (fault if ANY component
   faults, else the named component's state), computed per tick,
   served as `operationalState`, stamped on every frame. Registry,
   never package-authored code.
6. **Startup conformance** (§6): decomposition values resolve to real
   component serves; every register the composite contract requires
   is decomposed; the state rule names a registered rule + an
   existing component — failures are boot errors naming the
   declaration.
7. Runtime tests at the established level: the §7 legs as YOUR tests
   too (the smart suite is the cross-repo judge; yours is the fast
   local proof).

## Acceptance criteria

- `primmel-sst run packages/instances/acme-cgm-system <port>` boots;
  the §7 legs pass against it from your own tests;
- the repo suite stays green (no regressions in single-instance
  sessions — the composite is additive, specs/08).

## Report back

The commit ids + the boot log + your §7 test output. Then [05](05-acceptance-handshake.md).
