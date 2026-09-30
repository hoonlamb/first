import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Reaction } from '../lib/store'
import { REACTION_LABEL, closestCalm, getState, setState, suggestComfort, uid, useStore } from '../lib/store'
import { focusMainHeading } from '../lib/a11y'
import { josa } from '../lib/korean'
import { Lanes } from '../components/Lanes'
import { Confirm, PageHead, Toast } from './ui'

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

/**
 * Walk logging is built for the moment a dog reacts: one tap records the reaction;
 * the distance is optional and can be added right after (or never).
 */
export function WalkScreen() {
  const card = useStore((s) => s.card)!
  const active = useStore((s) => s.activeWalk)
  const walks = useStore((s) => s.walks)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [summaryId, setSummaryId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const secs = useClock(active?.startedAt ?? null)
  const summary = summaryId ? walks.find((w) => w.id === summaryId) ?? null : null

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400) }

  const start = () => {
    if (getState().activeWalk) return // guard against double start
    setSummaryId(null)
    setState((s) => ({ ...s, activeWalk: { id: uid(), startedAt: Date.now(), endedAt: 0, encounters: [] } }))
    focusMainHeading('.walk__react button')
  }
  const log = (reaction: Reaction) => {
    setState((s) => s.activeWalk ? ({ ...s, activeWalk: { ...s.activeWalk, encounters: [...s.activeWalk.encounters, { at: Date.now(), distance: null, reaction }] } }) : s)
    flash(`${REACTION_LABEL[reaction]} · 거리는 아래에서 고를 수 있어요`)
  }
  const setLastDistance = (m: number) => {
    setState((s) => {
      if (!s.activeWalk || !s.activeWalk.encounters.length) return s
      const enc = [...s.activeWalk.encounters]
      enc[enc.length - 1] = { ...enc[enc.length - 1], distance: m }
      return { ...s, activeWalk: { ...s.activeWalk, encounters: enc } }
    })
  }
  const finish = () => {
    const w = getState().activeWalk
    if (!w) return
    const done = { ...w, endedAt: Date.now() }
    setState((s) => ({ ...s, activeWalk: null, walks: [done, ...s.walks] }))
    setSummaryId(done.id)
    focusMainHeading()
  }
  const discard = () => { setState((s) => ({ ...s, activeWalk: null })); setConfirmDiscard(false); flash('이번 산책은 기록하지 않았어요'); focusMainHeading() }
  const apply = (walkId: string, m: number) => {
    setState((s) => s.card ? ({ ...s, card: { ...s.card, comfort: m, updatedAt: Date.now() }, walks: s.walks.map((w) => (w.id === walkId ? { ...w, applied: m } : w)) }) : s)
    flash(`카드의 편한 거리를 ${m}m로 바꿨어요`)
  }

  if (summary) {
    const calmHere = closestCalm([summary])
    const reacts = summary.encounters.filter((e) => e.reaction !== 'calm')
    const sug = summary.applied === undefined ? suggestComfort(card, walks) : null
    return (
      <div className="stack">
        <PageHead kicker="산책 끝" title={`${mmss(Math.round((summary.endedAt - summary.startedAt) / 1000))} 동안 걸었어요`} />
        <div className="summary">
          <div><span className="num summary__n">{summary.encounters.length}</span><span>마주침</span></div>
          <div><span className="num summary__n">{calmHere !== null ? `${calmHere}m` : '-'}</span><span>가장 가까이서 편안</span></div>
          <div><span className="num summary__n">{reacts.length}</span><span>긴장·반응</span></div>
        </div>
        {summary.encounters.length === 0 && <p className="panel__note">마주친 개가 없었어요. 조용한 산책도 좋은 기록이에요.</p>}
        {summary.applied !== undefined && <p className="notice" role="status">카드의 편한 거리를 <span className="num">{summary.applied}m</span>로 바꿨어요.</p>}
        {sug?.kind === 'widen' && (
          <div className="suggest" role="note">
            <p><b><span className="num">{card.comfort}m</span> 밖에서도 긴장한 순간이 있었어요.</b> 카드의 거리를 넓혀 두면 다가오는 사람과 개가 더 조심해요.</p>
            <button className="btn btn-ink" onClick={() => apply(summary.id, sug.to)}>카드를 {sug.to}m로 넓히기</button>
          </div>
        )}
        {sug?.kind === 'narrow' && (
          <div className="suggest" role="note">
            <p><b>여러 번의 산책에서 <span className="num">{sug.to}m</span>까지 편안했어요.</b> 카드에는 {card.comfort}m로 적혀 있어요. 서두를 필요는 없어요.</p>
            <button className="btn btn-ink" onClick={() => apply(summary.id, sug.to)}>카드를 {sug.to}m로 바꾸기</button>
          </div>
        )}
        <button className="btn btn-ghost btn-block" onClick={() => { setSummaryId(null); focusMainHeading() }}>산책 기록으로 돌아가기</button>
        <Toast message={toast} />
      </div>
    )
  }

  if (active) {
    const last = active.encounters[active.encounters.length - 1]
    return (
      <div className="stack">
        <PageHead kicker="산책 중" title={mmss(secs)}>
          <p>다른 개를 마주치면 {josa(card.name, '이/가')} 어땠는지 한 번만 눌러 주세요.</p>
        </PageHead>
        <div className="walk__stage" aria-hidden="true">
          <Lanes distance={last?.distance ?? 12} me={{ name: card.name, state: last ? last.reaction : 'calm' }} them={last ? { name: '마주친 개', state: 'calm' } : null} theme="paper" height={200} showLabel={last?.distance != null} />
        </div>
        <div className="walk__react" role="group" aria-label="마주침 기록">
          {(['calm', 'alert', 'react'] as Reaction[]).map((r) => (
            <button key={r} className={`react-btn react-btn--${r}`} onClick={() => log(r)}>{REACTION_LABEL[r]}</button>
          ))}
        </div>
        {last && (
          <fieldset className="field walk__dist">
            <legend className="label">방금 마주친 개와 몇 m쯤이었나요? <span className="hint">(선택)</span></legend>
            <div className="choices">
              {DISTANCES.map((m) => (
                <label key={m} className="choice"><input type="radio" name={`d-${last.at}`} checked={last.distance === m} onChange={() => setLastDistance(m)} /><span className="num">{m === 15 ? '15m+' : `${m}m`}</span></label>
              ))}
            </div>
          </fieldset>
        )}
        {active.encounters.length > 0 ? (
          <ol className="enc-list" aria-label="이번 산책의 마주침">
            {active.encounters.map((e, i) => (
              <li key={e.at} className={`enc enc--${e.reaction}`}><span>{i + 1}번째</span><span className="num">{e.distance !== null ? `${e.distance}m` : '거리 모름'}</span><span>{REACTION_LABEL[e.reaction]}</span></li>
            ))}
          </ol>
        ) : <p className="panel__note">아직 마주침이 없어요.</p>}
        <div className="row2">
          <button className="btn btn-ghost" onClick={() => setConfirmDiscard(true)}>기록 안 하고 끝내기</button>
          <button className="btn btn-ink" onClick={finish}>산책 끝내기</button>
        </div>
        <Confirm open={confirmDiscard} title="이번 산책을 기록하지 않을까요?" body={`마주침 ${active.encounters.length}개가 함께 사라져요.`}
          confirmLabel="기록 안 하기" danger onCancel={() => setConfirmDiscard(false)} onConfirm={discard} />
        <Toast message={toast} />
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHead kicker="산책" title="오늘도 우리 속도로.">
        <p>산책하면서 마주친 개에게 {josa(card.name, '이/가')} 어땠는지 남기면, 편한 거리가 점점 정확해져요.</p>
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
