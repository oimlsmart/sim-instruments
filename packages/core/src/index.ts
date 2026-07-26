// @sim/core — the simulated-instrument framework (public surface).
export { VirtualClock, type ClockMode } from './time.js'
export { qty, add, subtract, mul, abs, UNITS, type Qty, type Unit, type QuantityKind } from './physics/quantity.js'
export { mulberry32, normal } from './physics/rng.js'
export { MechanicalStage } from './physics/stages/mechanical.js'
export { CONSTRUCTION_PROFILES, COMPRESSION, type ConstructionProfile } from './physics/families/construction.js'
export { TransductionStage, type TransductionParams } from './physics/stages/transduction.js'
export { ConditioningStage, type ConditioningParams, type TechnologyStack } from './physics/stages/conditioning.js'
export {
  SimulatedInstrument, LC500_GOOD, REFERENCE_ENVIRONMENT,
  type Environment, type GroundTruth, type InstrumentDefinition, type InstrumentParameters,
  type OperationalState, type FidelityKnobs, HONEST_FIDELITY,
} from './instrument.js'
export { D11_CONDITIONS, D11_EVENT_STANDARDS, type ConditionClass, type SeverityLevel, type EnvironmentEvent } from './environment/conditions.js'
export { D11_PROFILES, ProfilePlayer, interpolate, slew, type ProfileProgram, type ProfileKeyframe } from './environment/profiles.js'
export { SCENARIOS, getScenario, validateScenario, type Scenario } from './scenario.js'
export { buildWorldSchema, type WorldContext } from './world-schema.js'
export { createSimServer, type SimServer, type SimServerOptions } from './server.js'
export { generateTwinSchema, snakeToCamel, type TwinIo } from './twin-schema.js'
export { checkTwinConformance } from './conformance.js'
export { LC500_CONTRACT, type TwinContract, type TwinOperation, type ServeDeclaration } from './twin-contract.js'
export { bakeTwinContract, loadBakedContract, type BakedContract } from './twin-bake.js'
export { parseCommand, PRIVILEGED_KINDS, HELP_TEXT, type ConsoleAction } from './console/grammar.js'
export { execute, runConsole, httpConsoleIo, promptOf, type ConsoleIo, type ConsoleState } from './console/client.js'
