import { readFileSync } from 'fs'
import { join } from 'path'

// Regresion: tsc --noEmit del proyecto abortaba por OOM (heap ~512 MB) en la prueba de hecho.
describe('RESULT_ROP_P0_ALTA_UI.sh', () => {
  const sh = readFileSync(join(__dirname, 'RESULT_ROP_P0_ALTA_UI.sh'), 'utf8')

  it('fija el heap de node para tsc', () => {
    expect(sh).toMatch(/max-old-space-size=\d{4,}/)
  })

  it('no invoca tsc sin heap explicito', () => {
    expect(sh).not.toMatch(/npx tsc/)
  })
})
