import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export const asset = (p: string) => (p.startsWith('data:') || p.startsWith('http') ? p : `./${p}`)

/** Header for tab roots: logo left, actions right. */
export function RootHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="hf-header">
      <Link to="/app" className="hf-logo" aria-label="댕큐 홈"><img src={asset('photos/mascot.png')} alt="" />댕큐</Link>
      <div className="hf-header__actions">{children}</div>
    </header>
  )
}

/** Header for sub screens: back, centered title, optional right action. */
export function SubHeader({ title, back, right, onBack }: { title: string; back?: string; right?: ReactNode; onBack?: () => void }) {
  const nav = useNavigate()
  const goBack = () => {
    if (onBack) return onBack()
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) nav(-1)
    else nav(back ?? '/app')
  }
  return (
    <header className="hf-header hf-header--sub">
      <button className="hf-iconbtn" onClick={goBack} aria-label="뒤로"><ChevronLeft size={26} strokeWidth={2} /></button>
      <h1 className="hf-header__title">{title}</h1>
      <div className="hf-header__actions">{right}</div>
    </header>
  )
}

export function Section({ title, sub, more, children, id }: { title: string; sub?: string; more?: { to: string; label?: string }; children: ReactNode; id?: string }) {
  return (
    <section className="hf-section" aria-labelledby={id}>
      <div className="hf-section__head">
        <div>
          <h2 id={id} className="hf-h2">{title}</h2>
          {sub && <p className="hf-sub">{sub}</p>}
        </div>
        {more && <Link to={more.to} className="hf-section__more">{more.label ?? '더보기'}</Link>}
      </div>
      {children}
    </section>
  )
}

/** Bottom sheet on native <dialog> (focus trap + Esc). */
export function Sheet({ open, onClose, title, children, center = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; center?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) { d.close(); settle() }
  }, [open])
  useEffect(() => { const d = ref.current; return () => { if (d?.open) settle() } }, [])
  const id = `sheet-${title.replace(/\s/g, '')}`
  return (
    <dialog ref={ref} className={`hf-sheet ${center ? 'hf-sheet--center' : ''}`} aria-labelledby={id} onClose={onClose}
      onCancel={(e) => { e.preventDefault(); onClose() }} onClick={(e) => { if (e.target === ref.current) onClose() }}>
      {!center && <div className="hf-sheet__grab" aria-hidden="true" />}
      <div className="hf-sheet__inner">
        <h2 id={id} className="hf-sheet__title">{title}</h2>
        {children}
      </div>
    </dialog>
  )
}

function settle() {
  document.body.classList.add('is-settling')
  setTimeout(() => document.body.classList.remove('is-settling'), 350)
}

export function Toast({ message }: { message: string | null }) {
  return <div className={`hf-toast ${message ? 'is-on' : ''}`} role="status" aria-live="polite">{message}</div>
}

export function Avatar({ src, alt = '', size }: { src?: string; alt?: string; size?: 'sm' | 'lg' }) {
  return <span className={`hf-avatar ${size ? `hf-avatar--${size}` : ''}`}>{src && <img src={asset(src)} alt={alt} />}</span>
}

/** Pink-theme distance graphic: two lanes, the gap is the distance (same idea as the brand's Lanes). */
export function MiniLanes({ distance, max = 20, label = true }: { distance: number; max?: number; label?: boolean }) {
  const t = Math.min(Math.max(distance / max, 0), 1)
  const gap = 10 + t * 34
  return (
    <svg viewBox="0 0 160 60" width="100%" height="60" aria-hidden="true" className="hf-minilanes">
      <line x1="6" y1={30 - gap / 2} x2="126" y2={30 - gap / 2} stroke="#2A2A2A" strokeWidth="4" strokeLinecap="round" />
      <circle cx="136" cy={30 - gap / 2} r="5" fill="#2A2A2A" />
      <line x1="24" y1={30 + gap / 2} x2="126" y2={30 + gap / 2} stroke="#FF4375" strokeWidth="4" strokeLinecap="round" />
      <circle cx="136" cy={30 + gap / 2} r="5" fill="#FF4375" />
      {label && <text x="148" y="34" fontSize="11" fontWeight="800" fill="#D42A58" textAnchor="middle">{distance}m</text>}
    </svg>
  )
}
