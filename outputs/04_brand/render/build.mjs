// 댕큐 brand asset renderer. Everything is drawn in code (SVG + HTML) and rasterised with Chromium.
// No photos, no stock, no AI imagery. Colors come from ../tokens.json, wordmark outlines from ./wordmark-paths.json.
// Run:  cd /home/user/first/app && node ../outputs/04_brand/render/build.mjs
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const BRAND = join(HERE, '..')
const APP = '/home/user/first/app'
const ASSETS = join(BRAND, 'assets')
const PUBLIC = join(APP, 'public/brand')
const FONT = join(APP, 'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2')
const req = createRequire(join(APP, 'package.json'))
const { chromium } = req('@playwright/test')

const TOK = JSON.parse(readFileSync(join(BRAND, 'tokens.json'), 'utf8'))
const C = Object.fromEntries(Object.entries(TOK.color).map(([k, v]) => [k, v.value]))
const WM = JSON.parse(readFileSync(join(HERE, 'wordmark-paths.json'), 'utf8'))
mkdirSync(ASSETS, { recursive: true }); mkdirSync(PUBLIC, { recursive: true })

/* ---------------------------------------------------------------- primitives */
const r2 = (n) => Math.round(n * 100) / 100

/** 나란히 마크 (48×36 units). tone: 'ink' | 'paper' | 'mono-ink' | 'mono-paper' */
function mark({ x = 0, y = 0, w = 48, tone = 'ink' }) {
  const s = w / 48
  const a = tone.endsWith('paper') ? C.paper : C.ink
  const b = tone.startsWith('mono') ? a : C.signal
  return `<g transform="translate(${r2(x)} ${r2(y)}) scale(${r2(s * 1000) / 1000})">
    <line x1="3" y1="9" x2="33" y2="9" stroke="${a}" stroke-width="6" stroke-linecap="round"/>
    <line x1="13" y1="27" x2="33" y2="27" stroke="${b}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="42" cy="9" r="5" fill="${a}"/><circle cx="42" cy="27" r="5" fill="${b}"/></g>`
}

/** Outlined wordmark. y = baseline. size = font size in px. */
function word({ x, y, size, color, which = 'ko' }) {
  return `<path transform="translate(${r2(x)} ${r2(y)}) scale(${size / 100})" d="${WM[which].d}" fill="${color}"/>`
}

/** Horizontal logo = Logo.tsx: mark width 1.2·size, gap .35·size, wordmark optically centred on the mark. (x,y) = top-left of the mark. */
function logo({ x, y, size, tone = 'ink' }) {
  const color = tone.endsWith('paper') ? C.paper : C.ink
  const mw = size * 1.2, mh = mw * 0.75
  const bb = WM.ko.bbox, k = size / 100
  const baseline = y + mh / 2 - ((bb.y1 + bb.y2) / 2) * k
  return mark({ x, y, w: mw, tone }) + word({ x: x + mw + size * 0.35 - bb.x1 * k, y: baseline, size, color })
}
const logoWidth = (size) => size * 1.2 + size * 0.35 + (WM.ko.bbox.x2 - WM.ko.bbox.x1) * size / 100

/* The geometric dog — a port of app/src/components/Dog.tsx. Emotion by posture only. */
const EAR = {
  calm: 'M22 -29 C 16 -27, 13 -18, 16 -9 C 21 -13, 25 -21, 27 -29 Z',
  alert: 'M21 -28 C 19 -38, 21 -45, 25 -48 C 30 -42, 31 -35, 30 -28 Z',
  react: 'M21 -27 C 13 -30, 5 -28, 0 -24 C 8 -21, 15 -21, 23 -22 Z',
}
const TAIL = {
  calm: 'M-30 -6 C -40 -9, -46 -13, -52 -12',
  alert: 'M-30 -8 C -37 -16, -39 -28, -35 -38',
  react: 'M-30 2 C -35 9, -30 17, -21 16',
}
/** (x, y) = where the dog stands: y is the lane line under its feet. */
function dog({ x, y, s = 1, state = 'calm', color, detail, stride = 10 }) {
  const head = { calm: '', alert: 'translate(0 -4)', react: 'translate(0 5)' }[state]
  const whole = state === 'react' ? 'translate(-5 0)' : ''
  const leg = (x1, x2, a) => `<line x1="${x1}" y1="6" x2="${x2}" y2="26" transform="rotate(${a} ${x1} 6)"/>`
  return `<g transform="translate(${r2(x)} ${r2(y - 26 * s)}) scale(${s})"><g transform="${whole}">
    <g stroke="${color}" stroke-width="6" stroke-linecap="round">${leg(-20, -22, stride)}${leg(-10, -10, -stride)}${leg(10, 10, -stride)}${leg(20, 22, stride)}</g>
    <path d="${TAIL[state]}" stroke="${color}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <rect x="-32" y="-14" width="62" height="26" rx="13" fill="${color}"/>
    <g transform="${head}"><circle cx="30" cy="-18" r="14" fill="${color}"/><rect x="36" y="-21" width="14" height="10" rx="5" fill="${color}"/>
      <circle cx="49" cy="-17" r="2.6" fill="${detail}"/><circle cx="34" cy="-23" r="2.4" fill="${detail}"/>
      <path d="${EAR[state]}" fill="${color}" stroke="${detail}" stroke-width="2" stroke-linejoin="round"/></g></g></g>`
}

