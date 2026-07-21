import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import { scanSourceEncoding } from '../lib/quality/source-encoding.js'

const sourceFile = /\.(?:[cm]?[jt]sx?|json|md|css|scss|html|ya?ml)$/i
const trackedFiles = execFileSync(
  'git',
  ['ls-files', '--', 'app', 'components', 'lib', 'data', 'README.md'],
  { encoding: 'utf8' },
)
  .split(/\r?\n/)
  .filter((file) => file === 'README.md' || sourceFile.test(file))

let findingCount = 0

for (const file of trackedFiles) {
  const source = readFileSync(file, 'utf8')

  for (const finding of scanSourceEncoding(source)) {
    findingCount += 1
    console.error(`${file}:${finding.line}:${finding.column}: suspicious source encoding: ${finding.fragment}`)
  }
}

if (findingCount > 0) {
  console.error(`Found ${findingCount} suspicious source-encoding fragment(s).`)
  process.exitCode = 1
}
