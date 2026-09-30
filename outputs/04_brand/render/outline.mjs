// Converts the wordmark "댕큐" (and "DANGQ") to SVG path data so logo files never depend on installed fonts.
// Font: Pretendard Black (static TTF from the npm `pretendard` package, SIL OFL 1.1).
// Run once:  npm i --prefix /tmp/ot opentype.js@1.3.4 && OT=/tmp/ot/node_modules/opentype.js node outline.mjs
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const opentype = require(process.env.OT ?? 'opentype.js')
const font = opentype.loadSync('/home/user/first/app/node_modules/pretendard/dist/public/static/alternative/Pretendard-Black.ttf')

function outline(text, size, trackingEm) {
  let x = 0
  const parts = []
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const g of font.stringToGlyphs(text)) {
    const p = g.getPath(x, 0, size)
    const bb = p.getBoundingBox()
    minX = Math.min(minX, bb.x1); minY = Math.min(minY, bb.y1); maxX = Math.max(maxX, bb.x2); maxY = Math.max(maxY, bb.y2)
    parts.push(p.toPathData(2))
    x += (g.advanceWidth / font.unitsPerEm) * size + trackingEm * size
  }
  return { d: parts.join(''), bbox: { x1: +minX.toFixed(2), y1: +minY.toFixed(2), x2: +maxX.toFixed(2), y2: +maxY.toFixed(2) }, advance: +(x - trackingEm * size).toFixed(2), size, tracking: trackingEm }
}

const out = { font: 'Pretendard Black (OFL-1.1)', ko: outline('댕큐', 100, -0.05), en: outline('DANGQ', 100, 0.02) }
writeFileSync(new URL('./wordmark-paths.json', import.meta.url), JSON.stringify(out, null, 1))
console.log(out.ko.bbox, out.en.bbox)
