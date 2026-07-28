// @sim/core — the simulated-instrument framework (public surface).
export { VirtualClock, type ClockMode } from './time.js'
export { qty, add, subtract, mul, abs, UNITS, type Qty, type Unit, type QuantityKind } from './physics/quantity.js'
export { mulberry32, normal } from './physics/rng.js'
export { MechanicalStage } from './physics/stages/mechanical.js'
export { CONSTRUCTION_PROFILES, COMPRESSION, type ConstructionProfile } from './physics/families/construction.js'
export { TransductionStage, type TransductionParams } from './physics/stages/transduction.js'
export { ConditioningStage, type ConditioningParams, type TechnologyStack } from './physics/stages/conditioning.js'
export { pointerPositionKg, readingUncertaintyKg, type DialSpec } from './physics/stages/dial.js'
export {
  SimulatedInstrument, LC500_GOOD, LC500_PAIRED_DIAL, REFERENCE_ENVIRONMENT,
  type Environment, type GroundTruth, type InstrumentDefinition, type InstrumentParameters,
  type OperationalState, type FidelityKnobs, HONEST_FIDELITY,
} from './instrument.js'
export { D11_CONDITIONS, D11_EVENT_STANDARDS, type ConditionClass, type SeverityLevel, type EnvironmentEvent } from './environment/conditions.js'
export { D11_PROFILES, ProfilePlayer, interpolate, slew, type ProfileProgram, type ProfileKeyframe } from './environment/profiles.js'
export { SCENARIOS, getScenario, validateScenario, type Scenario } from './scenario.js'
export {
  SimulatedGasAnalyzer, GAS_ANALYZER_GOOD, GAS_COMPONENTS, AMBIENT_AIR,
  type GasComponent, type GasChannelDefinition, type GasAnalyzerDefinition, type GasAnalyzerParameters,
  type GasBench, type ChannelTruth, type GasGroundTruth, type InitialFaults,
} from './gas-instrument.js'
export { GAS_SCENARIOS, getGasScenario, validateGasScenario, type GasScenario } from './gas-scenario.js'
export {
  GasTransductionStage, gasDensity, GAS_REFERENCE,
  type GasSample, type GasTransductionParams, type NdirTransductionParams, type CldTransductionParams,
} from './physics/stages/gas-transduction.js'
export { GasConditioningStage, type GasConditioningParams, type ConditioningContext } from './physics/stages/gas-conditioning.js'
export { buildWorldSchema, buildWorldSchemaFor, LOAD_CELL_WORLD_KIND, type WorldContext, type WorldInstrument, type WorldKind } from './world-schema.js'
export { buildGasWorldSchema, GAS_WORLD_KIND, type GasWorldContext } from './gas-world.js'
export { createSimServer, type SimServer, type SimServerOptions } from './server.js'
export { generateTwinSchema, snakeToCamel, type TwinIo, type TwinInstrumentView } from './twin-schema.js'
export { checkTwinConformance } from './conformance.js'
export { LC500_CONTRACT, GAS_ANALYZER_CONTRACT, type TwinContract, type TwinOperation, type ServeDeclaration } from './twin-contract.js'
export { bakeTwinContract, loadBakedContract, type BakedContract } from './twin-bake.js'
export { parseCommand, PRIVILEGED_KINDS, HELP_TEXT, type ConsoleAction } from './console/grammar.js'
export { execute, httpConsoleIo, promptOf, type ConsoleIo, type ConsoleState } from './console/client.js'
export { runConsole } from './console/readline.js'
