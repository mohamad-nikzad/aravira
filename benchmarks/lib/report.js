import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js'

export function buildSummary(scenarioName, data) {
  const env = __ENV.BASE_URL?.includes('localhost') ? 'local' : 'prod'
  const stack = __ENV.STACK || 'nextjs-api-routes'
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const base = `benchmarks/results/${env}/${stack}/${scenarioName}-${ts}`
  return {
    [`${base}.html`]: htmlReport(data, {
      title: `${scenarioName} · ${stack} · ${env} · ${ts}`,
    }),
    [`${base}.json`]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}
