import type { DogCard, Greeting, Pace, Slot } from './store'

/** Demo neighbours. Fictional dogs, no real people or photos. Used only in 체험 모드. */
export interface Neighbor extends Omit<DogCard, 'updatedAt' | 'note'> {
  id: string
  hood: string
  walkedTogether: string // plain description of their usual route
  note: string
}

export const NEIGHBORS: Neighbor[] = [
  { id: 'dubu', name: '두부', size: 'small', pace: 'slow', greeting: 'slow', comfort: 6, triggers: ['bike'], slots: ['morning', 'evening'], hood: '망원동', walkedTogether: '망원한강공원 산책로', note: '처음엔 뒤에서 따라 걷는 걸 좋아해요.' },
  { id: 'mango', name: '망고', size: 'medium', pace: 'steady', greeting: 'pass', comfort: 12, triggers: ['bigdog', 'noise'], slots: ['dawn', 'night'], hood: '망원동', walkedTogether: '성미산 둘레길', note: '인사보다 같이 걷는 걸 더 편해해요.' },
  { id: 'kong', name: '콩이', size: 'small', pace: 'brisk', greeting: 'hello', comfort: 3, triggers: ['touch'], slots: ['morning', 'evening'], hood: '합정동', walkedTogether: '합정 당인리 길', note: '사람은 좋아하지만 손이 갑자기 오면 놀라요.' },
  { id: 'bori', name: '보리', size: 'large', pace: 'slow', greeting: 'slow', comfort: 8, triggers: ['kids', 'bike'], slots: ['evening', 'night'], hood: '망원동', walkedTogether: '망원시장 뒷길', note: '큰 덩치지만 겁이 많아요.' },
  { id: 'hodu', name: '호두', size: 'medium', pace: 'brisk', greeting: 'hello', comfort: 4, triggers: [], slots: ['dawn', 'morning'], hood: '서교동', walkedTogether: '경의선숲길', note: '에너지가 많아요. 긴 산책을 좋아해요.' },
  { id: 'sol', name: '솔', size: 'small', pace: 'steady', greeting: 'pass', comfort: 15, triggers: ['smalldog', 'bigdog', 'touch'], slots: ['night'], hood: '망원동', walkedTogether: '한강 둔치 가장자리', note: '다른 개를 연습 중이에요. 멀리서부터 천천히요.' },
]

export const HOODS = ['망원동', '합정동', '서교동', '연남동']

const PACE_ORDER: Pace[] = ['slow', 'steady', 'brisk']

export interface Fit {
  score: number // 0–3, count of matched conditions
  start: number // start distance for 나란히 = larger comfort of the two, rounded up to a step
  reasons: string[]
  cautions: string[]
  sharedSlots: Slot[]
}

export const STEP_DISTANCES = [20, 15, 12, 10, 8, 6, 4, 3, 2]

export function startDistance(a: number, b: number) {
  const need = Math.max(a, b) + 2 // start a little farther than either dog needs
  return [...STEP_DISTANCES].reverse().find((d) => d >= need) ?? 20
}

/** 나란히 ladder: start → ~2/3 → ~2/5 → 2m. Snapped to STEP_DISTANCES, unique, descending. */
export function ladder(start: number) {
  const snap = (x: number) => STEP_DISTANCES.reduce((best, d) => (Math.abs(d - x) < Math.abs(best - x) ? d : best), 20)
  return [...new Set([start, snap(start * 0.66), snap(start * 0.4), 2])].filter((d) => d <= start).sort((x, y) => y - x)
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

  if (me.triggers.includes('bigdog') && n.size === 'large') cautions.push(`${n.name}는 대형견이에요`)
  if (me.triggers.includes('smalldog') && n.size === 'small') cautions.push(`${n.name}는 소형견이에요`)

  return { score: reasons.length, start: startDistance(me.comfort, n.comfort), reasons, cautions, sharedSlots }
}

function greetingCompatible(a: Greeting, b: Greeting) {
  if (a === 'pass' || b === 'pass') return a === b
  return true
}
