import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Play, Square, ArrowRight, Sparkles } from 'lucide-react'
import type { Reaction, Walk } from '../../lib/store'
import { REACTION_LABEL, closestCalm, getState, setState, suggestComfort, uid, useStore } from '../../lib/store'
import { distanceWords, josa } from '../../lib/korean'
import { awardBadge } from '../../lib/badges'
import { Sheet, SubHeader, Toast } from '../ui/kit'
import { asset } from '../ui/asset'
import './walklog.css'

const DISTANCES = [1, 2, 3, 5, 8, 12, 15]
const REACT_EMOJI: Record<Reaction, string> = { calm: '😌', alert: '😳', react: '😤' }
const REACT_HINT: Record<Reaction, string> = { calm: '꼬리 편하게', alert: '굳거나 멈칫', react: '짖거나 당김' }

function useClock(start: number | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!start) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [start])
  return start ? Math.max(0, Math.floor((now - start) / 1000)) : 0
}
const mmss = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`
}
const minutes = (w: Walk) => Math.max(1, Math.round((w.endedAt - w.startedAt) / 60000))
const dateLabel = (t: number) => new Date(t).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
const timeLabel = (t: number) => new Date(t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
const durationWords = (sec: number) => (sec < 60 ? `${sec}초` : `${Math.round(sec / 60)}분`)

/**
 * Walk logging is built for the moment a dog reacts: one tap records the reaction;
 * the distance is optional and can be added right after (or never).
 */
export function WalkLog() {
  const card = useStore((s) => s.card)!
  const active = useStore((s) => s.activeWalk)
  const walks = useStore((s) => s.walks)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [summaryId, setSummaryId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const headRef = useRef<HTMLHeadingElement>(null)
  const secs = useClock(active?.startedAt ?? null)
  const summary = summaryId ? walks.find((w) => w.id === summaryId) ?? null : null
  const phase = summary ? 'summary' : active ? 'active' : 'idle'

  useEffect(() => () => { if (toastT.current) clearTimeout(toastT.current) }, [])
  const flash = (m: string) => {
    setToast(m)
    if (toastT.current) clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToast(null), 2400)
  }
  const focusHead = (sel?: string) => requestAnimationFrame(() => {
    document.getElementById('hf-scroll')?.scrollTo(0, 0)
    const el = sel ? document.querySelector<HTMLElement>(sel) : headRef.current
    el?.focus({ preventScroll: true })
  })

  const start = () => {
    if (getState().activeWalk) return // guard against double start
    setSummaryId(null)
    setState((s) => ({ ...s, activeWalk: { id: uid(), startedAt: Date.now(), endedAt: 0, encounters: [] } }))
    focusHead('.wl-react button')
  }
  const log = (reaction: Reaction) => {
    setState((s) => s.activeWalk ? ({ ...s, activeWalk: { ...s.activeWalk, encounters: [...s.activeWalk.encounters, { at: Date.now(), distance: null, reaction }] } }) : s)
    flash(`${REACT_EMOJI[reaction]} ${REACTION_LABEL[reaction]} · 거리는 아래에서 고를 수 있어요`)
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
    setState((s) => (s.activeWalk ? { ...s, activeWalk: null, walks: [{ ...s.activeWalk, endedAt: Date.now() }, ...s.walks] } : s))
    setSummaryId(w.id)
    const badge = awardBadge('first-walk')
    if (badge) flash(`${badge.emoji} ‘${badge.title}’ 배지를 받았어요`)
    focusHead()
  }
  const discard = () => { setState((s) => ({ ...s, activeWalk: null })); setConfirmDiscard(false); flash('이번 산책은 기록하지 않았어요'); focusHead() }
  const apply = (walkId: string, m: number) => {
    setState((s) => s.card ? ({ ...s, card: { ...s.card, comfort: m, updatedAt: Date.now() }, walks: s.walks.map((w) => (w.id === walkId ? { ...w, applied: m } : w)) }) : s)
    flash(`카드의 편한 거리를 ${m}m로 바꿨어요`)
  }

  const photo = card.photo ?? 'photos/dog-03-bori-terrier.jpg'

  /* ---------------- summary ---------------- */
  if (phase === 'summary' && summary) {
    const calmHere = closestCalm([summary])
    const reacts = summary.encounters.filter((e) => e.reaction !== 'calm')
    const sug = summary.applied === undefined ? suggestComfort(card, walks) : null
    const dur = Math.round((summary.endedAt - summary.startedAt) / 1000)
    return (
      <div className="hf-fade-in">
        <SubHeader title="산책 끝" onBack={() => { setSummaryId(null); focusHead() }} />
        <div className="hf-page hf-page--notabs wl">
          <section className="wl-done">
            <span className="wl-done__photo"><img src={asset(photo)} alt="" /><i aria-hidden="true">🎉</i></span>
            <p className="wl-kicker">{dateLabel(summary.startedAt)} · {timeLabel(summary.startedAt)}</p>
            <h2 ref={headRef} tabIndex={-1} className="wl-done__title">{josa(card.name, '과/와')} <span className="num">{durationWords(dur)}</span> 동안<br />걸었어요</h2>
          </section>
          <div className="wl-tiles">
            <div><b className="num">{summary.encounters.length}</b><span>마주침</span></div>
            <div className="wl-tiles--calm"><b className="num">{calmHere !== null ? `${calmHere}m` : '–'}</b><span>가장 가까이서 편안</span></div>
            <div className={reacts.length ? 'wl-tiles--alert' : ''}><b className="num">{reacts.length}</b><span>긴장·반응</span></div>
          </div>
          {summary.encounters.length === 0 && <p className="wl-note">🌿 마주친 개가 없었어요. 조용한 산책도 좋은 기록이에요.</p>}
          {summary.applied !== undefined && (
            <p className="wl-applied" role="status"><Check size={18} strokeWidth={3} /> 카드의 편한 거리를 <b className="num">{summary.applied}m</b>로 바꿨어요.</p>
          )}
          {sug?.kind === 'widen' && (
            <section className="wl-sug wl-sug--widen" role="note" aria-label="편한 거리 제안">
              <p className="wl-sug__tag"><Sparkles size={14} /> 거리 제안</p>
              <div className="wl-sug__nums" aria-hidden="true"><span className="num">{card.comfort}m</span><ArrowRight size={18} /><b className="num">{sug.to}m</b></div>
              <p className="wl-sug__text"><b><span className="num">{card.comfort}m</span> 밖에서도 긴장한 순간이 있었어요.</b> 카드의 거리를 넓혀 두면 다가오는 사람과 개가 더 조심해요.</p>
              <button className="hf-btn hf-btn--primary hf-btn--block" onClick={() => apply(summary.id, sug.to)}>카드를 {sug.to}m로 넓히기</button>
            </section>
          )}
          {sug?.kind === 'narrow' && (
            <section className="wl-sug wl-sug--narrow" role="note" aria-label="편한 거리 제안">
              <p className="wl-sug__tag"><Sparkles size={14} /> 거리 제안</p>
              <div className="wl-sug__nums" aria-hidden="true"><span className="num">{card.comfort}m</span><ArrowRight size={18} /><b className="num">{sug.to}m</b></div>
              <p className="wl-sug__text"><b>여러 번의 산책에서 <span className="num">{sug.to}m</span>까지 편안했어요.</b> 카드에는 {card.comfort}m로 적혀 있어요. 서두를 필요는 없어요.</p>
              <button className="hf-btn hf-btn--dark hf-btn--block" onClick={() => apply(summary.id, sug.to)}>카드를 {sug.to}m로 바꾸기</button>
            </section>
          )}
          {summary.encounters.length > 0 && (
            <section className="hf-section" aria-labelledby="wl-sum-enc">
              <h3 id="wl-sum-enc" className="wl-h3">마주침 {summary.encounters.length}번</h3>
              <EncList list={summary.encounters} />
            </section>
          )}
          <button className="hf-btn hf-btn--line hf-btn--block" onClick={() => { setSummaryId(null); focusHead() }}>산책 기록으로 돌아가기</button>
        </div>
        <div className="wl-toastdock"><Toast message={toast} /></div>
      </div>
    )
  }

  /* ---------------- active ---------------- */
  if (phase === 'active' && active) {
    const last = active.encounters[active.encounters.length - 1]
    return (
      <div className="hf-fade-in">
        <SubHeader title="산책 중" back="/app" />
        <div className="hf-page hf-page--notabs wl wl--active">
          <section className="wl-timer" aria-labelledby="wl-timer">
            <span className="wl-timer__photo"><img src={asset(photo)} alt="" /></span>
            <div>
              <p className="wl-timer__live"><span className="wl-dot" aria-hidden="true" />{josa(card.name, '과/와')} 걷는 중</p>
              <h2 id="wl-timer" ref={headRef} tabIndex={-1} className="wl-timer__time num" aria-label={`산책 시간 ${mmss(secs)}`}>{mmss(secs)}</h2>
              <p className="wl-timer__meta">편한 거리 <b className="num">{card.comfort}m</b> · 마주침 <b className="num">{active.encounters.length}</b></p>
            </div>
          </section>

          <section className="wl-ask" aria-labelledby="wl-ask">
            <h3 id="wl-ask" className="wl-ask__q">다른 개를 마주쳤나요?</h3>
            <p className="wl-ask__sub">{josa(card.name, '이/가')} 어땠는지 한 번만 눌러 주세요.</p>
            <div className="wl-react" role="group" aria-labelledby="wl-ask">
              {(['calm', 'alert', 'react'] as Reaction[]).map((r) => (
                <button key={r} className={`wl-rbtn wl-rbtn--${r}`} onClick={() => log(r)}>
                  <span className="wl-rbtn__e" aria-hidden="true">{REACT_EMOJI[r]}</span>
                  <b>{REACTION_LABEL[r]}</b>
                  <small aria-hidden="true">{REACT_HINT[r]}</small>
                </button>
              ))}
            </div>
          </section>

          {last && (
            <div className={`wl-dist wl-dist--${last.reaction}`} key={last.at} role="radiogroup" aria-labelledby="wl-dist-q">
              <p id="wl-dist-q" className="wl-dist__q">방금 마주친 개와 몇 m쯤이었나요? <span>선택</span></p>
              <div className="wl-dist__chips">
                {DISTANCES.map((m) => (
                  <label key={m} className={`wl-dchip ${last.distance === m ? 'is-on' : ''}`}>
                    <input type="radio" name={`d-${last.at}`} className="wl-vh" checked={last.distance === m} onChange={() => setLastDistance(m)} />
                    <span className="num">{m === 15 ? '15m+' : `${m}m`}</span>
                  </label>
                ))}
              </div>
              {last.distance !== null && <p className="wl-dist__words">{distanceWords(last.distance)} 거리였어요</p>}
            </div>
          )}

          <section className="hf-section" aria-labelledby="wl-enc">
            <h3 id="wl-enc" className="wl-h3">이번 산책의 마주침</h3>
            {active.encounters.length > 0 ? <EncList list={active.encounters} newestFirst /> : <p className="wl-note">아직 마주침이 없어요. 천천히 걸어요 🐾</p>}
          </section>
        </div>
        <div className="hf-bottom-cta wl-cta">
          <div className="wl-cta__row">
            <button className="hf-btn hf-btn--line" onClick={() => setConfirmDiscard(true)}>기록 안 하고 끝내기</button>
            <button className="hf-btn hf-btn--primary" onClick={finish}><Square size={16} fill="currentColor" /> 산책 끝내기</button>
          </div>
          <Toast message={toast} />
        </div>
        <Sheet open={confirmDiscard} onClose={() => setConfirmDiscard(false)} title="이번 산책을 기록하지 않을까요?" center>
          <p className="hf-body">마주침 <span className="num">{active.encounters.length}</span>개가 함께 사라져요.</p>
          <div className="wl-confirm">
            <button className="hf-btn hf-btn--line" onClick={() => setConfirmDiscard(false)}>취소</button>
            <button className="hf-btn hf-btn--danger" onClick={discard}>기록 안 하기</button>
          </div>
        </Sheet>
      </div>
    )
  }

  /* ---------------- idle ---------------- */
  const calmAll = closestCalm(walks)
  const encAll = walks.reduce((n, w) => n + w.encounters.length, 0)
  return (
    <div className="hf-fade-in">
      <SubHeader title="산책 기록" back="/app" />
      <div className="hf-page hf-page--notabs wl">
        <section className="wl-hero">
          <img className="wl-hero__photo" src={asset(photo)} alt="" />
          <div className="wl-hero__copy">
            <p className="wl-kicker wl-kicker--light">{card.name}의 산책</p>
            <h2 ref={headRef} tabIndex={-1} className="wl-hero__title">오늘도<br />우리 속도로.</h2>
            <p className="wl-hero__sub">마주친 개에게 {josa(card.name, '이/가')} 어땠는지 남기면, 편한 거리가 점점 정확해져요.</p>
          </div>
          <button className="hf-btn wl-hero__start" onClick={start}><Play size={18} fill="currentColor" /> 산책 시작</button>
        </section>

        <div className="wl-tiles">
          <div><b className="num">{walks.length}</b><span>산책</span></div>
          <div><b className="num">{encAll}</b><span>마주침</span></div>
          <div className="wl-tiles--calm"><b className="num">{calmAll !== null ? `${calmAll}m` : '–'}</b><span>가장 가까이 편안</span></div>
        </div>

        <section className="hf-section" aria-labelledby="hist-title">
          <div className="hf-section__head">
            <div>
              <h2 id="hist-title" className="hf-h2">지난 산책</h2>
              <p className="hf-sub">최근 기록 {Math.min(walks.length, 8)}개</p>
            </div>
          </div>
          {walks.length === 0 ? (
            <div className="wl-empty">
              <img src={asset('photos/mascot.png')} alt="" />
              <p><b>아직 기록이 없어요</b><br />첫 산책을 시작해 보세요.</p>
            </div>
          ) : (
            <ul className="wl-hist">
              {walks.slice(0, 8).map((w) => {
                const c = closestCalm([w])
                const by = (r: Reaction) => w.encounters.filter((e) => e.reaction === r).length
                return (
                  <li key={w.id} className="wl-hist__item">
                    <span className="wl-hist__date"><b className="num">{new Date(w.startedAt).getDate()}</b><small>{new Date(w.startedAt).toLocaleDateString('ko-KR', { weekday: 'short' })}</small></span>
                    <div className="wl-hist__main">
                      <p className="wl-hist__title">{dateLabel(w.startedAt)}</p>
                      <p className="wl-hist__meta num">{timeLabel(w.startedAt)} · {minutes(w)}분 · 마주침 {w.encounters.length}</p>
                      {w.encounters.length > 0 && (
                        <p className="wl-hist__dots" aria-label={`편안 ${by('calm')}, 긴장 ${by('alert')}, 반응 ${by('react')}`}>
                          {(['calm', 'alert', 'react'] as Reaction[]).filter((r) => by(r)).map((r) => <span key={r} className={`hf-pill hf-pill--${r}`}>{REACT_EMOJI[r]} <span className="num">{by(r)}</span></span>)}
                        </p>
                      )}
                    </div>
                    <span className="wl-hist__calm">{c !== null ? <><small>편안</small><b className="num">{c}m</b></> : <small>–</small>}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <Link to="/app" className="hf-link wl-back">홈으로 돌아가기</Link>
      </div>
      <div className="wl-toastdock"><Toast message={toast} /></div>
    </div>
  )
}

function EncList({ list, newestFirst = false }: { list: Walk['encounters']; newestFirst?: boolean }) {
  const items = list.map((e, i) => ({ e, i }))
  if (newestFirst) items.reverse()
  return (
    <ol className="wl-enc" aria-label="마주침 기록">
      {items.map(({ e, i }) => (
        <li key={e.at} className={`wl-enc__item wl-enc__item--${e.reaction}`}>
          <span className="wl-enc__e" aria-hidden="true">{REACT_EMOJI[e.reaction]}</span>
          <span className="wl-enc__main"><b>{REACTION_LABEL[e.reaction]}</b><small className="num">{i + 1}번째 · {timeLabel(e.at)}</small></span>
          <span className={`wl-enc__d num ${e.distance === null ? 'is-none' : ''}`}>{e.distance !== null ? (e.distance === 15 ? '15m+' : `${e.distance}m`) : '거리 모름'}</span>
        </li>
      ))}
    </ol>
  )
}
