import type { Meet, Message } from './store'
import { getState, setState, uid } from './store'

/** Append a message to a neighbour's thread. */
export function sendMessage(neighborId: string, msg: Omit<Message, 'id' | 'at'>) {
  const m: Message = { ...msg, id: uid(), at: Date.now() }
  setState((s) => ({ ...s, threads: { ...s.threads, [neighborId]: [...(s.threads[neighborId] ?? []), m] } }))
  return m
}

/** Propose a meet: stores it (unconfirmed), posts a meet card, and the demo partner confirms ~1.5s later. */
export const MEET_CONFIRM_MS = 1500

export function proposeMeet(neighborId: string, meet: Omit<Meet, 'confirmed' | 'proposedAt'>) {
  const proposedAt = Date.now()
  setState((s) => ({ ...s, meets: { ...s.meets, [neighborId]: { ...meet, confirmed: false, proposedAt } } }))
  sendMessage(neighborId, { from: 'me', meet: { ...meet, confirmed: false } })
  // Confirmation itself is driven by confirmPendingMeets (HfApp) so it survives a reload.
}

/** Demo partner confirms any proposed meet ~1.5s after it was proposed (also after a reload). */
export function confirmMeet(neighborId: string) {
  const cur = getState().meets[neighborId]
  if (!cur || cur.confirmed) return
  setState((s) => ({ ...s, meets: { ...s.meets, [neighborId]: { ...cur, confirmed: true } } }))
  sendMessage(neighborId, { from: 'them', text: '좋아요, 그때 봬요! 첫날은 멀리서 같은 방향으로 걸어요 🙂' })
}

/** A thread is unread when its last message is from them and it grew since the user last opened it. */
export function isUnread(id: string, s = getState()) {
  const t = s.threads[id] ?? []
  return t.length > 0 && t[t.length - 1].from === 'them' && t.length > (s.seen[id] ?? 0)
}
export function unreadIds(s = getState()) { return Object.keys(s.threads).filter((id) => isUnread(id, s)) }
export function markRead(id: string) {
  const len = getState().threads[id]?.length ?? 0
  if ((getState().seen[id] ?? 0) >= len) return
  setState((s) => ({ ...s, seen: { ...s.seen, [id]: len } }))
}
