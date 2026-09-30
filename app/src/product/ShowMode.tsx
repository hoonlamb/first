import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GREETING_ASK, TRIGGER_LABEL, useStore } from '../lib/store'
import { Mark } from '../components/Logo'

/**
 * Signature interaction #4 — 보여주기.
 * Outdoor, one-handed, shown to a stranger: maximum type, paper background for sunlight, no chrome except close.
 */
export function ShowMode() {
  const card = useStore((s) => s.card)!
  const nav = useNavigate()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [awake, setAwake] = useState<'on' | 'off' | 'unsupported'>(() => ('wakeLock' in navigator ? 'off' : 'unsupported'))
  const ask = GREETING_ASK[card.greeting]

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') nav('/app') }
    window.addEventListener('keydown', onKey)
    // keep the screen on while showing (graceful fallback when unsupported)
    let lock: { release: () => Promise<void> } | null = null
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
    wl?.request('screen').then((l) => { lock = l; setAwake('on') }).catch(() => setAwake('unsupported'))
    return () => { window.removeEventListener('keydown', onKey); lock?.release().catch(() => {}) }
  }, [nav])

  return (
    <div className={`showmode showmode--${card.greeting}`} role="dialog" aria-modal="true" aria-labelledby="show-ask">
      <div className="showmode__bar">
        <span className="showmode__brand"><Mark tone={card.greeting === 'pass' ? 'paper' : 'ink'} size={28} /> {card.name}의 산책 카드</span>
        <button ref={closeRef} className="btn btn-ink showmode__close" onClick={() => nav('/app')}>닫기</button>
      </div>
      <div className="showmode__body">
        <p id="show-ask" className="showmode__ask">{ask.title}</p>
        <p className="showmode__line">{ask.body}</p>
        <p className="showmode__dist"><b className="num">{card.comfort}m</b> {card.name}는 이 정도 떨어져 있을 때 편안해요.</p>
        {card.triggers.length > 0 && (
          <p className="showmode__care">조심해 주세요 · {card.triggers.map((t) => TRIGGER_LABEL[t]).join(', ')}</p>
        )}
      </div>
      <p className="showmode__thanks">거리를 지켜 줘서, 댕큐.</p>
      <p className="sr-only" aria-live="polite">{awake === 'on' ? '보여주는 동안 화면이 꺼지지 않아요.' : ''}</p>
    </div>
  )
}
