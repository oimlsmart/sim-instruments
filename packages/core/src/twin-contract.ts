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

/** The CGM-200 contract — from primmel-packages/acme-cgm-200
 *  (model/cgm200.prl: the cgm_api endpoint with per-component
 *  get_indication_co / get_indication_nox queries; watch_op_state
 *  subscribing state + environmental_context; zero/span calibration
 *  and run_self_check invokes; serves fresh_within 5s / 1s). The
 *  package is the SSOT — this fixture mirrors it for the package-less
 *  standalone posture, and the .prl adapter handshake test
 *  (gas-twin.test.ts) asserts the real package parses to exactly
 *  this (the LC500_CONTRACT precedent). A dual-component CGM serves
 *  one indication register per component; zero/span calibration are
 *  the R 144-1, 4.8 semi-automatic adjustment means, instrument-
 *  legal operations. */
export const GAS_ANALYZER_CONTRACT: TwinContract = {
  instrumentId: 'acme-cgm-200',
  serves: [
    { target: 'indication_co', via: 'get_indication_co', freshWithinS: 5 },
    { target: 'indication_nox', via: 'get_indication_nox', freshWithinS: 5 },
    { target: 'state', via: 'watch_op_state', freshWithinS: 1 },
    { target: 'environmental_context', via: 'watch_op_state', freshWithinS: 1 },
  ],
  operations: [
    { id: 'get_indication_co', kind: 'query' },
    { id: 'get_indication_nox', kind: 'query' },
    { id: 'watch_op_state', kind: 'watch' },
    { id: 'zero_calibration', kind: 'command' },
    { id: 'span_calibration', kind: 'command' },
    { id: 'run_self_check', kind: 'command' },
  ],
}
