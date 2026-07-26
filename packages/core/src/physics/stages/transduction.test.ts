import { describe, it, expect } from 'vitest'
import { TransductionStage, type TransductionParams } from './transduction.js'

const P: TransductionParams = {
  sensitivityMVperV: 2.0, gaugeFactor: 2.0, excitationV: 10,
  tcZeroPerDegC: 0.0001, tcSpanPerDegC: 0.0002,
  barometricPerKPa: 0.00005, referenceTempDegC: 20, referencePressureKPa: 101.325,
}

describe('TransductionStage', () => {
  const t = new TransductionStage(P)
  const envRef = { temperatureDegC: 20, pressureKPa: 101.325 }
  it('reference environment: output = sensitivity × strain (normalized)', () => {
    expect(t.output(0.001, envRef)).toBeCloseTo(2.0 * 0.001, 12)
  })
  it('span scales with (1 + tcSpan × ΔT); zero shifts with tcZero × ΔT and barometric × ΔP', () => {
    const hot = { temperatureDegC: 60, pressureKPa: 101.325 }
    expect(t.output(0.001, hot)).toBeCloseTo(2.0 * 0.001 * (1 + 0.0002 * 40) + 0.0001 * 40, 12)
    const hiP = { temperatureDegC: 20, pressureKPa: 106 }
    expect(t.output(0, hiP)).toBeCloseTo(0.00005 * (106 - 101.325), 12)
  })
})
