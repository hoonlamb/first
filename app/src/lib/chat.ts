import type { Meet, Message } from './store'
import { getState, setState, uid } from './store'

/** Append a message to a neighbour's thread. */
export function sendMessage(neighborId: string, msg: Omit<Message, 'id' | 'at'>) {
  const m: Message = { ...msg, id: uid(), at: Date.now() }
  setState((s) => ({ ...s, threads: { ...s.threads, [neighborId]: [...(s.threads[neighborId] ?? []), m] } }))
  return m
}

/** Propose a meet: stores it (unconfirmed), posts a meet card, and the demo partner confirms ~1.5s later. */
export function proposeMeet(neighborId: string, meet: Omit<Meet, 'confirmed'>) {
  setState((s) => ({ ...s, meets: { ...s.meets, [neighborId]: { ...meet, confirmed: false } } }))
  sendMessage(neighborId, { from: 'me', meet: { ...meet, confirmed: false } })
  setTimeout(() => {
    const cur = getState().meets[neighborId]
    if (!cur || cur.confirmed || cur.date !== meet.date || cur.time !== meet.time) return
    setState((s) => ({ ...s, meets: { ...s.meets, [neighborId]: { ...cur, confirmed: true } } }))
    sendMessage(neighborId, { from: 'them', text: '좋아요, 그때 봬요! 첫날은 멀리서 같은 방향으로 걸어요 🙂' })
  }, 1500)
}

export const unreadCount = () => Object.values(getState().threads).filter((t) => t.length && t[t.length - 1].from === 'them').length
