// twin-schema.ts — the SMART digital twin interface, GENERATED from
// the serve contract (law 2: never hand-written). spec §6.
//
// Generation is total: every declared serve gets a schema field AND a
// resolver. The core registers (indication, state, environmental_context)
// bind to the instrument's legal view; any further serve target
// (a multi-component instrument's indication_co / indication_nox …)
// binds to a register reader supplied by the caller — a declared serve
// the instrument cannot answer fails generation loudly.
import { createSchema } from 'graphql-yoga'
import type { GraphQLSchema } from 'graphql'
import type { VirtualClock } from './time.js'
import type { Qty } from './physics/quantity.js'
import type { Environment } from './instrument.js'
import type { TwinContract, TwinOperation } from './twin-contract.js'

/** The instrument's legal view — what a real instrument could legally
 *  answer (law 1). Any instrument family satisfying this shape can host
 *  a generated /twin. */
export interface TwinInstrumentView {
  indication(): Qty
  servedAt(): number
  operationalState(): string
  environment(): Environment
}

/** What the generated resolvers bind to (the instrument's legal view). */
export interface TwinIo {
  instrument: TwinInstrumentView
  clock: VirtualClock
  /** register readers for serve targets beyond the core three — keyed
   *  by serve target id (e.g. indication_co). Generation fails when a
   *  declared serve has no reader. */
  registers?: Record<string, () => unknown>
  /** instrument-legal command implementations, keyed by operation id —
   *  invoked by the generated Mutation before answering the state. */
  operations?: Record<string, () => void>
}

const BASE_TYPES = /* GraphQL */ `
  type ServedQuantity { value: Float!, unit: String!, kind: String!, servedAt: Float! }
  type Environment { temperatureDegC: Float!, humidityPercentRh: Float!, pressureKPa: Float! }
  type OpResult { state: String! }
`

/** The resolver for one serve target: the core registers read the
 *  instrument's legal view; anything further needs a caller-supplied
 *  register reader (generation is total — never silently dropped). */
function readerFor(target: string, io: TwinIo): () => unknown {
  if (target === 'indication') {
    return () => {
      const q = io.instrument.indication()
      return { value: q.value, unit: q.unit, kind: q.kind, servedAt: io.instrument.servedAt() }
    }
  }
  if (target === 'state') return () => io.instrument.operationalState()
  if (target === 'environmental_context') return () => io.instrument.environment()
  const reader = io.registers?.[target]
  if (!reader) throw new Error(`no twin register reader for serve target '${target}' — the instrument cannot answer a declared serve (law 2)`)
  return reader
}

/** Map a serve target to its schema field (Query vs Subscription via
 *  the operation kind). Unknown targets are Query fields of
 *  ServedQuantity (the register default) — generation is total
 *  (never drops a serve). */
export function generateTwinSchema(contract: TwinContract, io: TwinIo): GraphQLSchema {
  const opKind = new Map(contract.operations.map((o: TwinOperation) => [o.id, o.kind]))

  const queryFields: string[] = []
  const mutationFields: string[] = []
  const subscriptionFields: string[] = []

  for (const serve of contract.serves) {
    const kind = opKind.get(serve.via) ?? 'query'
    const field = serve.target === 'environmental_context' ? 'environmentalContext' : serve.target
    const gqlType = serve.target === 'indication' ? 'ServedQuantity!'
      : serve.target === 'state' ? 'String!'
      : serve.target === 'environmental_context' ? 'Environment!'
      : 'ServedQuantity!'
    // watch-kind serves answer BOTH a point Query (monitors poll) and
    // a Subscription (the watch) — a real twin's posture.
    queryFields.push(`${snakeToCamel(field)}: ${gqlType}`)
    if (kind === 'watch') subscriptionFields.push(`${snakeToCamel(field)}: ${gqlType}`)
  }
  for (const op of contract.operations) {
    if (op.kind === 'command') mutationFields.push(`${snakeToCamel(op.id)}: OpResult!`)
  }

  const typeDefs = /* GraphQL */ `
    ${BASE_TYPES}
    type Query { ${queryFields.join(' ') || '_empty: String'} }
    ${mutationFields.length ? `type Mutation { ${mutationFields.join(' ')} }` : ''}
    ${subscriptionFields.length ? `type Subscription { ${subscriptionFields.join(' ')} }` : ''}
  `

  const queryResolvers: Record<string, unknown> = {}
  for (const serve of contract.serves) {
    const field = serve.target === 'environmental_context' ? 'environmentalContext' : snakeToCamel(serve.target)
    queryResolvers[field] = readerFor(serve.target, io)
  }
  const mutationResolvers: Record<string, () => { state: string }> = {}
  for (const op of contract.operations) {
    if (op.kind !== 'command') continue
    const name = snakeToCamel(op.id)
    // the caller's instrument-legal implementation runs first (v1:
    // default is the state answer only; the behavior registry wires
    // richer does-behaviors as they land).
    const invoke = io.operations?.[op.id]
    mutationResolvers[name] = () => {
      invoke?.()
      return { state: io.instrument.operationalState() }
    }
  }

  return createSchema({
    typeDefs,
    resolvers: {
      Query: queryResolvers,
      ...(mutationFields.length ? { Mutation: mutationResolvers } : {}),
      ...(subscriptionFields.length ? { Subscription: subscriptionResolvers(contract, io) } : {}),
    },
  })
}

/** Watch-kind serves stream over SSE: the current value at subscribe,
 *  then the value on every clock advance, deduped. The stream's
 *  cancellation removes the clock listener. */
function subscriptionResolvers(contract: TwinContract, io: TwinIo): Record<string, { subscribe: () => AsyncIterableIterator<unknown>; resolve: (payload: unknown) => unknown }> {
  const out: Record<string, { subscribe: () => AsyncIterableIterator<unknown>; resolve: (payload: unknown) => unknown }> = {}
  for (const serve of contract.serves) {
    const kind = contract.operations.find(o => o.id === serve.via)?.kind ?? 'query'
    if (kind !== 'watch') continue
    const field = serve.target === 'environmental_context' ? 'environmentalContext' : snakeToCamel(serve.target)
    const read = readerFor(serve.target, io)
    out[field] = { subscribe: () => watchStream(io.clock, read), resolve: payload => payload }
  }
  return out
}

/** An AsyncIterable of watch events: emits the current value
 *  immediately, then on every clock advance (deduped by JSON
 *  identity). */
function watchStream<T>(clock: VirtualClock, read: () => T): AsyncIterableIterator<T> {
  const queue: T[] = [read()]
  let last = JSON.stringify(queue[0])
  let notify: (() => void) | undefined
  let done = false
  const off = clock.onAdvance(() => {
    const v = read()
    const key = JSON.stringify(v)
    if (key === last) return
    last = key
    queue.push(v)
    notify?.()
  })
  const self: AsyncIterableIterator<T> = {
    [Symbol.asyncIterator]() { return self },
    next(): Promise<IteratorResult<T>> {
      if (queue.length) return Promise.resolve({ value: queue.shift()!, done: false })
      if (done) return Promise.resolve({ value: undefined as never, done: true })
      return new Promise(resolve => {
        notify = () => { notify = undefined; resolve(self.next()) }
      })
    },
    return(): Promise<IteratorResult<T>> {
      done = true
      off()
      notify?.()
      return Promise.resolve({ value: undefined as never, done: true })
    },
    throw(e?: unknown): Promise<IteratorResult<T>> {
      done = true
      off()
      return Promise.reject(e instanceof Error ? e : new Error(String(e)))
    },
  }
  return self
}

export function snakeToCamel(id: string): string {
  return id.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}
