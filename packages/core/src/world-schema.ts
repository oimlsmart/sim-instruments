// world-schema.ts — the simulated-actions channel (spec §7): the
// out-of-band physical world. Certification software never uses this
// channel (the epistemic wall, law 1) — it is simulated reality.
import { createSchema } from 'graphql-yoga'
import type { GraphQLSchema } from 'graphql'
import type { VirtualClock } from './time.js'
import type { SimulatedInstrument, InstrumentDefinition, Environment } from './instrument.js'
import { SCENARIOS, getScenario } from './scenario.js'
import { D11_PROFILES, ProfilePlayer } from './environment/profiles.js'

/** The instrument lifecycle host: the schema mutates the world through
 *  this (the server owns the concrete instance; scenario() swaps it). */
export interface WorldContext {
  instrument: SimulatedInstrument
  clock: VirtualClock
  swap(def: InstrumentDefinition): void
  /** current D 11 profile player, if any (server-managed). */
  player?: ProfilePlayer | undefined
}

const typeDefs = /* GraphQL */ `
  type Environment { temperatureDegC: Float!, humidityPercentRh: Float!, pressureKPa: Float! }
  type GroundTruth {
    appliedLoadKg: Float!
    strainMm: Float!
    clockS: Float!
    spanDriftFraction: Float!
    thermalOffsetMVperV: Float!
    environment: Environment!
  }
  type WorldState { clock: Float!, mode: String!, groundTruth: GroundTruth! }
  type ScenarioInfo { name: String!, description: String! }
  type ProfileInfo { id: String!, standard: String! }
  input EnvironmentInput { temperatureDegC: Float, humidityPercentRh: Float, pressureKPa: Float }

  type Query {
    clock: Float!
    groundTruth: GroundTruth!
    worldState: WorldState!
    scenarios: [ScenarioInfo!]!
    profiles: [ProfileInfo!]!
  }

  type Mutation {
    placeLoad(massKg: Float!): WorldState!
    removeLoad: WorldState!
    setEnvironment(conditions: EnvironmentInput!): WorldState!
    playProfile(profile: String!): WorldState!
    advanceTime(seconds: Float!): WorldState!
    setClockMode(mode: String!): WorldState!
    scenario(name: String!): WorldState!
    setFidelity(servedOffsetKg: Float, servedLagS: Float): WorldState!
    setThermalHysteresis(perDegC: Float!, tauS: Float): WorldState!
    reset: WorldState!
  }
`

function worldState(ctx: WorldContext) {
  return { clock: ctx.clock.now(), mode: ctx.clock.mode(), groundTruth: ctx.instrument.groundTruth() }
}

export function buildWorldSchema(ctx: WorldContext): GraphQLSchema {
  return createSchema({
    typeDefs,
    resolvers: {
      Query: {
        clock: () => ctx.clock.now(),
        groundTruth: () => ctx.instrument.groundTruth(),
        worldState: () => worldState(ctx),
        scenarios: () => Object.values(SCENARIOS).map(s => ({ name: s.name, description: s.description })),
        profiles: () => Object.values(D11_PROFILES).map(p => ({ id: p.id, standard: p.standard })),
      },
      Mutation: {
        placeLoad: (_: unknown, args: { massKg: number }) => { ctx.instrument.setLoad(args.massKg); return worldState(ctx) },
        removeLoad: () => { ctx.instrument.removeLoad(); return worldState(ctx) },
        setEnvironment: (_: unknown, args: { conditions: Partial<Environment> }) => { ctx.instrument.setEnvironment(args.conditions); return worldState(ctx) },
        playProfile: (_: unknown, args: { profile: string }) => {
          const program = D11_PROFILES[args.profile]
          if (!program) throw new Error(`unknown profile '${args.profile}' (known: ${Object.keys(D11_PROFILES).join(', ')})`)
          ctx.player?.stop()
          ctx.player = new ProfilePlayer(program)
          ctx.player.start(ctx.clock, e => ctx.instrument.setEnvironment(e))
          return worldState(ctx)
        },
        advanceTime: (_: unknown, args: { seconds: number }) => { ctx.clock.advance(args.seconds); return worldState(ctx) },
        setClockMode: (_: unknown, args: { mode: string }) => {
          if (args.mode !== 'manual' && args.mode !== 'wall') throw new Error(`clock mode must be manual|wall, got '${args.mode}'`)
          ctx.clock.setMode(args.mode); return worldState(ctx)
        },
        scenario: (_: unknown, args: { name: string }) => { ctx.swap(getScenario(args.name)); return worldState(ctx) },
        setFidelity: (_: unknown, args: { servedOffsetKg?: number; servedLagS?: number }) => {
          const current = { servedOffsetKg: 0, servedLagS: 0 }
          ctx.instrument.setFidelity({
            servedOffsetKg: args.servedOffsetKg ?? current.servedOffsetKg,
            servedLagS: args.servedLagS ?? current.servedLagS,
          })
          return worldState(ctx)
        },
        setThermalHysteresis: (_: unknown, args: { perDegC: number; tauS?: number }) => {
          const current = ctx.instrument.thermalHysteresis
          ctx.instrument.setThermalHysteresis(args.perDegC, args.tauS ?? current.tauS)
          return worldState(ctx)
        },
        reset: () => { ctx.player?.stop(); ctx.instrument.reset(); return worldState(ctx) },
      },
    },
  })
}
