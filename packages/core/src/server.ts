// server.ts — the dual-schema HTTP server (spec §3/§9): one process
// hosting /world (simulated actions), /twin (the SMART digital twin
// interface — generated or baked; a clear placeholder until then),
// GraphiQL playgrounds for both, and the landing/bench at /.
import { createServer, type Server } from 'node:http'
import { createYoga, createSchema } from 'graphql-yoga'
import { GraphQLError, type GraphQLSchema } from 'graphql'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'

export interface SimServerOptions {
  worldSchema: GraphQLSchema
  /** the generated/baked twin schema; absent → honest placeholder. */
  twinSchema?: GraphQLSchema | undefined
  /** static bench directory (the @sim/bench build output); absent →
   *  the built-in landing page. */
  benchDir?: string | undefined
  /** 0 = ephemeral. */
  port: number
  /** landing-page title block (instrument id + scenario). */
  title?: string | undefined
}

export interface SimServer {
  url: string
  close: () => Promise<void>
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
}

const TWIN_PLACEHOLDER_MESSAGE = 'twin schema not generated/baked — pass twinSchema to createSimServer (see docs §6/§9)'

function landing(title: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;margin:3rem auto;max-width:44rem;line-height:1.5}
code{background:#f2f2f2;padding:.1em .3em;border-radius:4px}</style></head><body>
<h1>${title}</h1>
<p>A simulated measuring instrument (sim-instruments). Two channels:</p>
<ul>
<li><b><a href="/twin">/twin</a></b> — the SMART digital twin interface (what a certification engine may query). <a href="/twin">GraphiQL</a></li>
<li><b><a href="/world">/world</a></b> — simulated actions (the physical world: loads, environment, time). <a href="/world">GraphiQL</a></li>
</ul>
<p>The twin answers only what a real instrument could legally answer; the world is reality. Try <code>{ groundTruth { appliedLoadKg } }</code> on <code>/world</code>, then <code>mutation { placeLoad(massKg: 40) { groundTruth { appliedLoadKg } } }</code>.</p>
</body></html>`
}

export async function createSimServer(opts: SimServerOptions): Promise<SimServer> {
  const title = opts.title ?? 'simulated instrument'
  const worldYoga = createYoga<{ req: Request }>({ schema: opts.worldSchema, graphqlEndpoint: '/world', graphiql: true })
  const twinYoga = opts.twinSchema
    ? createYoga<{ req: Request }>({ schema: opts.twinSchema, graphqlEndpoint: '/twin', graphiql: true })
    : createYoga<{ req: Request }>({
        schema: createSchema({
          typeDefs: `type Query { _twinPlaceholder: String }`,
          resolvers: {
            Query: {
              _twinPlaceholder: () => {
                throw new GraphQLError(TWIN_PLACEHOLDER_MESSAGE)
              },
            },
          },
        }),
        graphqlEndpoint: '/twin',
        graphiql: true,
        // the placeholder IS the masked message: any resolver error
        // reaches the client as exactly this text, independent of
        // error-class identity across the CJS/ESM boundary.
        maskedErrors: { errorMessage: TWIN_PLACEHOLDER_MESSAGE },
      })

  const server: Server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (url.pathname === '/world' || url.pathname.startsWith('/world/')) return worldYoga(req, res, { req: req as unknown as Request })
    if (url.pathname === '/twin' || url.pathname.startsWith('/twin/')) return twinYoga(req, res, { req: req as unknown as Request })
    // static bench or the landing page
    if (opts.benchDir) {
      const rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '')
      try {
        const body = await readFile(join(opts.benchDir, rel))
        res.writeHead(200, { 'content-type': MIME[extname(rel)] ?? 'application/octet-stream' })
        return res.end(body)
      } catch { /* fall through to landing/404 */ }
    }
    if (url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      return res.end(landing(title))
    }
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('not found')
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(opts.port, () => resolve())
  })
  const addr = server.address()
  const port = typeof addr === 'object' && addr ? addr.port : opts.port
  return {
    url: `http://localhost:${port}`,
    close: () => new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())),
  }
}
