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
 *  serve indication via get_indication { fresh_within 5s };
 *  serve state, environmental_context via watch_state { fresh_within 1s }).
 *  Kept as the canonical fixture; the .prl adapter test asserts the
 *  real package parses to exactly this. */
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
    { id: 'zero_setting', kind: 'command' },
    { id: 'self_test', kind: 'command' },
  ],
}