const numText = ({ x, y, size, color, text, anchor = 'start', weight = 880 }) =>
  `<text x="${r2(x)}" y="${r2(y)}" fill="${color}" text-anchor="${anchor}" style="font:${weight} ${size}px/1 P;letter-spacing:-0.05em;font-variant-numeric:tabular-nums">${text}</text>`

/**
 * Stepped lanes — the key-visual signature. Upper lane (our dog) runs straight; the other dog's lane starts later
 * and closes the gap in discrete steps (순서), never crossing (수렴, not 교차).
 * steps: [{ d, L, size, label }]; the last step is where both dogs walk side by side.
 */
function stepped(o) {
  const { x0, late, yTop, gap, steps, T, dogX, s, xEnd, sw = 8, theme = 'ink', numPlace = 'top', inset = 24, labelSize = 22 } = o
  const me = theme === 'ink' ? C.paper : C.ink
  const meDetail = theme === 'ink' ? C.ink : C.paper
  const br = theme === 'ink' ? C.moss : C['moss-ink']
  const numColor = theme === 'ink' ? C.paper : C.ink
  const lastNum = theme === 'ink' ? C.moss : C['moss-ink']
  const lab = theme === 'ink' ? C['muted-on-ink'] : C.muted
  const themX = dogX - 20 * s
  let x = x0 + late, d = '', out = ''
  const segs = []
  steps.forEach((st, i) => {
    const y = yTop + gap(st.d)
    const sx = x
    const ex = i === steps.length - 1 ? themX - 44 * s : x + st.L
    if (i === 0) d += `M${r2(sx)} ${r2(y)}`
    else { const p = segs[i - 1]; const m = p.ex + T / 2; d += ` C${r2(m)} ${r2(p.y)} ${r2(m)} ${r2(y)} ${r2(sx)} ${r2(y)}` }
    d += ` L${r2(ex)} ${r2(y)}`
    segs.push({ ...st, sx, ex, y })
    x = ex + T
  })
  const last = segs[segs.length - 1]
  // lanes
  out += `<line x1="${x0}" y1="${yTop}" x2="${r2(dogX - 46 * s)}" y2="${yTop}" stroke="${me}" stroke-width="${sw}" stroke-linecap="round"/>`
  out += `<line x1="${r2(dogX + 58 * s)}" y1="${yTop}" x2="${xEnd}" y2="${yTop}" stroke="${me}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="2 ${sw * 3.4}" opacity=".55"/>`
  out += `<path d="${d}" fill="none" stroke="${C.signal}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`
  out += `<line x1="${r2(themX + 56 * s)}" y1="${last.y}" x2="${xEnd}" y2="${last.y}" stroke="${C.signal}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="2 ${sw * 3.4}" opacity=".55"/>`
  // brackets + numbers
  segs.forEach((sg, i) => {
    const isLast = i === segs.length - 1
    const bx = isLast ? dogX + 86 * s : sg.sx + inset
    const t = 2.5
    out += `<g stroke="${br}" stroke-width="${t}" stroke-linecap="round"><line x1="${r2(bx)}" x2="${r2(bx)}" y1="${yTop + 16}" y2="${sg.y - 16}"/><line x1="${r2(bx - 9)}" x2="${r2(bx + 9)}" y1="${yTop + 16}" y2="${yTop + 16}"/><line x1="${r2(bx - 9)}" x2="${r2(bx + 9)}" y1="${sg.y - 16}" y2="${sg.y - 16}"/></g>`
    const cap = sg.size * 0.72
    let nx = bx + 20, ny
    if (isLast) ny = (yTop + sg.y) / 2 + cap / 2
    else if (numPlace === 'top') ny = yTop + 22 + cap
    else { nx = sg.sx; ny = sg.y + 26 + cap }
    out += numText({ x: nx, y: ny, size: sg.size, color: isLast ? lastNum : numColor, text: `${sg.d}m` })
    if (sg.label) out += `<text x="${r2(sg.sx)}" y="${r2(sg.y + 30 + labelSize * 0.8)}" fill="${lab}" style="font:700 ${labelSize}px/1 P;letter-spacing:-0.01em">${sg.label}</text>`
  })
  // dogs, side by side on the last step
  out += dog({ x: dogX, y: yTop, s, color: me, detail: meDetail, state: 'calm' })
  out += dog({ x: themX, y: last.y, s, color: C.signal, detail: C.ink, state: 'calm', stride: -10 })
  return out
}

