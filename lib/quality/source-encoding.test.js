import { describe, expect, it } from 'vitest'

import { scanSourceEncoding } from './source-encoding.js'

const correctSerbian = 'Dr Igi\u0107\nU\u010ditavanje\nZaka\u017ei\n\u010c\u0106\u0160\u017d\u0110'
const corruptedC = 'Igi\u00c4\u2021'
const corruptedCaron = '\u00c4\u0164'
const corruptedZ = '\u0139\u013e'
const corruptedArrow = '\u00e2\u2020\u2019'
const mixedScriptToken = 'EstetkaMedacina\u041dis'

describe('scanSourceEncoding', () => {
  it('accepts correctly encoded Serbian text', () => {
    expect(scanSourceEncoding(correctSerbian)).toEqual([])
  })

  it('accepts standalone Cyrillic text', () => {
    expect(scanSourceEncoding('Привет')).toEqual([])
  })

  it.each([
    ['mis-decoded ć', `Dr ${corruptedC}`, corruptedC],
    ['mis-decoded č', `U${corruptedCaron}itavanje`, corruptedCaron],
    ['mis-decoded ž', `Zaka${corruptedZ}i`, corruptedZ],
    ['mis-decoded arrow', `Nastavi ${corruptedArrow}`, corruptedArrow],
  ])('detects %s', (_label, source, fragment) => {
    expect(scanSourceEncoding(source)).toEqual([
      { fragment, line: 1, column: source.indexOf(fragment) + 1 },
    ])
  })

  it('reports every finding with an accurate line and column', () => {
    const source = `Prva linija\n  Dr ${corruptedC}\nZaka${corruptedZ}i ${corruptedArrow}`

    expect(scanSourceEncoding(source)).toEqual([
      { fragment: corruptedC, line: 2, column: 6 },
      { fragment: corruptedZ, line: 3, column: 5 },
      { fragment: corruptedArrow, line: 3, column: 9 },
    ])
  })

  it('counts columns by Unicode code point after astral characters', () => {
    expect(scanSourceEncoding(`😀 Dr ${corruptedC}`)).toEqual([
      { fragment: corruptedC, line: 1, column: 6 },
    ])
  })

  it('detects Latin and Cyrillic mixed within one token', () => {
    expect(scanSourceEncoding(mixedScriptToken)).toEqual([
      { fragment: mixedScriptToken, line: 1, column: 1 },
    ])
  })

  it('does not mutate the supplied source string', () => {
    const source = `Dr ${corruptedC}`

    scanSourceEncoding(source)

    expect(source).toBe(`Dr ${corruptedC}`)
  })
})
