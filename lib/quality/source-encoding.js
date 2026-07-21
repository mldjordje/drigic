const mojibakePatterns = [
  /Igi\u00c4\u2021/g,
  /\u00c4\u0164/g,
  /\u0139\u013e/g,
  /\u00e2\u2020\u2019/g,
  /\ufffd/g,
  /(?=[\p{L}\p{N}_-]*\p{Script=Latin})(?=[\p{L}\p{N}_-]*\p{Script=Cyrillic})[\p{L}\p{N}_-]+/gu,
]

function getLocation(source, index) {
  const before = source.slice(0, index)
  const currentLine = before.slice(before.lastIndexOf('\n') + 1)

  return {
    line: before.split('\n').length,
    column: Array.from(currentLine).length + 1,
  }
}

/**
 * Finds probable source-encoding corruption without changing the supplied text.
 *
 * @param {string} source
 * @returns {{ fragment: string, line: number, column: number }[]}
 */
function scanSourceEncoding(source) {
  const findings = []

  for (const pattern of mojibakePatterns) {
    for (const match of source.matchAll(pattern)) {
      const { line, column } = getLocation(source, match.index)
      findings.push({ fragment: match[0], line, column })
    }
  }

  return findings.sort((left, right) => left.line - right.line || left.column - right.column)
}

module.exports = { scanSourceEncoding }
