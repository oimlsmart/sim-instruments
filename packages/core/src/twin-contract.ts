// twin-contract.ts — the normalized serve contract (spec §6): the
// shape the twin schema generates from. Deliberately primmel-free —
// the .prl adapter (twin-contract-prl.ts, build-time) produces this.

export interface ServeDeclaration {
  /** the served register id: 'indication' | 'state' | 'environmental_context' | … */
  target: string
  /** the serving operation id: 'get_indication' | 'watch_state' | … */
  via: string
  /** freshness bound in seconds (fresh_within). */
  freshWithinS?: number
}

export interface TwinOperation {
  /** instrument-legal operation id: 'zero_setting' | 'self_test' | … */
  id: string
  kind: 'query' | 'watch' | 'command'
}

export interface TwinContract {
  instrumentId: string
  serves: ServeDeclaration[]
  operations: TwinOperation[]
}

/** The LC-500 contract (from primmel-packages/acme-lc500/model/lc500.prl:
 *  get_indication (query, serves indication); watch_state (subscribe,
 *  serves state + environmental_context); run_self_test (invoke, does
 *  self_test); serve … fresh_within 5s / 1s). Kept as the canonical
 *  fixture; the .prl adapter test asserts the real package parses to
 *  exactly this. */
export const LC500_CONTRACT: TwinContract = {
  instrumentId: 'acme-lc500',
  serves: [
    { target: 'indication', via: 'get_indication', freshWithinS: 5 },
    { target: 'state', via: 'watch_state', freshWithinS: 1 },
    { target: 'environmental_context', via: 'watch_state', freshWithinS: 1 },
  ],
  operations: [
    { id: 'get_indication', kind: 'query' },
    { id: 'watch_state', kind: 'watch' },
    { id: 'run_self_test', kind: 'command' },
  ],
}

/** The R 144 reference-CGM contract — the DECLARED intended serves
 *  (the SIM-R144-2 product reference package has not landed yet; when
 *  it does, the .prl adapter test asserts the real package parses to
 *  exactly this — the LC500_CONTRACT precedent). A dual-component CGM
 *  serves one indication register per component; zero/span calibration
 *  are the R 144-1, 4.8 semi-automatic adjustment means, instrument-
 *  legal operations. */
export const GAS_ANALYZER_CONTRACT: TwinContract = {
  instrumentId: 'ref-cgm',
  serves: [
    { target: 'indication_co', via: 'get_indication', freshWithinS: 5 },
    { target: 'indication_nox', via: 'get_indication', freshWithinS: 5 },
    { target: 'state', via: 'watch_state', freshWithinS: 1 },
    { target: 'environmental_context', via: 'watch_state', freshWithinS: 1 },
  ],
  operations: [
    { id: 'get_indication', kind: 'query' },
    { id: 'watch_state', kind: 'watch' },
    { id: 'zero_calibration', kind: 'command' },
    { id: 'span_calibration', kind: 'command' },
    { id: 'run_self_test', kind: 'command' },
  ],
}
