import { describe, it, expect, afterEach } from 'vitest'
import { createSimServer } from '../server.js'
import { buildWorldSchema, type WorldContext } from '../world-schema.js'
import { VirtualClock } from '../time.js'
import { SimulatedInstrument } from '../instrument.js'
import { getScenario } from '../scenario.js'
import { parseCommand } from './grammar.js'
import { execute, httpConsoleIo, type ConsoleState } from './client.js'

let close: (() => Promise<void>) | undefined
afterEach(async () => { await close?.(); close = undefined })

async function boot() {
  const clock = new VirtualClock()
  const host: WorldContext = {
    instrument: new SimulatedInstrument(getScenario('good-cell'), clock, 1),
    clock,
    swap(def) { this.instrument = new SimulatedInstrument(def, clock, 1) },
  }
  const server = await createSimServer({ worldSchema: buildWorldSchema(host), port: 0 })
  close = server.close
  const io = httpConsoleIo(server.url, () => {})
  const state: ConsoleState = { privileged: false, watching: false }
  return { clock, io, state }
}
const run = (line: string, io: Awaited<ReturnType<typeof boot>>['io'], state: ConsoleState) =>
  execute(parseCommand(line), io, state)

describe('console scripted session (spec §7 — boot to reading)', () => {
  it('privilege gate, place load, advance, show — the epistemic split', async () => {
    const { io, state } = await boot()

    // unprivileged actuation is refused
    expect(await run('place load 40', io, state)).toMatch(/privileged/)
    await run('enable', io, state)

    // place 40 kg → ground truth shows 40
    await run('place load 40', io, state)
    const gt = await run('show ground-truth', io, state)
    expect(gt).toContain('"appliedLoadKg": 40')

    // advance 5m → the clock moves
    const before = JSON.parse((await run('show clock', io, state))) as { data: { worldState: { clock: number } } }
    await run('advance 5m', io, state)
    const after = JSON.parse((await run('show clock', io, state))) as { data: { worldState: { clock: number } } }
    expect(after.data.worldState.clock - before.data.worldState.clock).toBeCloseTo(300, 6)

    // show indication reads /twin — the honest placeholder until C3
    const ind = await run('show indication', io, state)
    expect(ind).toMatch(/twin schema not (generated|baked)/)

    // scenario swap + a D 11 profile + environment
    await run('scenario creep-cell', io, state)
    await run('play profile damp-heat-cyclic-db', io, state)
    await run('set temperature 60', io, state)
    const env = await run('show environment', io, state)
    expect(env).toContain('"temperatureDegC": 60')

    // reset returns to baseline
    await run('reset', io, state)
  }, 15000)

  it('fidelity knobs stay /world-side (ground truth honest, twin placeholder unaffected)', async () => {
    const { io, state } = await boot()
    await run('enable', io, state)
    await run('place load 500', io, state)
    await run('set fidelity offset 0.25 lag 30', io, state)
    const gt = await run('show ground-truth', io, state)
    expect(gt).toContain('"appliedLoadKg": 500')
    expect(gt).not.toContain('servedOffset')
    await run('fidelity reset', io, state)
  })
})
