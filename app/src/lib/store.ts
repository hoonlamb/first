import { useSyncExternalStore } from 'react'

export type Size = 'small' | 'medium' | 'large'
export type Pace = 'slow' | 'steady' | 'brisk'
export type Greeting = 'hello' | 'slow' | 'pass'
export type Reaction = 'calm' | 'alert' | 'react'
export type Trigger = 'bike' | 'bigdog' | 'kids' | 'touch' | 'noise' | 'smalldog'
export type Slot = 'dawn' | 'morning' | 'evening' | 'night'

export interface DogCard {
  name: string
  size: Size
  pace: Pace
  greeting: Greeting
  comfort: number // meters, 1–20
  triggers: Trigger[]
  slots: Slot[]
  note: string
  updatedAt: number
}

export interface Encounter { at: number; distance: number | null; reaction: Reaction }
export interface Walk { id: string; startedAt: number; endedAt: number; encounters: Encounter[]; applied?: number }

export interface TogetherStep { distance: number; result: 'both-calm' | 'tense' | 'stopped' }
export interface Bond {
  neighborId: string
  sessions: { at: number; steps: TogetherStep[]; closest: number | null; endedEarly: boolean }[]
}

export interface ActiveTogether {
  neighborId: string
  steps: number[]
  i: number
  phase: 'intro' | 'walking' | 'check' | 'tense' | 'greet'
  log: TogetherStep[]
  canGreet: boolean
  startedAt: number
}

export interface RequestState { status: 'pending' | 'accepted'; at: number; slot: Slot | null }
export interface State {
  card: DogCard | null
  walks: Walk[]
  activeWalk: Walk | null
  requests: Record<string, RequestState>
  bonds: Record<string, Bond>
  location: 'unknown' | 'granted' | 'denied' | 'manual'
  neighborhood: string | null
  activeTogether: ActiveTogether | null
  hidden: string[] // neighbours the user chose not to see (local block)
}

const KEY = 'dangq.demo.v1'
const empty: State = { card: null, walks: [], activeWalk: null, requests: {}, bonds: {}, location: 'unknown', neighborhood: null, activeTogether: null, hidden: [] }

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    return { ...empty, ...JSON.parse(raw) }
  } catch {
    return empty
  }
}

let state: State = load()
const listeners = new Set<() => void>()

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode: keep in memory */ }
}

export function setState(fn: (s: State) => State) {
  state = fn(state)
  persist()
  listeners.forEach((l) => l())
}

export function resetDemo() {
  state = empty
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  listeners.forEach((l) => l())
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l) },
    () => select(state),
  )
}

export const getState = () => state

/* ---------- labels (single source for copy) ---------- */
export const SIZE_LABEL: Record<Size, string> = { small: '소형', medium: '중형', large: '대형' }
export const PACE_LABEL: Record<Pace, string> = { slow: '느긋하게', steady: '꾸준하게', brisk: '씩씩하게' }
export const GREETING_LABEL: Record<Greeting, string> = { hello: '인사 좋아해요', slow: '천천히 인사해요', pass: '인사 없이 지나가요' }
export const GREETING_ASK: Record<Greeting, { title: string; body: string }> = {
  hello: { title: '먼저 물어봐 주세요', body: '괜찮은지 물어봐 주시면 반갑게 인사할게요.' },
  slow: { title: '냄새 먼저, 손은 나중에', body: '서로 냄새 맡을 시간을 먼저 주세요. 쓰다듬기는 그다음이에요.' },
  pass: { title: '인사 없이 지나가 주세요', body: '인사하지 않고 지나가 주시는 게 이 친구에게는 가장 큰 배려예요.' },
}
export const TRIGGER_LABEL: Record<Trigger, string> = {
  bike: '자전거·킥보드', bigdog: '큰 개', smalldog: '작은 개', kids: '뛰어오는 아이', touch: '갑자기 만지는 손', noise: '큰 소리',
}
export const SLOT_LABEL: Record<Slot, string> = { dawn: '이른 아침', morning: '오전', evening: '저녁', night: '밤' }
export const REACTION_LABEL: Record<Reaction, string> = { calm: '편안했어요', alert: '긴장했어요', react: '반응했어요' }

/** closest distance at which the dog stayed calm in logged encounters */
export function closestCalm(walks: Walk[]): number | null {
  const calm = walks.flatMap((w) => w.encounters).filter((e) => e.reaction === 'calm' && e.distance !== null).map((e) => e.distance as number)
  return calm.length ? Math.min(...calm) : null
}

/** How a dog with a given comfort distance feels at a distance. Same rule everywhere (hero, builder, walk). */
export function reactionAt(distance: number, comfort: number): Reaction {
  if (distance >= comfort) return 'calm'
  if (distance >= comfort * 0.5) return 'alert'
  return 'react'
}

/**
 * Card-distance suggestion after a walk. Widening (safer) always wins over narrowing.
 * - widen: any tense/react encounter at or beyond the card distance → farthest such distance + 2m.
 * - narrow: never if any tense/react was logged without a distance; otherwise only with ≥3 calm encounters across ≥2 walks, all closer than the card, and no tense/react
 *   within 2m of them in any walk → the closest distance that is still ≥ (farthest tense/react + 2m).
 */
export function suggestComfort(card: DogCard, walks: Walk[]): { to: number; kind: 'widen' | 'narrow' } | null {
  const all = walks.flatMap((w) => w.encounters.map((e) => ({ ...e, walk: w.id }))).filter((e) => e.distance !== null) as (Encounter & { distance: number; walk: string })[]
  const bad = all.filter((e) => e.reaction !== 'calm').map((e) => e.distance)
  const worst = bad.length ? Math.max(...bad) : 0
  if (worst >= card.comfort) return { to: Math.min(20, worst + 2), kind: 'widen' }
  const badNoDistance = walks.some((w) => w.encounters.some((e) => e.reaction !== 'calm' && e.distance === null))
  if (badNoDistance) return null // a reaction without distance: we can't prove a smaller distance is safe
  const calmClose = all.filter((e) => e.reaction === 'calm' && e.distance < card.comfort && e.distance >= worst + 2)
  const walksWithCalm = new Set(calmClose.map((e) => e.walk)).size
  if (calmClose.length >= 3 && walksWithCalm >= 2) {
    const to = Math.max(...[Math.min(...calmClose.map((e) => e.distance)), worst + 2, 1])
    if (to < card.comfort) return { to, kind: 'narrow' }
  }
  return null
}

export const uid = () => Math.random().toString(36).slice(2, 9)
