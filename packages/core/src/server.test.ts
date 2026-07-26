import { describe, it, expect, afterEach } from 'vitest'
import { createSimServer } from './server.js'
import { buildWorldSchema, type WorldContext } from './world-schema.js'
import { VirtualClock } from './time.js'
import { SimulatedInstrument } from './instrument.js'
import { getScenario } from './scenario.js'

let close: (() => Promise<void>) | undefined
afterEach(async () => { await close?.(); close = undefined })

function boot() {
  const clock = new VirtualClock()
  const host: WorldContext = {
    instrument: new SimulatedInstrument(getScenario('good-cell'), clock, 1),
    clock,
    swap(def) { this.instrument = new SimulatedInstrument(def, clock, 1) },
  }
  return { host }
}

describe('createSimServer (spec §3/§9: one process, both channels + landing)', () => {
  it('serves /world over real HTTP (ephemeral port)', async () => {
    const { host } = boot()
    const server = await createSimServer({ worldSchema: buildWorldSchema(host), port: 0 })
    close = server.close
    const res = await fetch(`${server.url}/world`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: `mutation { placeLoad(massKg: 40) { groundTruth { appliedLoadKg } } }` }),
    })
    const body = await res.json() as { data: { placeLoad: { groundTruth: { appliedLoadKg: number } } } }
    expect(body.data.placeLoad.groundTruth.appliedLoadKg).toBe(40)
  })

  it('serves the GraphiQL playground for /world and /twin', async () => {
    const { host } = boot()
    const server = await createSimServer({ worldSchema: buildWorldSchema(host), port: 0 })
    close = server.close
    const w = await fetch(`${server.url}/world`, { headers: { accept: 'text/html' } })
    expect(w.status).toBe(200)
    expect(await w.text()).toContain('GraphiQL')
    const t = await fetch(`${server.url}/twin`, { headers: { accept: 'text/html' } })
    expect(t.status).toBe(200)
  })

  it('/ serves the landing page linking both channels', async () => {
    const { host } = boot()
    const server = await createSimServer({ worldSchema: buildWorldSchema(host), port: 0 })
    close = server.close
    const res = await fetch(`${server.url}/`)
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('/world')
    expect(html).toContain('/twin')
  })

  it('/twin without a baked schema answers a clear placeholder, never a crash', async () => {
    const { host } = boot()
    const server = await createSimServer({ worldSchema: buildWorldSchema(host), port: 0 })
    close = server.close
    // introspection succeeds (the schema is honestly empty apart from the placeholder)
    const intro = await fetch(`${server.url}/twin`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: `{ __schema { queryType { fields { name } } } }` }),
    })
    expect(intro.status).toBe(200)
    // and the placeholder field explains itself when queried
    const res = await fetch(`${server.url}/twin`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: `{ _twinPlaceholder }` }),
    })
    expect(res.status).toBeLessThan(500)
    const body = await res.json() as { errors?: Array<{ message: string }> }
    expect(JSON.stringify(body)).toMatch(/twin schema not (generated|baked)/)
  })
})
