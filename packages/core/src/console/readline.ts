// console/readline.ts — the node readline console loop (attached by
// `sim-lc500 console`; browser code imports console/client.ts only).
import { createInterface, type Interface } from 'node:readline'
import { parseCommand } from './grammar.js'
import { execute, promptOf, type ConsoleIo, type ConsoleState } from './client.js'

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
