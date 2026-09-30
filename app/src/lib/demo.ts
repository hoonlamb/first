import type { DogCard, Greeting, Pace, Slot } from './store'
import { josa } from './korean'

/** Demo neighbours. Fictional dogs, no real people or photos. Used only in 체험 모드. */
export interface Neighbor extends Omit<DogCard, 'updatedAt' | 'note'> {
  id: string
  hood: string
  walkedTogether: string // plain description of their usual route
  note: string
  photo: string
  breed: string
  age: number
  sex: 'm' | 'f'
  owner: string // owner nickname (no real person, no photo)
  likes: string[] // emoji chips
}

export const NEIGHBORS: Neighbor[] = [
  { id: 'dubu', name: '두부', photo: 'photos/dog-07-pomeranian.jpg', breed: '포메라니안', age: 3, sex: 'm', owner: '두부아빠', likes: ['🌳 공원 산책', '🎾 공놀이', '🍠 고구마'], size: 'small', pace: 'slow', greeting: 'slow', comfort: 6, triggers: ['bike'], slots: ['morning', 'evening'], hood: '망원동', walkedTogether: '망원한강공원 산책로', note: '처음엔 뒤에서 따라 걷는 걸 좋아해요.' },
  { id: 'mango', name: '망고', photo: 'photos/dog-05-labrador.jpg', breed: '래브라도 리트리버', age: 5, sex: 'f', owner: '망고네', likes: ['🌊 물놀이', '🌙 밤 산책', '🦴 개껌'], size: 'medium', pace: 'steady', greeting: 'pass', comfort: 15, triggers: ['bigdog', 'noise'], slots: ['dawn', 'night'], hood: '망원동', walkedTogether: '성미산 둘레길', note: '인사보다 같이 걷는 걸 더 편해해요.' },
  { id: 'kong', name: '콩이', photo: 'photos/dog-02-chihuahua.jpg', breed: '치와와', age: 2, sex: 'f', owner: '콩이누나', likes: ['🧸 인형 놀이', '☀️ 햇볕', '🧀 치즈볼'], size: 'small', pace: 'brisk', greeting: 'hello', comfort: 3, triggers: ['touch'], slots: ['morning', 'evening'], hood: '합정동', walkedTogether: '합정 당인리 길', note: '사람은 좋아하지만 손이 갑자기 오면 놀라요.' },
  { id: 'bori', name: '보리', photo: 'photos/dog-03-bori-terrier.jpg', breed: '믹스(테리어)', age: 4, sex: 'm', owner: '보리누나', likes: ['🍂 낙엽 밟기', '🐾 냄새 맡기', '🥕 당근'], size: 'large', pace: 'slow', greeting: 'slow', comfort: 8, triggers: ['kids', 'bike'], slots: ['evening', 'night'], hood: '망원동', walkedTogether: '망원시장 뒷길', note: '큰 덩치지만 겁이 많아요.' },
  { id: 'hodu', name: '호두', photo: 'photos/dog-01-corgi.jpg', breed: '웰시코기', age: 3, sex: 'm', owner: '호두집사', likes: ['🏃 달리기', '🥏 원반', '🍗 닭가슴살'], size: 'medium', pace: 'brisk', greeting: 'hello', comfort: 4, triggers: [], slots: ['dawn', 'morning'], hood: '서교동', walkedTogether: '경의선숲길', note: '에너지가 많아요. 긴 산책을 좋아해요.' },
  { id: 'sol', name: '솔', photo: 'photos/dog-06-frenchie.jpg', breed: '프렌치 불도그', age: 6, sex: 'f', owner: '솔이엄마', likes: ['🛋️ 낮잠', '🌙 조용한 길', '🍎 사과'], size: 'small', pace: 'steady', greeting: 'pass', comfort: 15, triggers: ['smalldog', 'bigdog', 'touch'], slots: ['night'], hood: '망원동', walkedTogether: '한강 둔치 가장자리', note: '다른 개를 연습 중이에요. 멀리서부터 천천히요.' },
]

export const HOODS = ['망원동', '합정동', '서교동', '연남동']

const PACE_ORDER: Pace[] = ['slow', 'steady', 'brisk']

export interface Fit {
  score: number // 0–3, count of matched conditions
  reasons: string[]
  cautions: string[]
  sharedSlots: Slot[]
}

