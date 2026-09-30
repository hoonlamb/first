import { useEffect, useRef } from 'react'

/** Native <dialog> modal: focus trap + Esc for free. */
export function Dialog({ open, onClose, title, children, labelledBy }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; labelledBy?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  const id = labelledBy ?? `dlg-${title.replace(/\s/g, '')}`
  return (
    <dialog ref={ref} className="sheet" aria-labelledby={id} onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose() }}
      onClick={(e) => { if (e.target === ref.current) onClose() }}>
      <div className="sheet__inner">
        <h2 id={id} className="sheet__title">{title}</h2>
        {children}
      </div>
    </dialog>
  )
}

export function Confirm({ open, title, body, confirmLabel, cancelLabel = '취소', danger, onConfirm, onCancel }: {
  open: boolean; title: string; body: string; confirmLabel: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      <p className="sheet__body">{body}</p>
      <div className="sheet__actions">
        <button className="btn btn-ghost" onClick={onCancel}>{cancelLabel}</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-ink'}`} onClick={onConfirm} autoFocus>{confirmLabel}</button>
      </div>
    </Dialog>
  )
}

export function Toast({ message }: { message: string | null }) {
  return <div className={`toast ${message ? 'is-on' : ''}`} role="status" aria-live="polite">{message}</div>
}

export function PageHead({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="pagehead">
      {kicker && <p className="pagehead__kicker">{kicker}</p>}
      <h1 className="pagehead__title">{title}</h1>
      {children && <div className="pagehead__sub">{children}</div>}
    </div>
  )
}