/* ---------------------------------------------------------------- page shell */
const shell = (w, h, bg, body, extraCss = '') => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>render</title><style>
@font-face{font-family:P;src:url(file://${FONT}) format('woff2');font-weight:45 920}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{font-family:P;background:${bg};color:${bg === C.ink ? C.paper : C.ink};word-break:keep-all;-webkit-font-smoothing:antialiased;position:relative}
.a{position:absolute}.num{font-variant-numeric:tabular-nums;letter-spacing:-0.05em}
svg.stage{position:absolute;left:0;top:0}
.hd{font-weight:880;letter-spacing:-0.055em;line-height:1.04}
.eb{font-weight:800;letter-spacing:.04em}
${extraCss}</style></head><body>${body}</body></html>`
const stage = (w, h, inner) => `<svg class="stage" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`

/* Page marker for the Instagram series: three short lanes, current one lit. */
function pager(i, tone) {
  const on = tone === 'ink' ? C.paper : C.ink
  return [0, 1, 2].map((k) => `<line x1="${80 + k * 44}" y1="84" x2="${108 + k * 44}" y2="84" stroke="${k === i ? (tone === 'signal' ? C.ink : C.signal) : on}" stroke-width="6" stroke-linecap="round" opacity="${k === i ? 1 : 0.35}"/>`).join('')
}

/* ---------------------------------------------------------------- assets */
// Matches the product rule (app/src/lib/demo.ts planFor) for 뽀리 8m + 두부 6m across walks:
// 1st walk 10 → 8 → 6 (floor 6m, no greeting) · 2nd walk 8 → 6 → 4 → 3 (greeting only if both want)
const LADDER = [
  { d: 10, label: '첫날, 멀리서 같은 방향으로' },
  { d: 6, label: '첫날은 여기까지' },
  { d: 4, label: '다음 산책, 이어서 조금 더' },
  { d: 3, label: '인사는 둘 다 원할 때만' },
]

const assets = {}

// Key visual 1920×1080
assets['kv-1920x1080'] = [1920, 1080, shell(1920, 1080, C.ink,
  stage(1920, 1080, stepped({
    x0: 100, late: 90, yTop: 480, gap: (d) => 110 + 20 * d, T: 56, dogX: 1540, s: 1.6, xEnd: 1820, sw: 8,
    steps: [
      { ...LADDER[0], L: 420, size: 200 }, { ...LADDER[1], L: 290, size: 136 },
      { ...LADDER[2], L: 220, size: 96 }, { ...LADDER[3], size: 72 },
    ],
  }) + logo({ x: 100, y: 988, size: 40, tone: 'paper' })) +
  `<p class="a eb" style="left:100px;top:92px;font-size:26px;color:${C.moss}">동네 산책을 위한 거리 약속</p>
   <h1 class="a hd" style="left:96px;top:140px;font-size:124px">가까워지는 데는<br>순서가 있어요.</h1>
   <p class="a" style="right:100px;top:996px;font-size:32px;font-weight:800;letter-spacing:-0.03em">거리를 지켜 줘서, <span style="color:${C.signal}">댕큐.</span></p>`)]

// Key visual 1080×1350 (portrait, feed)
assets['kv-1080x1350'] = [1080, 1350, shell(1080, 1350, C.ink,
  stage(1080, 1350, stepped({
    x0: 72, late: 64, yTop: 600, gap: (d) => 104 + 21 * d, T: 40, dogX: 770, s: 1.35, xEnd: 1008, sw: 7, numPlace: 'below', inset: 16,
    steps: [{ d: 15, L: 190, size: 150 }, { d: 8, L: 130, size: 108 }, { d: 4, L: 92, size: 76 }, { d: 2, size: 64 }],
  }) + logo({ x: 72, y: 1236, size: 36, tone: 'paper' })) +
  `<p class="a eb" style="left:72px;top:80px;font-size:24px;color:${C.moss}">동네 산책을 위한 거리 약속</p>
   <h1 class="a hd" style="left:68px;top:124px;font-size:112px">가까워지는 데는<br>순서가 있어요.</h1>
   <p class="a" style="left:72px;top:398px;font-size:28px;font-weight:600;color:${C['muted-on-ink']};line-height:1.5;max-width:760px">마주 보지 않고, 같은 방향으로. 멀리서 걷다가 둘 다 편하면 한 단계씩 가까워져요.</p>
   <p class="a" style="right:72px;top:1242px;font-size:30px;font-weight:800;letter-spacing:-0.03em">거리를 지켜 줘서, <span style="color:${C.signal}">댕큐.</span></p>`)]

// OG 1200×630
assets['og-1200x630'] = [1200, 630, shell(1200, 630, C.ink,
  stage(1200, 630, stepped({
    x0: 64, late: 50, yTop: 372, gap: (d) => 84 + 9.5 * d, T: 36, dogX: 930, s: 1.0, xEnd: 1136, sw: 6,
    steps: [{ d: 15, L: 300, size: 92 }, { d: 8, L: 200, size: 66 }, { d: 4, L: 150, size: 48 }, { d: 2, size: 44 }],
  }) + logo({ x: 64, y: 52, size: 32, tone: 'paper' })) +
  `<h1 class="a hd" style="left:60px;top:118px;font-size:78px">가까워지는 데는<br>순서가 있어요.</h1>
   <p class="a" style="right:64px;top:58px;font-size:20px;font-weight:700;color:${C['muted-on-ink']}">우리 개의 편한 거리를 먼저 알려요</p>`)]

// App icon 1024
assets['app-icon-1024'] = [1024, 1024, shell(1024, 1024, C.ink, stage(1024, 1024, mark({ x: 198, y: 274, w: 640, tone: 'paper' })))]

// Poster — A-ratio (A4 @150dpi), for apartment boards / park notice boards. Paper, prints well in 2 colors + black.
{
  const W = 1240, H = 1754, m = 96
  const yLane = 820, yThem = 960
  const g = `
    <line x1="${m}" y1="${yLane}" x2="800" y2="${yLane}" stroke="${C.ink}" stroke-width="10" stroke-linecap="round"/>
    <line x1="1010" y1="${yLane}" x2="${W - m}" y2="${yLane}" stroke="${C.ink}" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 34" opacity=".5"/>
    ${dog({ x: 905, y: yLane, s: 2.1, state: 'calm', color: C.ink, detail: C.paper })}
    <path d="M${m + 20} 1016 C 250 980, 320 ${yThem}, 430 ${yThem} L 700 ${yThem}" fill="none" stroke="${C.signal}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="740" cy="${yThem}" r="15" fill="${C.signal}"/>
    <g stroke="${C['moss-ink']}" stroke-width="3" stroke-linecap="round"><line x1="640" x2="640" y1="${yLane + 20}" y2="${yThem - 20}"/><line x1="628" x2="652" y1="${yLane + 20}" y2="${yLane + 20}"/><line x1="628" x2="652" y1="${yThem - 20}" y2="${yThem - 20}"/></g>
    <text x="620" y="${(yLane + yThem) / 2 - 4}" text-anchor="end" fill="${C['moss-ink']}" style="font:800 30px/1 P;letter-spacing:-0.02em">여기서 한 번,</text>
    <text x="620" y="${(yLane + yThem) / 2 + 34}" text-anchor="end" fill="${C['moss-ink']}" style="font:800 30px/1 P;letter-spacing:-0.02em">물어보는 거리</text>
    <rect x="0" y="${H - 212}" width="${W}" height="212" fill="${C.signal}"/>
    ${mark({ x: W - m - 120, y: H - 150, w: 120, tone: 'mono-ink' })}`
  const rule = (n, t) => `<li style="display:grid;grid-template-columns:84px 1fr;align-items:baseline;border-top:3px solid ${C.ink};padding:22px 0 0"><span class="num" style="font-size:44px;font-weight:880;color:${C['signal-ink']}">${n}</span><span style="font-size:36px;font-weight:700;letter-spacing:-0.03em;line-height:1.35">${t}</span></li>`
  assets['poster-a-ratio'] = [W, H, shell(W, H, C.paper, stage(W, H, g) + `
    <p class="a eb" style="left:${m}px;top:88px;font-size:28px;color:${C['signal-ink']}">우리 동네 산책 부탁</p>
    <h1 class="a hd" style="left:${m - 6}px;top:150px;font-size:168px;line-height:1.02">만지기 전에<br>물어봐 주세요.</h1>
    <p class="a" style="left:${m}px;top:520px;width:${W - m * 2}px;font-size:32px;font-weight:600;line-height:1.5;color:${C.ink}">산책하는 개마다 편한 거리가 달라요. <b style="font-weight:800">“귀엽다”며 다가오는 손</b>이 어떤 개에게는 가장 무서운 순간이에요.</p>
    <ol class="a" style="list-style:none;left:${m}px;top:1070px;width:${W - m * 2}px;display:grid;gap:22px">
      ${rule('01', '다가오기 전에 보호자에게 먼저 물어봐 주세요.')}
      ${rule('02', '괜찮다고 하면, 개가 먼저 다가올 때까지 기다려 주세요.')}
      ${rule('03', '인사 없이 지나가는 것도 좋은 인사예요.')}
    </ol>
    <p class="a" style="left:${m}px;top:1400px;width:${W - m * 2}px;font-size:24px;font-weight:700;line-height:1.5">반려견 가구의 <span class="num" style="color:${C['signal-ink']};font-weight:880">89.4%</span>가 산책하다 낯선 사람의 행동 때문에 불편을 겪었어요.<br><span style="font-size:17px;font-weight:600;color:${C.muted}">출처: KB금융지주 경영연구소 「2025 한국 반려동물 보고서」 보도 인용(데일리벳, 2025)</span></p>
    <p class="a hd" style="left:${m}px;top:${H - 176}px;font-size:76px;color:${C.ink}">거리를 지켜 줘서, 댕큐.</p>
    <p class="a" style="left:${m}px;top:${H - 70}px;font-size:19px;font-weight:600;color:${C.ink}">댕큐 리프로젝트 컨셉 포스터예요. 실제 캠페인·기관과 관계없어요.</p>`)]
}

// Leash tags + bandana — flat concept mockup
{
  const W = 1600, H = 1200
  const tags = [
    { bg: C.moss, t: ['먼저', '물어봐', '주세요'], key: '인사 좋아해요' },
    { bg: C.paper, t: ['냄새', '먼저,', '손은', '나중에'], key: '천천히 인사해요' },
    { bg: C.signal, t: ['인사', '없이', '지나가', '주세요'], key: '인사 없이 지나가요' },
  ]
  const tx0 = 880, tw = 210, th = 480, ty = 300
  let tagSvg = `<path d="M 850 250 C 1000 262, 1300 262, 1560 244" fill="none" stroke="${C.ink}" stroke-width="16" stroke-linecap="round"/>`
  tags.forEach((tg, i) => {
    const x = tx0 + i * 232
    tagSvg += `<line x1="${x + tw / 2}" y1="254" x2="${x + tw / 2}" y2="${ty + 22}" stroke="${C.ink}" stroke-width="4"/>
      <circle cx="${x + tw / 2}" cy="${ty + 30}" r="11" fill="${C['paper-2']}" stroke="${C.ink}" stroke-width="4"/>
      <rect x="${x}" y="${ty}" width="${tw}" height="${th}" rx="30" fill="${tg.bg}" stroke="${C.ink}" stroke-width="${tg.bg === C.paper ? 3 : 0}"/>
      <circle cx="${x + tw / 2}" cy="${ty + 30}" r="11" fill="${C['paper-2']}" stroke="${C.ink}" stroke-width="3"/>
      ${mark({ x: x + 28, y: ty + 70, w: 54, tone: tg.bg === C.paper ? 'ink' : 'mono-ink' })}
      ${tg.t.map((ln, k) => `<text x="${x + 28}" y="${ty + 190 + k * 50}" fill="${C.ink}" style="font:880 42px/1 P;letter-spacing:-0.05em">${ln}</text>`).join('')}
      <line x1="${x + 28}" y1="${ty + th - 60}" x2="${x + tw - 28}" y2="${ty + th - 60}" stroke="${C.ink}" stroke-width="2.5"/>
      <text x="${x + tw - 28}" y="${ty + th - 70}" text-anchor="end" fill="${C.ink}" style="font:880 30px/1 P">m</text>
      <text x="${x + 28}" y="${ty + th - 30}" fill="${C.ink}" style="font:700 17px/1 P">편한 거리 적는 칸</text>`
  })
  const bandana = `
    <path d="M 110 330 L 790 330 L 450 860 Z" fill="${C.signal}" stroke-linejoin="round"/>
    <path d="M 124 332 L 34 314 M 776 332 L 836 314" stroke="${C.signal}" stroke-width="26" stroke-linecap="round" fill="none"/>
    <line x1="170" y1="366" x2="720" y2="366" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
    <line x1="230" y1="396" x2="720" y2="396" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="746" cy="366" r="7" fill="${C.ink}"/><circle cx="746" cy="396" r="7" fill="${C.ink}"/>
    <text x="450" y="520" text-anchor="middle" fill="${C.ink}" style="font:880 64px/1 P;letter-spacing:-0.05em">인사 없이</text>
    <text x="450" y="594" text-anchor="middle" fill="${C.ink}" style="font:880 64px/1 P;letter-spacing:-0.05em">지나가 주세요</text>
    ${mark({ x: 414, y: 650, w: 72, tone: 'mono-ink' })}`
  assets['tag-bandana-mockup'] = [W, H, shell(W, H, C['paper-2'], stage(W, H, bandana + tagSvg) + `
    <p class="a eb" style="left:80px;top:72px;font-size:22px;color:${C['signal-ink']}">컨셉 목업 · 실제 제품이 아니에요</p>
    <h1 class="a" style="left:80px;top:108px;font-size:48px;font-weight:850;letter-spacing:-0.04em">반다나와 리드줄 태그</h1>
    <p class="a" style="left:80px;top:930px;width:700px;font-size:22px;font-weight:600;line-height:1.55;color:${C.muted}">멀리서도 읽히는 한 문장. 시그널 바탕 위에서는 마크를 잉크 한 색으로 써요. 두 선의 상단 띠가 반다나를 두를 때 목선을 따라 나란히 놓여요.</p>
    <div class="a" style="left:880px;top:830px;width:660px;display:grid;gap:12px;font-size:21px;font-weight:600;color:${C.ink}">
      ${tags.map((tg) => `<p style="display:flex;gap:14px;align-items:center"><span style="width:26px;height:26px;border-radius:8px;background:${tg.bg};border:2px solid ${C.ink}"></span>${tg.t.join(' ').replace(', ', ',&nbsp;')} <span style="color:${C.muted}">— 산책 카드 ‘${tg.key}’</span></p>`).join('')}
      <p style="font-size:18px;color:${C.muted};margin-top:8px">태그 문장은 산책 카드의 인사 설정과 같아요. 색만으로 뜻을 전하지 않고 늘 글자와 함께 써요.</p>
    </div>
    <p class="a" style="right:80px;top:1130px;font-size:17px;font-weight:600;color:${C.muted}">코드로 그린 평면 시안 · 댕큐 리프로젝트</p>`)]
}

// Instagram 1/3 — problem
{
  const W = 1080, H = 1350
  const y = 790
  const g = `${pager(0, 'paper')}
    <line x1="80" y1="${y}" x2="400" y2="${y}" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
    <line x1="660" y1="${y}" x2="1000" y2="${y}" stroke="${C.ink}" stroke-width="9" stroke-linecap="round" stroke-dasharray="2 30" opacity=".45"/>
    ${dog({ x: 510, y, s: 2.2, state: 'react', color: C.ink, detail: C.paper, stride: 0 })}
    <path d="M 1000 1000 L 742 ${y - 84}" stroke="${C.signal}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="728" cy="${y - 98}" r="14" fill="${C.signal}"/>
    <text x="800" y="1000" text-anchor="end" fill="${C.muted}" style="font:700 24px/1 P">마주 보고, 곧장 다가올 때</text>`
  assets['insta-1-problem'] = [W, H, shell(W, H, C.paper, stage(W, H, g) + `
    <p class="a eb" style="right:80px;top:70px;font-size:20px;color:${C.muted}">댕큐 · 산책길의 3초</p>
    <p class="a num" style="left:70px;top:132px;font-size:250px;font-weight:880;line-height:1;color:${C['signal-ink']};letter-spacing:-0.06em">89.4%</p>
    <p class="a" style="left:80px;top:400px;width:900px;font-size:32px;font-weight:600;line-height:1.5">반려견 가구 중 산책하다 낯선 사람의 행동 때문에 불편을 겪은 비율. 가장 많은 건 <b>개를 놀라게 하는 행동(48.7%)</b>, 다음이 <b>허락 없이 만지기(39.2%)</b>였어요.</p>
    <p class="a hd" style="left:80px;top:1060px;width:920px;font-size:54px;line-height:1.2;letter-spacing:-0.045em">문제는 친구가 없어서가 아니라, 서로의 거리를 몰라서 생겨요.</p>
    <p class="a" style="left:80px;top:1262px;width:920px;font-size:17px;font-weight:600;color:${C.muted}">출처: KB금융지주 경영연구소 「2025 한국 반려동물 보고서」 보도 인용(데일리벳, 2025)</p>`)]
}

// Instagram 2/3 — idea: the mark IS the sequence
{
  const W = 1080, H = 1350
  const rows = [{ d: 10, gap: 118, t: '첫날, 멀리서 같은 방향으로' }, { d: 6, gap: 74, t: '첫날은 여기까지' }, { d: 4, gap: 44, t: '다음 산책, 이어서' }, { d: 3, gap: 28, t: '인사는 둘 다 원할 때만' }]
  let g = pager(1, 'ink'), y = 470
  rows.forEach((r, i) => {
    const y2 = y + r.gap
    g += `<line x1="80" y1="${y}" x2="470" y2="${y}" stroke="${C.paper}" stroke-width="12" stroke-linecap="round"/>
      <line x1="${80 + 60}" y1="${y2}" x2="470" y2="${y2}" stroke="${C.signal}" stroke-width="12" stroke-linecap="round"/>
      <circle cx="510" cy="${y}" r="11" fill="${C.paper}"/><circle cx="510" cy="${y2}" r="11" fill="${C.signal}"/>
      ${numText({ x: 590, y: y + r.gap / 2 + 30, size: 84, color: i === 3 ? C.moss : C.paper, text: `${r.d}m` })}
      <text x="790" y="${y + r.gap / 2 + 10}" fill="${C['muted-on-ink']}" style="font:700 26px/1 P">${r.t.length > 8 ? r.t.replace(', ', ',</text><text x="790" y="' + (y + r.gap / 2 + 44) + '" fill="' + C['muted-on-ink'] + '" style="font:700 26px/1 P">') : r.t}</text>`
    y = y2 + 110
  })
  assets['insta-2-idea'] = [W, H, shell(W, H, C.ink, stage(W, H, g) + `
    <p class="a eb" style="right:80px;top:70px;font-size:20px;color:${C['muted-on-ink']}">댕큐 · 나란히 첫 산책</p>
    <h1 class="a hd" style="left:76px;top:140px;font-size:96px">마주 보지 말고,<br>나란히 걸어요.</h1>
    <p class="a" style="left:80px;top:1150px;width:920px;font-size:28px;font-weight:600;line-height:1.5;color:${C['muted-on-ink']}">훈련사들이 개를 처음 소개할 때 쓰는 ‘병행 산책’을 네 단계로 나눴어요. <b style="color:${C.paper}">가까워지는 데는 순서가 있어요.</b></p>`)]
}

// Instagram 3/3 — product: the walk card
{
  const W = 1080, H = 1350
  const cardCss = `
  .card{position:absolute;left:380px;top:410px;width:620px;background:${C.ink};color:${C.paper};border-radius:44px;padding:44px;display:grid;gap:22px;box-shadow:0 40px 70px -40px rgba(21,32,26,.7)}
  .card .top{display:flex;justify-content:space-between;align-items:center}
  .card .k{font-size:22px;font-weight:800;letter-spacing:.06em;color:${C['muted-on-ink']}}
  .card .n{font-size:64px;font-weight:850;letter-spacing:-0.04em;line-height:1}
  .card .dist{display:grid;grid-template-columns:1fr auto;align-items:center;gap:22px}
  .card .m{font-size:92px;font-weight:880;color:${C.signal};line-height:1;letter-spacing:-0.05em;text-align:right}
  .card .ml{font-size:20px;font-weight:700;color:${C['muted-on-ink']};text-align:right;margin-top:8px}
  .card .ask{font-size:38px;font-weight:800;color:${C.moss};letter-spacing:-0.03em}
  .card dl{display:grid;gap:12px;border-top:2px solid ${C['ink-3']};padding-top:20px;font-size:24px}
  .card dl div{display:grid;grid-template-columns:7em 1fr;gap:12px}
  .card dt{color:${C['muted-on-ink']};font-weight:600}.card dd{font-weight:600}`
  const lanes = `<svg viewBox="0 0 200 60" width="100%"><line x1="4" y1="10" x2="150" y2="10" stroke="${C.paper}" stroke-width="5" stroke-linecap="round"/><line x1="30" y1="36.4" x2="150" y2="36.4" stroke="${C.signal}" stroke-width="5" stroke-linecap="round"/><circle cx="164" cy="10" r="6" fill="${C.paper}"/><circle cx="164" cy="36.4" r="6" fill="${C.signal}"/></svg>`
  assets['insta-3-product'] = [W, H, shell(W, H, C.signal, stage(W, H, pager(2, 'signal') + logo({ x: 80, y: 1236, size: 34, tone: 'mono-ink' })) + `
    <p class="a eb" style="right:80px;top:70px;font-size:20px;color:${C.ink}">댕큐 · 산책 카드</p>
    <h1 class="a hd" style="left:76px;top:140px;font-size:112px">말 대신<br>화면 한 장.</h1>
    <div class="card" aria-label="뽀리의 산책 카드">
      <div class="top"><span class="k">산책 카드</span><svg width="54" height="40" viewBox="0 0 48 36">${mark({ tone: 'paper' })}</svg></div>
      <p class="n">뽀리</p>
      <div class="dist">${lanes}<div><p class="m num">8m</p><p class="ml">편한 거리</p></div></div>
      <p class="ask">냄새 먼저, 손은 나중에</p>
      <dl><div><dt>인사</dt><dd>천천히 인사해요</dd></div><div><dt>걸음</dt><dd>느긋하게 · 중형</dd></div><div><dt>조심해 주세요</dt><dd>자전거·킥보드, 뛰어오는 아이</dd></div></dl>
    </div>
    <p class="a" style="left:80px;top:1060px;width:920px;font-size:38px;font-weight:800;letter-spacing:-0.035em;line-height:1.35">누가 다가오면, 설명하는 대신<br>이 화면을 보여 주세요.</p>
    <p class="a" style="right:80px;top:1240px;font-size:26px;font-weight:800;letter-spacing:-0.02em">우리 개의 거리부터 알려 주세요 →</p>`, cardCss)]
}

/* ---------------------------------------------------------------- vector logo files */
function svgFile(w, h, inner, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(w)} ${r2(h)}" width="${r2(w)}" height="${r2(h)}" role="img" aria-label="${title}"><title>${title}</title>${inner}</svg>\n`
}
const vectors = {}
{
  // Mark: clear space = one dot diameter (10 of 48 units) on every side is included in the file.
  const pad = 10
  vectors['mark.svg'] = svgFile(48 + pad * 2, 36 + pad * 2, mark({ x: pad, y: pad, tone: 'ink' }), '댕큐 마크')
  vectors['mark-paper.svg'] = svgFile(48 + pad * 2, 36 + pad * 2, mark({ x: pad, y: pad, tone: 'paper' }), '댕큐 마크 (어두운 바탕용)')
  const size = 100, pw = size * 1.2 * (10 / 48)
  const w = logoWidth(size) + pw * 2, h = size * 0.9 + pw * 2
  vectors['logo-horizontal-paper.svg'] = svgFile(w, h, logo({ x: pw, y: pw, size, tone: 'paper' }), '댕큐 로고 (어두운 바탕용)')
  vectors['logo-horizontal-ink.svg'] = svgFile(w, h, logo({ x: pw, y: pw, size, tone: 'ink' }), '댕큐 로고 (밝은 바탕용)')
  vectors['app-icon.svg'] = svgFile(1024, 1024, `<rect width="1024" height="1024" fill="${C.ink}"/>` + mark({ x: 198, y: 274, w: 640, tone: 'paper' }), '댕큐 앱 아이콘')
}

/* ---------------------------------------------------------------- render */
for (const [name, svg] of Object.entries(vectors)) {
  writeFileSync(join(ASSETS, name), svg)
  copyFileSync(join(ASSETS, name), join(PUBLIC, name))
}
const only = process.argv.slice(2)
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ deviceScaleFactor: 1 })
for (const [name, [w, h, html]] of Object.entries(assets)) {
  if (only.length && !only.includes(name)) continue
  const src = join(HERE, `${name}.html`)
  writeFileSync(src, html)
  await page.setViewportSize({ width: w, height: h })
  await page.goto('file://' + src)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(80)
  await page.screenshot({ path: join(ASSETS, `${name}.png`), clip: { x: 0, y: 0, width: w, height: h } })
  console.log('rendered', name, `${w}x${h}`)
}
await browser.close()

// web copies: everything the site links to
const WEB = ['kv-1920x1080', 'kv-1080x1350', 'og-1200x630', 'app-icon-1024', 'poster-a-ratio', 'tag-bandana-mockup', 'insta-1-problem', 'insta-2-idea', 'insta-3-product']
for (const n of WEB) { try { copyFileSync(join(ASSETS, `${n}.png`), join(PUBLIC, `${n}.png`)) } catch { /* not rendered in this run */ } }
