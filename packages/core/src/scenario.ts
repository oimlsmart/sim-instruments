// scenario.ts — named instrument definitions + physics presets
// (spec §8: scenarios are data, not code; validation is precise).
import type { InstrumentDefinition, InstrumentParameters } from './instrument.js'
import type { ConstructionProfile } from './physics/families/construction.js'
import { COMPRESSION } from './physics/families/construction.js'
import { LC500_GOOD } from './instrument.js'

export interface Scenario extends InstrumentDefinition {
  name: string
  description: string
}

const GOOD_PARAMS: InstrumentParameters = LC500_GOOD.parameters

export const SCENARIOS: Record<string, Scenario> = {
  'good-cell': {
    ...LC500_GOOD,
    name: 'good-cell',
    description: 'All coefficients inside R 60 limits — passes the test program.',
  },
  'creep-cell': {
    id: 'lc500-creep',
    name: 'creep-cell',
    description: 'Creep coefficient/τ beyond MPE — fails the 30-minute creep test.',
    construction: { ...COMPRESSION, id: 'compression-creep', creepCoefficient: 0.004, creepTauS: 120 },
    stack: 'digital',
    parameters: { ...GOOD_PARAMS },
  },
  'temp-cell': {
    id: 'lc500-temp',
    name: 'temp-cell',
    description: 'Excessive temperature coefficients on zero and span — fails the temperature tests.',
    construction: 'compression',
    stack: 'digital',
    parameters: {
      ...GOOD_PARAMS,
      tcZeroPerDegC: 0.001, tcSpanPerDegC: 0.002, compensationResidualPerDegC: 0.005,
    },
  },
  'drift-cell': {
    id: 'lc500-drift',
    name: 'drift-cell',
    description: 'Excessive span drift — fails span-stability over the endurance program.',
    construction: 'compression',
    stack: 'digital',
    parameters: { ...GOOD_PARAMS, spanDriftPerDay: 0.0005 },
  },
}

export function getScenario(name: string): Scenario {
  const s = SCENARIOS[name]
  if (!s) throw new Error(`unknown scenario '${name}' (known: ${Object.keys(SCENARIOS).join(', ')})`)
  return s
}

const PARAM_KEYS: Array<keyof InstrumentParameters> = [
  'capacityKg', 'scaleIntervalKg', 'sensitivityMVperV', 'gaugeFactor', 'excitationV',
  'tcZeroPerDegC', 'tcSpanPerDegC', 'barometricPerKPa', 'referenceTempDegC', 'referencePressureKPa',
  'filterTauS', 'linearizationErrorKg', 'compensationResidualPerDegC', 'noiseSigmaKg',
  'warmUpTauS', 'spanDriftPerDay',
]
const PROFILE_KEYS: Array<keyof ConstructionProfile> = [
  'id', 'complianceKgPerMm', 'hysteresisClass', 'creepCoefficient', 'creepTauS', 'resonantHz', 'offCenterSensitivity',
]
const STACKS = new Set(['analog-passive', 'analog-active', 'digital', 'digital-processing'])

/** Validate an authored scenario record (spec §8: definitions are
 *  data) — throws with the first precise field error. */
export function validateScenario(raw: unknown): Scenario {
  const r = raw as Record<string, unknown>
  for (const k of ['id', 'name', 'description'] as const) {
    if (typeof r?.[k] !== 'string' || (r[k] as string).length === 0) throw new Error(`scenario.${k}: required non-empty string`)
  }
  const c = r.construction
  if (typeof c === 'string') {
    if (c.length === 0) throw new Error('scenario.construction: empty profile id')
  } else if (c && typeof c === 'object') {
    for (const k of PROFILE_KEYS) {
      const v = (c as Record<string, unknown>)[k]
      if (k === 'id' ? typeof v !== 'string' : typeof v !== 'number') throw new Error(`scenario.construction.${k}: required ${k === 'id' ? 'string' : 'number'}`)
    }
  } else {
    throw new Error('scenario.construction: profile id or inline profile required')
  }
  if (typeof r.stack !== 'string' || !STACKS.has(r.stack)) throw new Error(`scenario.stack: one of ${[...STACKS].join(', ')} (got '${String(r.stack)}')`)
  const p = r.parameters as Record<string, unknown> | undefined
  if (!p || typeof p !== 'object') throw new Error('scenario.parameters: required object')
  for (const k of PARAM_KEYS) {
    if (typeof p[k] !== 'number') throw new Error(`scenario.parameters.${k}: required number`)
  }
  return r as unknown as Scenario
}
