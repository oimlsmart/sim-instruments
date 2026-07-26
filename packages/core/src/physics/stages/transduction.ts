export interface TransductionParams {
  sensitivityMVperV: number; gaugeFactor: number; excitationV: number
  tcZeroPerDegC: number; tcSpanPerDegC: number; barometricPerKPa: number
  referenceTempDegC: number; referencePressureKPa: number
}

/** The strain-gauge Wheatstone bridge (spec §4.1 stage 2): linear
 *  temperature coefficients on zero and span; barometric offset on
 *  dead load (R 60-1, 5.6.2). Output in mV/V. */
export class TransductionStage {
  constructor(private readonly p: TransductionParams) {}
  output(strainMm: number, env: { temperatureDegC: number; pressureKPa: number }): number {
    const dT = env.temperatureDegC - this.p.referenceTempDegC
    const dP = env.pressureKPa - this.p.referencePressureKPa
    const span = this.p.sensitivityMVperV * (1 + this.p.tcSpanPerDegC * dT)
    const zero = this.p.tcZeroPerDegC * dT + this.p.barometricPerKPa * dP
    return span * strainMm + zero
  }
}
