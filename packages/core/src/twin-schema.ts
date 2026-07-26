// twin-schema.ts — the SMART digital twin interface, GENERATED from
// the serve contract (law 2: never hand-written). spec §6.
import { createSchema } from 'graphql-yoga'
import type { GraphQLSchema } from 'graphql'
import type { VirtualClock } from './time.js'
import type { SimulatedInstrument } from './instrument.js'
import type { TwinContract, TwinOperation } from './twin-contract.js'

/** What the generated resolvers bind to (the instrument's legal view). */
export interface TwinIo {
  instrument: SimulatedInstrument
  clock: VirtualClock
}

const BASE_TYPES = /* GraphQL */ `
  type ServedQuantity { value: Float!, unit: String!, kind: String!, servedAt: Float! }
  type Environment { temperatureDegC: Float!, humidityPercentRh: Float!, pressureKPa: Float! }
  type OpResult { state: String! }
`

/** Map a serve target to its schema field (Query vs Subscription via
 *  the operation kind). Unknown targets are Query fields of
 *  ServedQuantity (the register default) and recorded for the
 *  conformance check — generation is total (never drops a serve). */
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

  const queryResolvers: Record<string, unknown> = {
    indication: () => {
      const q = io.instrument.indication()
      return { value: q.value, unit: q.unit, kind: q.kind, servedAt: io.instrument.servedAt() }
    },
    state: () => io.instrument.operationalState(),
    environmentalContext: () => io.instrument.groundTruth().environment,
  }
  const mutationResolvers: Record<string, () => { state: string }> = {}
  for (const op of contract.operations) {
    if (op.kind !== 'command') continue
    const name = snakeToCamel(op.id)
    if (op.id === 'zero_setting') mutationResolvers[name] = () => { io.instrument.removeLoad(); return { state: io.instrument.operationalState() } }
    else if (op.id === 'self_test') mutationResolvers[name] = () => ({ state: io.instrument.operationalState() })
    else mutationResolvers[name] = () => ({ state: io.instrument.operationalState() })
  }

  return createSchema({
    typeDefs,
    resolvers: {
      Query: queryResolvers,
      ...(mutationFields.length ? { Mutation: mutationResolvers } : {}),
    },
  })
}

export function snakeToCamel(id: string): string {
  return id.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}
