import fs from 'node:fs'

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

const provenance = readJson('src/data/provenance.json')
const datasets = {
  motors: readJson('src/data/motors.json'),
  escs: readJson('src/data/escs.json'),
  batteries: readJson('src/data/batteries.json'),
  propellers: readJson('src/data/propellers.json'),
}

const errors = []
const stats = {}

for (const [table, rows] of Object.entries(datasets)) {
  const byId = provenance[table] ?? {}
  stats[table] = { total: rows.length, verified: 0, pending: 0, rejected: 0, missing: 0 }

  for (const row of rows) {
    const id = row.id
    const entry = byId[id]
    if (!entry) {
      errors.push(`Missing provenance entry for ${table}:${id}`)
      stats[table].missing += 1
      continue
    }

    if (!['verified', 'pending', 'rejected'].includes(entry.status)) {
      errors.push(`Invalid provenance status for ${table}:${id} -> ${entry.status}`)
      continue
    }

    stats[table][entry.status] += 1

    if (entry.status === 'verified') {
      if (!entry.sourceUrl || !entry.sourceName || !entry.verifiedAt) {
        errors.push(`Verified entry missing metadata for ${table}:${id}`)
      }
    }
  }
}

console.log(JSON.stringify({ stats, errorCount: errors.length, errors: errors.slice(0, 50) }, null, 2))

if (errors.length > 0) {
  process.exit(1)
}
