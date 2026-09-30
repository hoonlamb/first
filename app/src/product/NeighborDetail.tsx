import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import type { Slot } from '../lib/store'
import { SLOT_LABEL, getState, setState, useStore } from '../lib/store'
import { NEIGHBORS, PRO_THRESHOLD, fit, planFor } from '../lib/demo'
import { distanceWords, josa } from '../lib/korean'
import { CardFace } from '../components/CardFace'
import { Lanes } from '../components/Lanes'
import { Confirm, Dialog, Toast } from './ui'

export function NeighborDetail() {
  const { id } = useParams()
  const n = NEIGHBORS.find((x) => x.id === id)
  const card = useStore((s) => s.card)!
  const req = useStore((s) => (id ? s.requests[id] : undefined))
  const bond = useStore((s) => (id ? s.bonds[id] : undefined))
  const active = useStore((s) => s.activeTogether)
  const nav = useNavigate()
  const [asking, setAsking] = useState(false)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [cancelAsk, setCancelAsk] = useState(false)
  const [hideAsk, setHideAsk] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400) }

  if (!n) return <Navigate to="/app/together" replace />
  const f = fit(card, n)
  const plan = planFor(card, n, bond?.sessions)
  // First meetings: daytime only (no 'night').
  const slotOptions = (f.sharedSlots.length ? f.sharedSlots : n.slots).filter((s) => plan.sessionIndex > 0 || s !== 'night')
  const chosen = slot ?? slotOptions[0] ?? null
  const mine = active?.neighborId === n.id
  const busyElsewhere = active && !mine ? NEIGHBORS.find((x) => x.id === active.neighborId) : null

  const send = () => {
    if (getState().requests[n.id]) { setAsking(false); return } // duplicate guard
    setState((s) => ({ ...s, requests: { ...s.requests, [n.id]: { status: 'pending', at: Date.now(), slot: chosen } } }))
    setAsking(false)
  }
  const withdraw = () => {
    const wasAccepted = getState().requests[n.id]?.status === 'accepted'
    setState((s) => { const r = { ...s.requests }; delete r[n.id]; return { ...s, requests: r } })
    setCancelAsk(false)
    flash(wasAccepted ? '약속을 취소했어요' : '요청을 취소했어요')
  }
  const hide = () => {
    setState((s) => { const r = { ...s.requests }; delete r[n.id]; return { ...s, requests: r, hidden: [...new Set([...s.hidden, n.id])] } })
    nav('/app/together', { replace: true })
  }

  return (
    <div className="stack">
      <Link to="/app/together" className="btn-quiet backlink">← 이웃 목록</Link>
      <h1 className="sr-only">{josa(card.name, '과/와')} {n.name}의 나란히 계획</h1>
      <div className="pair">
        <CardFace card={card} compact headingLevel={2} />
        <CardFace card={n} compact headingLevel={2} />
      </div>

      <section className="panel" aria-labelledby="plan-title">
        <h2 id="plan-title" className="panel__title">{plan.resumed ? `${plan.sessionIndex + 1}번째 나란히` : '첫 나란히 산책 계획'}</h2>
        <div className="plan__stage" aria-hidden="true">
          <Lanes distance={plan.start} max={Math.max(20, plan.start)} me={{ name: card.name, state: 'calm' }} them={{ name: n.name, state: 'calm' }} theme="paper" height={220} />
        </div>
        <p className="plan__lead">
          <b className="num">{plan.start}m</b>({distanceWords(plan.start)}) 떨어져 같은 방향으로 걷기부터 시작해요.
          {plan.resumed ? ' 지난번 편안했던 거리보다 한 단계 멀리서 몸을 풀어요.' : ` 둘 중 더 먼 쪽의 편한 거리(${Math.max(card.comfort, n.comfort)}m)보다 멀리서요.`}
        </p>
        <ol className="plan__steps" aria-label="이번 산책의 단계">
          {plan.steps.map((d) => <li key={d} className="num">{d}m</li>)}
          <li>{plan.canGreet ? '인사(둘 다 원할 때)' : '인사 없이 끝'}</li>
        </ol>
        <p className="fineprint">오늘은 <span className="num">{plan.floor}m</span>보다 가까이 가지 않아요.{plan.sessionIndex === 0 ? ' 첫 만남에는 인사하지 않아요.' : ''}</p>
        {f.reasons.length > 0 && <ul className="why">{f.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
        {f.cautions.length > 0 && <ul className="why why--caution">{f.cautions.map((r) => <li key={r}>{r}</li>)}</ul>}
      </section>

      {plan.needsPro ? (
        <div className="status-box" role="note">
          <p><b>이 조합은 훈련사와 함께 걸어요.</b> 둘 중 한 친구가 {PRO_THRESHOLD}m 이상 떨어져야 편해서, 보호자끼리만 걷는 나란히는 권하지 않아요.</p>
          <p className="fineprint">훈련사 동행 나란히는 준비 중이에요. 체험 모드에서는 요청할 수 없어요.</p>
        </div>
      ) : mine ? (
        <div className="status-box status-box--ok" role="status">
          <p><b>진행 중인 나란히가 있어요.</b> {active!.i + 1}단계(<span className="num">{active!.steps[active!.i]}m</span>)에서 멈췄어요.</p>
          <button className="btn btn-signal btn-block" onClick={() => nav(`/app/together/${n.id}/walk`)}>이어서 걷기</button>
        </div>
      ) : !req ? (
        busyElsewhere
          ? <p className="notice" role="status">{josa(busyElsewhere.name, '과/와')}의 나란히가 진행 중이에요. 그 산책을 먼저 마쳐 주세요.</p>
          : <button className="btn btn-ink btn-block" onClick={() => setAsking(true)}>나란히 산책 요청하기</button>
      ) : req.status === 'pending' ? (
        <div className="status-box" role="status">
          <p><b>요청을 보냈어요.</b> {n.name} 보호자의 응답을 기다리는 중이에요.</p>
          <p className="fineprint">체험 모드: 잠시 뒤 시연용 자동 응답이 와요. 실제로 전송되지 않아요.</p>
          <button className="btn btn-ghost" onClick={() => setCancelAsk(true)}>요청 취소</button>
        </div>
      ) : (
        <div className="status-box status-box--ok">
          <p><b>{josa(n.name, '과/와')} 약속했어요.</b> {req.slot ? `${SLOT_LABEL[req.slot]}에 ` : ''}만나서 아래 버튼을 눌러 단계대로 걸어요.</p>
          <button className="btn btn-signal btn-block" onClick={() => nav(`/app/together/${n.id}/walk`)}>나란히 산책 시작</button>
          <button className="btn-quiet" onClick={() => setCancelAsk(true)}>약속 취소</button>
        </div>
      )}

      <button className="btn-quiet hide-link" onClick={() => setHideAsk(true)}>이 이웃 숨기기</button>

      <Dialog open={asking} onClose={() => setAsking(false)} title={`${n.name}에게 나란히 산책 요청`}>
        <p className="sheet__body">이 규칙이 함께 전달돼요: <b>{plan.start}m 떨어져 같은 방향으로 걷기부터, 오늘은 {plan.floor}m까지만{plan.sessionIndex === 0 ? ', 인사 없이' : ''}.</b></p>
        <fieldset className="field">
          <legend className="label">언제 걸을까요?</legend>
          <div className="choices">
            {slotOptions.map((s) => <label key={s} className="choice"><input type="radio" name="req-slot" checked={chosen === s} onChange={() => setSlot(s)} /><span>{SLOT_LABEL[s]}</span></label>)}
          </div>
          {plan.sessionIndex === 0 && <p className="hint">첫 만남은 밝을 때, 탁 트인 곳에서 해요.</p>}
        </fieldset>
        <p className="fineprint">상대에게는 동네와 시간대만 보여요. 정확한 위치와 연락처는 공유하지 않아요.</p>
        <div className="sheet__actions">
          <button className="btn btn-ghost" onClick={() => setAsking(false)}>취소</button>
          <button className="btn btn-ink" onClick={send} disabled={!chosen}>요청 보내기</button>
        </div>
      </Dialog>
      <Confirm open={cancelAsk} title={req?.status === 'accepted' ? '약속을 취소할까요?' : '요청을 취소할까요?'} body="상대에게는 ‘이번엔 어려워요’로만 전달돼요. (체험 모드: 전송 없음)"
        confirmLabel="취소하기" cancelLabel="유지하기" danger onCancel={() => setCancelAsk(false)} onConfirm={withdraw} />
      <Confirm open={hideAsk} title={`${josa(n.name, '을/를')} 목록에서 숨길까요?`} body="이 이웃은 목록에 다시 보이지 않고, 보낸 요청도 취소돼요. 설정에서 되돌릴 수 있어요."
        confirmLabel="숨기기" danger onCancel={() => setHideAsk(false)} onConfirm={hide} />
      <Toast message={toast} />
    </div>
  )
}
