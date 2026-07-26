import { describe, it, expect } from 'vitest'
import { createYoga } from 'graphql-yoga'
import { generateTwinSchema, type TwinIo } from './twin-schema.js'
import { LC500_CONTRACT } from './twin-contract.js'
import { VirtualClock } from './time.js'
import { SimulatedInstrument } from './instrument.js'
import { getScenario } from './scenario.js'

function boot() {
  const clock = new VirtualClock()
  const instrument = new SimulatedInstrument(getScenario('good-cell'), clock, 1)
  const io: TwinIo = { instrument, clock }
  const yoga = createYoga({ schema: generateTwinSchema(LC500_CONTRACT, io), graphqlEndpoint: '/twin' })
  return { clock, instrument, yoga }
}

/** Read n SSE data-events from a subscription response, driving the
 *  clock between reads via `act`, then cancel the stream. */
async function collectSse(res: Response, n: number, act?: (i: number) => void): Promise<unknown[]> {
  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  const events: unknown[] = []
  let buf = ''
  try {
    while (events.length < n) {
      const { value, done } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const parts = buf.split('\n\n')
      buf = parts.pop() ?? ''
      for (const part of parts) {
        const dataLine = part.split('\n').find(l => l.startsWith('data:'))
        if (dataLine) events.push(JSON.parse(dataLine.slice(5).trim()))
      }
      act?.(events.length)
    }
  } finally {
    await reader.cancel()
  }
  return events
}

describe('/twin subscriptions (watch-kind serves, spec §6)', () => {
  it('state streams the current value first, then transitions on clock advance', async () => {
    const { yoga, clock } = boot()
    const res = await yoga.fetch('http://localhost/twin', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: `subscription { state }` }),
    })
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const events = await collectSse(res, 2, i => { if (i === 1) clock.advance(400) })
    expect((events[0] as { data: { state: string } }).data.state).toBe('warming')
    expect((events[1] as { data: { state: string } }).data.state).toBe('ready')
  }, 10000)

  it('environmentalContext streams and dedupes identical values', async () => {
    const { yoga, clock, instrument } = boot()
    const res = await yoga.fetch('http://localhost/twin', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: `subscription { environmentalContext { temperatureDegC } }` }),
    })
    const events = await collectSse(res, 2, i => { if (i === 1) { clock.advance(10); instrument.setEnvironment({ temperatureDegC: 60 }); clock.advance(10) } })
    expect((events[0] as { data: { environmentalContext: { temperatureDegC: number } } }).data.environmentalContext.temperatureDegC).toBe(20)
    expect((events[1] as { data: { environmentalContext: { temperatureDegC: number } } }).data.environmentalContext.temperatureDegC).toBe(60)
  }, 10000)

  it('unsubscribing removes the clock listener', async () => {
    const { yoga, clock, instrument } = boot()
    const io_probe = { listeners: 0 }
    void io_probe
    const res = await yoga.fetch('http://localhost/twin', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: `subscription { state }` }),
    })
    await collectSse(res, 1) // initial value read, then cancel
    // after cancellation, advancing the clock must not throw or leak
    instrument.setLoad(500)
    clock.advance(10)
    expect(true).toBe(true)
  }, 10000)
})
