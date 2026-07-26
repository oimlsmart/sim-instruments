// families/construction.ts — data profiles (spec §4.2), not code.

export interface ConstructionProfile {
  id: string
  /** mm deflection per kg of applied load. */
  complianceKgPerMm: number
  /** loading/unloading branch gap as a fraction of full-scale strain. */
  hysteresisClass: number
  /** asymptotic creep as a fraction of elastic strain. */
  creepCoefficient: number
  /** creep exponential approach constant, seconds. */
  creepTauS: number
  /** first resonance (informational in v1). */
  resonantHz: number
  /** off-center loading sensitivity (informational in v1). */
  offCenterSensitivity: number
}

export const COMPRESSION: ConstructionProfile = {
  id: 'compression',
  complianceKgPerMm: 2.0e-6,   // rated deflection ~1 mm at 500 kg
  hysteresisClass: 0.0005,
  creepCoefficient: 0.0003,
  creepTauS: 300,
  resonantHz: 180,
  offCenterSensitivity: 0.0002,
}
export const CONSTRUCTION_PROFILES: Record<string, ConstructionProfile> = { compression: COMPRESSION }
