import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Reaction, Walk } from '../lib/store'
import { REACTION_LABEL, closestCalm, getState, setState, uid, useStore } from '../lib/store'
import { Lanes } from '../components/Lanes'
import { Confirm, Dialog, PageHead, Toast } from './ui'

const DISTANCES = [1, 2, 3, 5, 8, 12, 15]

function useClock(start: number | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!start) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [start])
  return start ? Math.max(0, Math.floor((now - start) / 1000)) : 0
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const dateLabel = (t: number) => new Date(t).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })

export function WalkScreen() {
  const card = useStore((s) => s.card)!
  const active = useStore((s) => s.activeWalk)
  const walks = useStore((s) => s.walks)
  const [logOpen, setLogOpen] = useState(false)
  const [dist, setDist] = useState<number | null>(null)
  const [reaction, setReaction] = useState<Reaction | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [summary, setSummary] = useState<Walk | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const secs = useClock(active?.startedAt ?? null)

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400) }

  const start = () => {
    if (getState().activeWalk) return // guard against double start
    setSummary(null)
    setState((s) => ({ ...s, activeWalk: { id: uid(), startedAt: Date.now(), endedAt: 0, encounters: [] } }))
  }
  const saveEncounter = () => {
    if (dist === null || reaction === null) { setFormError('거리와 반응을 모두 골라 주세요.'); return }
    setState((s) => s.activeWalk ? ({ ...s, activeWalk: { ...s.activeWalk, encounters: [...s.activeWalk.encounters, { at: Date.now(), distance: dist, reaction }] } }) : s)
    setLogOpen(false); setDist(null); setReaction(null); setFormError(null)
    flash('마주침을 기록했어요')
  }
  const finish = () => {
    const w = getState().activeWalk
    if (!w) return
    const done = { ...w, endedAt: Date.now() }
    setState((s) => ({ ...s, activeWalk: null, walks: [done, ...s.walks] }))
    setSummary(done)
  }
  const discard = () => { setState((s) => ({ ...s, activeWalk: null })); setConfirmDiscard(false); flash('이번 산책은 기록하지 않았어요') }
  const applySuggestion = (m: number) => {
    setState((s) => s.card ? ({ ...s, card: { ...s.card, comfort: m, updatedAt: Date.now() } }) : s)
    flash(`카드의 편한 거리를 ${m}m로 바꿨어요`)
  }

  if (summary) {
    const calmHere = closestCalm([summary])
    const reacts = summary.encounters.filter((e) => e.reaction !== 'calm')
    const suggest = calmHere !== null && calmHere < card.comfort ? calmHere : null
    const tighter = reacts.length > 0 && Math.max(...reacts.map((e) => e.distance)) >= card.comfort ? Math.min(20, Math.max(...reacts.map((e) => e.distance)) + 2) : null
    return (
      <div className="stack">
        <PageHead kicker="산책 끝" title={`${mmss(Math.round((summary.endedAt - summary.startedAt) / 1000))} 동안 걸었어요`} />
        <div className="summary">
          <div><span className="num summary__n">{summary.encounters.length}</span><span>마주침</span></div>
          <div><span className="num summary__n">{calmHere !== null ? `${calmHere}m` : '-'}</span><span>가장 가까이서 편안</span></div>
          <div><span className="num summary__n">{reacts.length}</span><span>긴장·반응</span></div>
        </div>
        {summary.encounters.length === 0 && <p className="panel__note">마주친 개가 없었어요. 조용한 산책도 좋은 기록이에요.</p>}
        {suggest !== null && (
          <div className="suggest" role="note">
            <p><b>{card.name}가 <span className="num">{suggest}m</span>에서도 편안했어요.</b> 카드에는 {card.comfort}m로 적혀 있어요.</p>
            <button className="btn btn-ink" onClick={() => applySuggestion(suggest)}>카드를 {suggest}m로 바꾸기</button>
          </div>
        )}
        {suggest === null && tighter !== null && (
          <div className="suggest" role="note">
            <p><b><span className="num">{card.comfort}m</span> 밖에서도 긴장한 순간이 있었어요.</b> 편한 거리를 조금 넓혀 두면 다가오는 사람이 더 조심해요.</p>
            <button className="btn btn-ink" onClick={() => applySuggestion(tighter)}>카드를 {tighter}m로 바꾸기</button>
          </div>
        )}
        <button className="btn btn-ghost btn-block" onClick={() => setSummary(null)}>산책 기록으로 돌아가기</button>
        <Toast message={toast} />
      </div>
    )
  }

  if (active) {
    const last = active.encounters[active.encounters.length - 1]
    return (
      <div className="stack">
        <PageHead kicker="산책 중" title={mmss(secs)}>
          <p>마주친 개가 있으면 거리와 {card.name}의 반응을 남겨 주세요.</p>
        </PageHead>
        <div className="walk__stage" aria-hidden="true">
          <Lanes distance={last ? last.distance : 12} me={{ name: card.name, state: last ? last.reaction : 'calm' }} them={last ? { name: '마주친 개', state: 'calm' } : null} theme="ink" height={240} walking />
        </div>
        <button className="btn btn-signal btn-block" onClick={() => setLogOpen(true)}>마주침 기록</button>
        {active.encounters.length > 0 ? (
          <ol className="enc-list" aria-label="이번 산책의 마주침">
            {active.encounters.map((e, i) => (
              <li key={e.at} className={`enc enc--${e.reaction}`}><span>{i + 1}번째</span><span className="num">{e.distance}m</span><span>{REACTION_LABEL[e.reaction]}</span></li>
            ))}
          </ol>
        ) : <p className="panel__note">아직 마주침이 없어요.</p>}
        <div className="row2">
          <button className="btn btn-ghost" onClick={() => setConfirmDiscard(true)}>기록 안 하고 끝내기</button>
          <button className="btn btn-ink" onClick={finish}>산책 끝내기</button>
        </div>

        <Dialog open={logOpen} onClose={() => { setLogOpen(false); setFormError(null) }} title="마주침 기록">
          <fieldset className="field">
            <legend className="label">얼마나 떨어져 있었나요?</legend>
            <div className="choices">
              {DISTANCES.map((m) => (
                <label key={m} className="choice"><input type="radio" name="enc-dist" checked={dist === m} onChange={() => { setDist(m); setFormError(null) }} /><span className="num">{m === 15 ? '15m 이상' : `${m}m`}</span></label>
              ))}
            </div>
          </fieldset>
          <fieldset className="field">
            <legend className="label">{card.name}는 어땠나요?</legend>
            <div className="choices">
              {(['calm', 'alert', 'react'] as Reaction[]).map((r) => (
                <label key={r} className={`choice choice--${r}`}><input type="radio" name="enc-react" checked={reaction === r} onChange={() => { setReaction(r); setFormError(null) }} /><span>{REACTION_LABEL[r]}</span></label>
              ))}
            </div>
          </fieldset>
          {formError && <p className="error" role="alert">{formError}</p>}
          <div className="sheet__actions">
            <button className="btn btn-ghost" onClick={() => { setLogOpen(false); setFormError(null) }}>취소</button>
            <button className="btn btn-ink" onClick={saveEncounter}>기록하기</button>
          </div>
        </Dialog>
        <Confirm open={confirmDiscard} title="이번 산책을 기록하지 않을까요?" body={`마주침 ${active.encounters.length}개가 함께 사라져요.`}
          confirmLabel="기록 안 하기" danger onCancel={() => setConfirmDiscard(false)} onConfirm={discard} />
        <Toast message={toast} />
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHead kicker="산책" title="오늘도 우리 속도로.">
        <p>산책하면서 마주친 개와의 거리를 남기면, {card.name}의 편한 거리가 점점 정확해져요.</p>
      </PageHead>
      <button className="btn btn-ink btn-block" onClick={start}>산책 시작</button>
      <section className="panel" aria-labelledby="hist-title">
        <h2 id="hist-title" className="panel__title">지난 산책</h2>
        {walks.length === 0 ? (
          <p className="panel__note">아직 기록이 없어요. 첫 산책을 시작해 보세요.</p>
        ) : (
          <ul className="hist">
            {walks.slice(0, 8).map((w) => {
              const c = closestCalm([w])
              return <li key={w.id}><span>{dateLabel(w.startedAt)}</span><span>마주침 {w.encounters.length}</span><span className="num">{c !== null ? `편안 ${c}m` : '-'}</span></li>
            })}
          </ul>
        )}
      </section>
      <Link to="/app" className="btn-quiet">카드로 돌아가기</Link>
      <Toast message={toast} />
    </div>
  )
}
