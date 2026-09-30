import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GREETING_ASK, TRIGGER_LABEL, useStore } from '../lib/store'
import { distanceWords, josa } from '../lib/korean'
import { Mark } from '../components/Logo'

/**
 * Signature interaction #4 — 보여주기.
 * Outdoor, one-handed, shown to a stranger. First line = what the person should do now;
 * second = how far to keep another dog, in steps (people can't judge "8m").
 */
export function ShowMode() {
  const card = useStore((s) => s.card)!
  const nav = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [awake, setAwake] = useState<'on' | 'off' | 'unsupported'>(() => ('wakeLock' in navigator ? 'off' : 'unsupported'))
  const ask = GREETING_ASK[card.greeting]
  const close = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) nav(-1)
    else nav('/app')
  }

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return }
      if (e.key === 'Tab') { e.preventDefault(); closeRef.current?.focus() } // only one control: keep focus inside
    }
    window.addEventListener('keydown', onKey)
    let lock: { release: () => Promise<void> } | null = null
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
    wl?.request('screen').then((l) => { lock = l; setAwake('on') }).catch(() => setAwake('unsupported'))
    return () => { window.removeEventListener('keydown', onKey); lock?.release().catch(() => {}) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lines = ask.title.split(', ')
  return (
    <div ref={rootRef} className={`showmode showmode--${card.greeting}`} role="dialog" aria-modal="true" aria-labelledby="show-ask">
      <div className="showmode__bar">
        <span className="showmode__brand"><Mark tone={card.greeting === 'pass' ? 'paper' : 'ink'} size={28} /> {card.name}의 산책 카드</span>
        <button ref={closeRef} className="btn btn-ink showmode__close" onClick={close}>닫기</button>
      </div>
      <div className="showmode__body">
        <h1 id="show-ask" className="showmode__ask">{lines.map((line, k) => <span key={line}>{line}{k < lines.length - 1 && <>{', '}<br /></>}</span>)}</h1>
        <p className="showmode__line">{ask.body}</p>
        <p className="showmode__dist">개와 함께라면 <b>{distanceWords(card.comfort)}</b> 떨어져 지나가 주세요. <span className="num">(약 {card.comfort}m)</span></p>
        {card.triggers.length > 0 && (
          <p className="showmode__care">{josa(card.name, '은/는')} {card.triggers.map((t) => TRIGGER_LABEL[t]).join(', ')}에 놀라요</p>
        )}
      </div>
      <p className="showmode__thanks">거리를 지켜 줘서, 댕큐.</p>
      <p className="sr-only" aria-live="polite">{awake === 'on' ? '보여주는 동안 화면이 꺼지지 않아요.' : ''}</p>
    </div>
  )
}
