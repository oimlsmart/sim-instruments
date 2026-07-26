// console/client.ts — the console executor + readline loop (spec §7).
// show indication reads /twin; show ground-truth reads /world — the
// console itself teaches the epistemic split.
import { createInterface, type Interface } from 'node:readline'
import { parseCommand, PRIVILEGED_KINDS, HELP_TEXT, type ConsoleAction } from './grammar.js'

export interface ConsoleIo {
  /** POST a GraphQL query to a channel path ('/world' | '/twin'). */
  query(channel: '/world' | '/twin', query: string): Promise<unknown>
  write(text: string): void
}

export interface ConsoleState {
  privileged: boolean
  watching: boolean
}

function fmt(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

/** Execute one parsed action against the channels. Returns the text
 *  to print (empty string when nothing to print). */
export async function execute(action: ConsoleAction, io: ConsoleIo, state: ConsoleState): Promise<string> {
  if (action.kind === 'unknown') return `% unknown command '${action.line}' — try 'help'`
  if (PRIVILEGED_KINDS.has(action.kind) && !state.privileged) return '% privileged command — ' + "'enable' first"
  switch (action.kind) {
    case 'help': return HELP_TEXT
    case 'enable': state.privileged = true; return ''
    case 'disable': state.privileged = false; return ''
    case 'exit': return ''
    case 'show': {
      if (action.target === 'indication') {
        const raw = fmt(await io.query('/twin', `{ indication { value unit } }`))
        // the placeholder twin has no twin fields yet — say so plainly
        return raw.includes('Cannot query field')
          ? raw + '\n% /twin is a placeholder until the twin schema lands (C3, design §6) — this is what a certification engine would see'
          : raw
      }
      if (action.target === 'ground-truth') return fmt(await io.query('/world', `{ groundTruth { appliedLoadKg strainMm clockS spanDriftFraction environment { temperatureDegC humidityPercentRh pressureKPa } } }`))
      if (action.target === 'environment') return fmt(await io.query('/world', `{ groundTruth { environment { temperatureDegC humidityPercentRh pressureKPa } } }`))
      if (action.target === 'clock') return fmt(await io.query('/world', `{ worldState { clock mode } }`))
      if (action.target === 'scenarios') return fmt(await io.query('/world', `{ scenarios { name description } }`))
      if (action.target === 'profiles') return fmt(await io.query('/world', `{ profiles { id standard } }`))
      if (action.target === 'fidelity') return fmt(await io.query('/world', `{ groundTruth { appliedLoadKg clockS } }`))
      return fmt(await io.query('/world', `{ worldState { clock mode } }`))
    }
    case 'placeLoad': return fmt(await io.query('/world', `mutation { placeLoad(massKg: ${action.massKg}) { groundTruth { appliedLoadKg } } }`))
    case 'removeLoad': return fmt(await io.query('/world', `mutation { removeLoad { groundTruth { appliedLoadKg } } }`))
    case 'setEnvironment': return fmt(await io.query('/world', `mutation { setEnvironment(conditions: { ${action.field}: ${action.value} }) { groundTruth { environment { temperatureDegC humidityPercentRh pressureKPa } } } }`))
    case 'playProfile': return fmt(await io.query('/world', `mutation { playProfile(profile: "${action.id}") { clock } }`))
    case 'advance': return fmt(await io.query('/world', `mutation { advanceTime(seconds: ${action.seconds}) { clock } }`))
    case 'setClockMode': return fmt(await io.query('/world', `mutation { setClockMode(mode: "${action.mode}") { mode } }`))
    case 'scenario': return fmt(await io.query('/world', `mutation { scenario(name: "${action.name}") { clock } }`))
    case 'setFidelity': return fmt(await io.query('/world', `mutation { setFidelity(servedOffsetKg: ${action.servedOffsetKg}, servedLagS: ${action.servedLagS}) { clock } }`))
    case 'fidelityReset': return fmt(await io.query('/world', `mutation { setFidelity(servedOffsetKg: 0, servedLagS: 0) { clock } }`))
    case 'reset': return fmt(await io.query('/world', `mutation { reset { clock } }`))
    case 'watch': {
      state.watching = true
      return '% watching indication (Ctrl-C to stop) — subscriptions ride /twin when the twin schema lands (design §6)'
    }
  }
}

export function promptOf(state: ConsoleState): string {
  return state.privileged ? 'sim#' : 'sim>'
}

/** The readline loop (attached by `sim-lc500 console`; tests drive
 *  execute() directly). */
export function runConsole(io: ConsoleIo, input: NodeJS.ReadableStream, output: NodeJS.WritableStream): Interface {
  const state: ConsoleState = { privileged: false, watching: false }
  const rl = createInterface({ input, output, prompt: promptOf(state) })
  io.write('sim-instruments console — type `help` (user exec) then `enable` for privileged mode\n')
  rl.prompt()
  rl.on('line', line => {
    void (async () => {
      const action = parseCommand(line)
      if (action.kind === 'exit') { rl.close(); return }
      const text = await execute(action, io, state)
      if (text) io.write(text + '\n')
      rl.setPrompt(promptOf(state))
      rl.prompt()
    })().catch((e: unknown) => { io.write(`% error: ${e instanceof Error ? e.message : String(e)}\n`); rl.prompt() })
  })
  return rl
}

/** HTTP ConsoleIo factory: POST GraphQL to `${baseUrl}${channel}`. */
export function httpConsoleIo(baseUrl: string, write: (t: string) => void): ConsoleIo {
  return {
    write,
    async query(channel, query) {
      const res = await fetch(`${baseUrl}${channel}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query }),
      })
      return res.json()
    },
  }
}
