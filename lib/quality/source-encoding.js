const mojibakePatterns = [
  /Igi\u00c4\u2021/g,
  /\u00c4\u0164/g,
  /\u0139\u013e/g,
  /\u00e2\u2020\u2019/g,
  /\ufffd/g,
  /[A-Za-z\u00c0-\u024f]*[\u0400-\u04ff][A-Za-z\u00c0-\u024f\u0400-\u04ff]*/g,
]

function getLocation(source, index) {
  const before = source.slice(0, index)
  const lastNewline = before.lastIndexOf('\n')

  return {
    line: before.split('\n').length,
    column: index - lastNewline,
  }
}

/**
 * Finds probable source-encoding corruption without changing the supplied text.
 *
 * @param {string} source
 * @returns {{ fragment: string, line: number, column: number }[]}
 */
export function scanSourceEncoding(source) {
  const findings = []

  for (const pattern of mojibakePatterns) {
    for (const match of source.matchAll(pattern)) {
      const { line, column } = getLocation(source, match.index)
      findings.push({ fragment: match[0], line, column })
    }
  }

  return findings.sort((left, right) => left.line - right.line || left.column - right.column)
}
