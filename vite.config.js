import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GET as shareGet } from './api/share.js'
import { collectFeatures, featureBySlug, isFeatureVisible } from './src/lib/newsFeatures.js'

const SOCIAL_BOT = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Slack-ImgProxy|TelegramBot|WhatsApp|Discordbot|Pinterestbot|redditbot|SkypeUriPreview|vkShare/i

function featureModules() {
  const dir = join(process.cwd(), 'content', 'features')
  const modules = {}
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue
    modules[`/content/features/${name}`] = JSON.parse(readFileSync(join(dir, name), 'utf8'))
  }
  return modules
}

// Same gate as the Vercel rewrite to api/share. Vite does not read vercel.json.
function featurePublishGate() {
  return {
    name: 'sampa-feature-publish-gate',
    configureServer(server) {
      server.middlewares.use(gate)
    },
    configurePreviewServer(server) {
      server.middlewares.use(gate)
    },
  }
}

async function gate(req, res, next) {
  const host = req.headers.host || '127.0.0.1'
  const url = new URL(req.url || '/', `http://${host}`)
  const match = url.pathname.match(/^\/news\/features\/([a-z0-9-]+)$/)
  const isBody = url.pathname === '/api/share' && url.searchParams.get('slug') === 'feature'
  if (!match && !isBody) return next()

  const headers = new Headers()
  const userAgent = req.headers['user-agent']
  if (userAgent) headers.set('user-agent', userAgent)
  const target = match
    ? new URL(`/api/share?slug=feature&feature=${match[1]}`, 'http://localhost')
    : url
  const response = await shareGet(new Request(target, { headers }))

  if (match && response.status === 200 && !SOCIAL_BOT.test(userAgent || '')) {
    const feature = featureBySlug(collectFeatures(featureModules(), () => {}), match[1])
    if (isFeatureVisible(feature, new Date())) return next()
  }

  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  res.end(Buffer.from(await response.arrayBuffer()))
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), featurePublishGate()],
  server: {
    // Honor a harness-assigned port (preview tools set PORT); default otherwise.
    port: Number(process.env.PORT) || 5173,
  },
})