/**
 * 나란히 rules (single source; see outputs/03_strategy/strategy.md §6).
 * - Start: the first step value at least 2m beyond the farther dog's comfortable distance (and ≥1.5× the floor).
 * - Floor: a session never guides closer than its floor.
 *     first session: max(6m, 60% of the larger comfort)   — 6m ≈ AKC CGC "reaction to another dog" test distance (~20ft, S74)
 *     later sessions: max(3m, 40% of the larger comfort)
 * - Each step closes at most 35% of the current distance.
 * - Next session starts one step farther than the last calm distance (warm-up), never at it.
 * - Greeting: never in the first session; later only if both greet and both comforts ≤ 8m.
 * - Pro gate: if either dog needs 12m or more, the walk is offered only with a trainer (준비 중).
 */
export const STEP_DISTANCES = [30, 25, 20, 18, 15, 12, 10, 8, 6, 5, 4, 3, 2]
const ASC = [...STEP_DISTANCES].sort((a, b) => a - b)
export const PRO_THRESHOLD = 12

export function startDistance(a: number, b: number) {
  // At least 2m beyond the farther dog, and far enough above the first-session floor to leave room for steps.
  const need = Math.max(Math.max(a, b) + 2, floorDistance(a, b, 0) * 1.5)
  return ASC.find((d) => d >= need) ?? 30
}

export function floorDistance(a: number, b: number, sessionIndex: number) {
  const m = Math.max(a, b)
  return sessionIndex === 0 ? Math.max(6, Math.round(m * 0.6)) : Math.max(3, Math.round(m * 0.4))
}

export function ladder(start: number, floor: number) {
  const out = [start]
  let cur = start
  for (;;) {
    const next = ASC.find((d) => d < cur && d >= Math.max(floor, cur * 0.65))
    if (next === undefined) break
    out.push(next)
    cur = next
  }
  return out
}

export function stepAbove(d: number) {
  return ASC.find((x) => x > d) ?? ASC[ASC.length - 1]
}

export interface Plan {
  sessionIndex: number
  start: number
  floor: number
  steps: number[]
  canGreet: boolean
  needsPro: boolean
  resumed: boolean
}

type Comfy = Pick<DogCard, 'comfort' | 'greeting'>
/** The one function every screen uses for "where do we start and how far do we go". */
export function planFor(me: Comfy, n: Comfy, sessions: { closest: number | null }[] = []): Plan {
  // Only sessions where both dogs were calm at some step count as a meeting; a walk stopped before that
  // (or a stopped-at-start one) keeps the first-meeting rules (no greeting, 6m floor).
  const sessionIndex = sessions.filter((x) => x.closest !== null).length
  const lastCalm = [...sessions].reverse().find((s) => s.closest !== null)?.closest ?? null
  const floor = floorDistance(me.comfort, n.comfort, sessionIndex)
  const fresh = startDistance(me.comfort, n.comfort)
  const start = lastCalm !== null ? Math.max(stepAbove(lastCalm), floor) : fresh
  return {
    sessionIndex,
    start,
    floor,
    steps: ladder(start, floor),
    canGreet: sessionIndex > 0 && me.greeting !== 'pass' && n.greeting !== 'pass' && Math.max(me.comfort, n.comfort) <= 8,
    needsPro: Math.max(me.comfort, n.comfort) >= PRO_THRESHOLD,
    resumed: lastCalm !== null,
  }
}

export function fit(me: Pick<DogCard, 'pace' | 'greeting' | 'comfort' | 'slots' | 'size' | 'triggers'>, n: Neighbor): Fit {
  const reasons: string[] = []
  const cautions: string[] = []
  const paceGap = Math.abs(PACE_ORDER.indexOf(me.pace) - PACE_ORDER.indexOf(n.pace))
  if (paceGap === 0) reasons.push('걷는 속도가 같아요')
  else if (paceGap === 1) reasons.push('걷는 속도가 비슷해요')
  else cautions.push('걷는 속도 차이가 커요')

  const greetOk = greetingCompatible(me.greeting, n.greeting)
  if (greetOk) reasons.push('인사 방식이 맞아요')
  else cautions.push('인사 방식이 달라요 — 인사 없이 나란히만 걸어요')

  const sharedSlots = me.slots.filter((s) => n.slots.includes(s))
  if (sharedSlots.length) reasons.push('산책 시간대가 겹쳐요')

  if (me.triggers.includes('bigdog') && n.size === 'large') cautions.push(`${josa(n.name, '은/는')} 대형견이에요`)
  if (me.triggers.includes('smalldog') && n.size === 'small') cautions.push(`${josa(n.name, '은/는')} 소형견이에요`)

  return { score: reasons.length, reasons, cautions, sharedSlots }
}

function greetingCompatible(a: Greeting, b: Greeting) {
  if (a === 'pass' || b === 'pass') return a === b
  return true
}
