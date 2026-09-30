import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import type { Slot } from '../lib/store'
import { SLOT_LABEL, getState, setState, useStore } from '../lib/store'
import { NEIGHBORS, fit, ladder } from '../lib/demo'
import { CardFace } from '../components/CardFace'
import { Lanes } from '../components/Lanes'
import { Confirm, Dialog, Toast } from './ui'

const DEMO_REPLY_MS = 2500

export function NeighborDetail() {
  const { id } = useParams()
  const n = NEIGHBORS.find((x) => x.id === id)
  const card = useStore((s) => s.card)!
  const req = useStore((s) => (id ? s.requests[id] : undefined))
  const bond = useStore((s) => (id ? s.bonds[id] : undefined))
  const nav = useNavigate()
  const [asking, setAsking] = useState(false)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [cancelAsk, setCancelAsk] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Demo reply: a pending request is accepted after a short delay, even if the user left and came back.
  useEffect(() => {
    if (!id || req?.status !== 'pending') return
    const wait = Math.max(0, DEMO_REPLY_MS - (Date.now() - req.at))
    const t = setTimeout(() => {
      setState((s) => (s.requests[id]?.status === 'pending' ? { ...s, requests: { ...s.requests, [id]: { ...s.requests[id], status: 'accepted' } } } : s))
      setToast(`${n?.name ?? ''} 보호자가 나란히 산책을 수락했어요 (시연 응답)`)
      setTimeout(() => setToast(null), 3000)
    }, wait)
    return () => clearTimeout(t)
  }, [id, req, n?.name])

  if (!n) return <Navigate to="/app/together" replace />
  const f = fit(card, n)
  const lastClosest = bond?.sessions.length ? bond.sessions[bond.sessions.length - 1].closest : null
  const start = lastClosest ?? f.start
  const steps = ladder(start)
  const slots = f.sharedSlots.length ? f.sharedSlots : n.slots

  const send = () => {
    if (getState().requests[n.id]?.status === 'pending') { setAsking(false); return } // duplicate guard
    setState((s) => ({ ...s, requests: { ...s.requests, [n.id]: { status: 'pending', at: Date.now(), slot } } }))
    setAsking(false)
  }
  const withdraw = () => {
    setState((s) => { const r = { ...s.requests }; delete r[n.id]; return { ...s, requests: r } })
    setCancelAsk(false)
    setToast('요청을 취소했어요'); setTimeout(() => setToast(null), 2400)
  }

  return (
    <div className="stack">
      <Link to="/app/together" className="btn-quiet backlink">← 이웃 목록</Link>
      <div className="pair">
        <CardFace card={{ ...card }} compact />
        <CardFace card={{ ...n, note: n.note }} compact />
      </div>

      <section className="panel" aria-labelledby="plan-title">
        <h2 id="plan-title" className="panel__title">{lastClosest ? '지난번에 이어서' : '첫 나란히 산책 계획'}</h2>
        <div className="plan__stage" aria-hidden="true">
          <Lanes distance={start} me={{ name: card.name, state: 'calm' }} them={{ name: n.name, state: 'calm' }} theme="paper" height={220} />
        </div>
        <p className="plan__lead"><b className="num">{start}m</b>{lastClosest ? ` — 지난번 편안했던 거리에서 시작해요.` : ` 떨어져 같은 방향으로 걷기부터 시작해요. 둘 중 더 먼 쪽의 편한 거리에 여유를 더했어요.`}</p>
        <ol className="plan__steps" aria-label="단계">
          {steps.map((d) => <li key={d} className="num">{d}m</li>)}
          <li>{card.greeting !== 'pass' && n.greeting !== 'pass' ? '인사(선택)' : '인사 없이 끝'}</li>
        </ol>
        {f.reasons.length > 0 && <ul className="why">{f.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
        {f.cautions.length > 0 && <ul className="why why--caution">{f.cautions.map((r) => <li key={r}>{r}</li>)}</ul>}
      </section>

      {!req && (
        <button className="btn btn-ink btn-block" onClick={() => setAsking(true)}>나란히 산책 요청하기</button>
      )}
      {req?.status === 'pending' && (
        <div className="status-box" role="status">
          <p><b>요청을 보냈어요.</b> {n.name} 보호자의 응답을 기다리는 중이에요.</p>
          <p className="fineprint">체험 모드: 잠시 뒤 시연용 자동 응답이 와요. 실제로 전송되지 않아요.</p>
          <button className="btn btn-ghost" onClick={() => setCancelAsk(true)}>요청 취소</button>
        </div>
      )}
      {req?.status === 'accepted' && (
        <div className="status-box status-box--ok">
          <p><b>{n.name}와 약속했어요.</b> {req.slot ? `${SLOT_LABEL[req.slot]}에 ` : ''}만나서 아래 버튼을 눌러 단계대로 걸어요.</p>
          <button className="btn btn-signal btn-block" onClick={() => nav(`/app/together/${n.id}/walk`)}>나란히 산책 시작</button>
          <button className="btn-quiet" onClick={() => setCancelAsk(true)}>약속 취소</button>
        </div>
      )}

      <Dialog open={asking} onClose={() => setAsking(false)} title={`${n.name}에게 나란히 산책 요청`}>
        <p className="sheet__body">첫 만남 규칙이 함께 전달돼요: <b>{start}m 떨어져 같은 방향으로 걷기부터, 인사는 둘 다 원할 때만.</b></p>
        <fieldset className="field">
          <legend className="label">언제 걸을까요?</legend>
          <div className="choices">
            {slots.map((s) => <label key={s} className="choice"><input type="radio" name="req-slot" checked={slot === s} onChange={() => setSlot(s)} /><span>{SLOT_LABEL[s]}</span></label>)}
          </div>
        </fieldset>
        <div className="sheet__actions">
          <button className="btn btn-ghost" onClick={() => setAsking(false)}>취소</button>
          <button className="btn btn-ink" onClick={send}>요청 보내기</button>
        </div>
      </Dialog>
      <Confirm open={cancelAsk} title={req?.status === 'accepted' ? '약속을 취소할까요?' : '요청을 취소할까요?'} body="상대에게는 ‘이번엔 어려워요’로만 전달돼요. (체험 모드: 전송 없음)"
        confirmLabel="취소하기" cancelLabel="유지하기" danger onCancel={() => setCancelAsk(false)} onConfirm={withdraw} />
      <Toast message={toast} />
    </div>
  )
}
