import { getState, setState } from './store'

/** Badges (댕댕인증소). Earned only from real actions in the prototype; nothing is pre-granted. */
export interface BadgeDef { id: string; emoji: string; title: string; how: string; tag: '나란히' | '산책' | '카드' | '장소' }
export const BADGES: BadgeDef[] = [
  { id: 'card', emoji: '🪪', title: '산책 카드 발급', how: '산책 카드를 처음 만들면', tag: '카드' },
  { id: 'show', emoji: '📣', title: '말 대신 화면 한 장', how: '보여주기를 처음 열면', tag: '카드' },
  { id: 'first-walk', emoji: '🐾', title: '첫 산책 기록', how: '산책 기록을 처음 남기면', tag: '산책' },
  { id: 'first-together', emoji: '👣', title: '첫 나란히', how: '첫 나란히 산책을 마치면', tag: '나란히' },
  { id: 'step-back', emoji: '↩️', title: '물러나는 용기', how: '긴장해서 한 단계 물러나 다시 걸으면', tag: '나란히' },
  { id: 'closer', emoji: '🤝', title: '한 걸음 더 가까이', how: '같은 이웃과 두 번째 나란히를 마치면', tag: '나란히' },
  { id: 'review', emoji: '💌', title: '고마움 전하기', how: '나란히 후기를 처음 남기면', tag: '나란히' },
  { id: 'place', emoji: '📍', title: '멍슐랭 탐험가', how: '장소를 처음 저장하면', tag: '장소' },
]

/** Award once. Returns the badge if it was newly earned (so the caller can show the 획득 모달). */
export function awardBadge(id: string): BadgeDef | null {
  const def = BADGES.find((b) => b.id === id)
  if (!def || getState().badges.includes(id)) return null
  setState((s) => ({ ...s, badges: [...s.badges, id] }))
  return def
}
