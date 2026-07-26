// conformance.ts — the startup conformance gate (law 2): the served
// schema ≡ the contract's serve declarations ≡ (upstream) the mapped
// promises. A diff fails the process — the twin can never drift.
// NOTE: no 'graphql' import — direct type-map access is realm-agnostic
// (the ESM/CJS facade can dual-instance the graphql package under tsx).
import type { GraphQLSchema } from 'graphql'
import type { TwinContract } from './twin-contract.js'
import { snakeToCamel } from './twin-schema.js'

/** Compare a schema against its contract: every serve has a schema
 *  member (Query/Subscription per operation kind), every command op a
 *  Mutation, and the schema carries no undeclared twin fields
 *  (base types + introspection excluded). Returns the diff lines
 *  (empty = conformant). */
export function checkTwinConformance(schema: GraphQLSchema, contract: TwinContract): string[] {
  const queryFields = new Set(Object.keys(schema.getQueryType()?.getFields() ?? {}))
  const mutationFields = new Set(Object.keys(schema.getMutationType()?.getFields() ?? {}))
  const subscriptionFields = new Set(Object.keys(schema.getSubscriptionType()?.getFields() ?? {}))
  const opKind = new Map(contract.operations.map(o => [o.id, o.kind]))

  const diffs: string[] = []
  for (const serve of contract.serves) {
    const kind = opKind.get(serve.via) ?? 'query'
    const field = serve.target === 'environmental_context' ? 'environmentalContext' : snakeToCamel(serve.target)
    const present = kind === 'watch'
      ? subscriptionFields.has(field) && queryFields.has(field)
      : queryFields.has(field)
    if (!present) {
      const where = kind === 'watch' ? 'Query AND Subscription' : 'Query'
      diffs.push(`serve '${serve.target}' (via ${serve.via}) needs field '${field}' on ${where} — not found`)
    }
  }
  for (const op of contract.operations) {
    if (op.kind === 'command' && !mutationFields.has(snakeToCamel(op.id))) {
      diffs.push(`command operation '${op.id}' has no Mutation field '${snakeToCamel(op.id)}' in the schema`)
    }
  }

  const declaredQuery = new Set(contract.serves.map(sv => sv.target === 'environmental_context' ? 'environmentalContext' : snakeToCamel(sv.target)))
  for (const f of queryFields) {
    if (!declaredQuery.has(f) && f !== '_empty') diffs.push(`schema Query field '${f}' is not a declared serve of the contract`)
  }
  return diffs
}
