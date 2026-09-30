import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { ActiveTogether, TogetherStep } from '../lib/store'
import { getState, setState, useStore } from '../lib/store'
import { NEIGHBORS, planFor, stepAbove } from '../lib/demo'
import { distanceWords, josa } from '../lib/korean'
import { Lanes } from '../components/Lanes'
import { Confirm } from './ui'

const DEMO_STEP_SEC = 10 // 체험을 위해 줄인 시간. 실제로는 둘 다 차분해질 때까지 걷는다.

/**
 * Signature interaction #3 — 나란히 첫 산책.
 * Distance closes only when both dogs are calm; stepping back and stopping are first-class outcomes.
 * Progress is persisted (store.activeTogether), so leaving or reloading never loses the session.
 */
export function Together() {
  const { id } = useParams()
  const n = NEIGHBORS.find((x) => x.id === id)
  const card = useStore((s) => s.card)!
  const bond = useStore((s) => (id ? s.bonds[id] : undefined))
  const req = useStore((s) => (id ? s.requests[id] : undefined))
  const active = useStore((s) => (s.activeTogether && s.activeTogether.neighborId === id ? s.activeTogether : null))
  const nav = useNavigate()
  const [left, setLeft] = useState(DEMO_STEP_SEC)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState<{ closest: number | null; stopped: boolean; greeted: boolean; start: number } | null>(null)
  const [confirmStop, setConfirmStop] = useState(false)
  const headRef = useRef<HTMLHeadingElement>(null)

  const phase = done ? 'done' : active?.phase ?? 'intro'
  const i = active?.i ?? 0

  useEffect(() => { headRef.current?.focus() }, [phase, i])

  // Timer: when it ends we only announce; the user decides when to check (no forced focus change).
  useEffect(() => {
    if (phase !== 'walking' || paused || left <= 0) return
    const t = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, paused, left])

  if (!n) return <Navigate to="/app/together" replace />
  if (!done && !active && req?.status !== 'accepted') return <Navigate to={`/app/together/${n.id}`} replace />

  const plan = planFor(card, n, bond?.sessions)
  const steps = active?.steps ?? plan.steps
  const d = steps[i]
  const update = (patch: Partial<ActiveTogether>) =>
    setState((s) => (s.activeTogether ? { ...s, activeTogether: { ...s.activeTogether, ...patch } } : s))

  const begin = () => {
    if (getState().activeTogether?.neighborId === n.id) return
    setState((s) => ({ ...s, activeTogether: { neighborId: n.id, steps: plan.steps, i: 0, phase: 'walking', log: [], canGreet: plan.canGreet, startedAt: Date.now() } }))
    setLeft(DEMO_STEP_SEC); setPaused(false)
  }
  const walkAt = (idx: number, newSteps?: number[]) => { update({ i: idx, phase: 'walking', ...(newSteps ? { steps: newSteps } : {}) }); setLeft(DEMO_STEP_SEC); setPaused(false) }

  const finish = (stopped: boolean, extra: TogetherStep[] = [], greeted = false) => {
    const a = getState().activeTogether
    const all = [...(a?.log ?? []), ...extra]
    const calm = all.filter((s) => s.result === 'both-calm').map((s) => s.distance)
    const closest = calm.length ? Math.min(...calm) : null
    setDone({ closest, stopped, greeted, start: a?.steps[0] ?? plan.start })
    setState((s) => {
      const prev = s.bonds[n.id] ?? { neighborId: n.id, sessions: [] }
      const requests = { ...s.requests }
      delete requests[n.id] // one request = one walk
      return { ...s, requests, activeTogether: null, bonds: { ...s.bonds, [n.id]: { ...prev, sessions: [...prev.sessions, { at: Date.now(), steps: all, closest, endedEarly: stopped }] } } }
    })
  }

  const calmHere = () => {
    const entry: TogetherStep = { distance: d, result: 'both-calm' }
    const log = [...(active?.log ?? []), entry]
    if (i < steps.length - 1) { update({ log }); walkAt(i + 1) }
    else if (active?.canGreet) update({ log, phase: 'greet' })
    else finish(false, [entry])
  }
  const tenseHere = () => update({ log: [...(active?.log ?? []), { distance: d, result: 'tense' }], phase: 'tense' })
  const stepBack = () => {
    if (i > 0) walkAt(i - 1)
    else walkAt(0, [stepAbove(d), ...steps]) // already at the start: add a farther step in front
  }

  const lanesDistance = phase === 'done' ? (done?.closest ?? done?.start ?? steps[0]) : phase === 'intro' ? plan.start : d
  const meState = phase === 'tense' ? 'alert' : 'calm'

  return (
    <div className="together">
      <div className="together__top">
        {phase === 'intro' || phase === 'done'
          ? <button className="btn-quiet" onClick={() => nav(`/app/together/${n.id}`)}>{phase === 'done' ? '닫기' : '← 계획'}</button>
          : <button className="btn-quiet" onClick={() => setConfirmStop(true)}>그만하기</button>}
        {phase !== 'intro' && phase !== 'done' && (
          <ol className="progress" aria-label={`${steps.length}단계 중 ${i + 1}단계`}>
            {steps.map((s, k) => <li key={`${s}-${k}`} className={k <= i ? 'is-on' : ''} />)}
          </ol>
        )}
      </div>

      <div className={`together__stage ${phase === 'tense' ? 'is-tense' : ''}`} aria-hidden="true">
        <Lanes distance={lanesDistance} max={Math.max(20, steps[0])} me={{ name: card.name, state: meState }} them={{ name: n.name, state: 'calm' }}
          theme="paper" height={260} walking={phase === 'walking' && !paused} />
      </div>

      {phase === 'intro' && (
        <section className="together__panel">
          <h1 ref={headRef} tabIndex={-1} className="together__title">{josa(card.name, '과/와')} {n.name}, 나란히 걸어요.</h1>
          <ul className="rules">
            <li><b>같은 방향으로.</b> 마주 보고 다가가지 않아요.</li>
            <li><b>리드줄은 느슨하게.</b> 당기는 줄이 긴장을 만들어요.</li>
            <li><b>둘 다 편할 때만 가까이.</b> 한쪽이라도 긴장하면 멈추거나 물러나요.</li>
            <li><b>오늘은 <span className="num">{plan.floor}m</span>까지만.</b> {plan.sessionIndex === 0 ? '첫 만남에는 인사하지 않아요.' : plan.canGreet ? '둘 다 원하면 마지막에 짧게 인사할 수 있어요.' : '이번에도 인사 없이 걸어요.'}</li>
          </ul>
          <p className="fineprint">체험 모드: 단계마다 {DEMO_STEP_SEC}초로 줄였어요. 실제로는 둘 다 차분해질 때까지 걸어요.</p>
          <button className="btn btn-signal btn-block" onClick={begin}><span><span className="num">{plan.start}m</span>에서 걷기 시작</span></button>
        </section>
      )}

      {phase === 'walking' && (
        <section className="together__panel">
          <p className="together__kicker">{i + 1}단계 · {paused ? '잠깐 멈춤' : '나란히 걷는 중'}</p>
          <h1 ref={headRef} tabIndex={-1} className="together__num"><span className="num">{d}m</span></h1>
          <p className="together__line">{distanceWords(d)} 떨어져 같은 방향으로. {i === 0 ? '서로를 알아채기만 해도 충분해요.' : '걸음은 그대로.'}</p>
          <div className="timer" aria-hidden="true"><span className="timer__bar" style={{ transform: `scaleX(${left / DEMO_STEP_SEC})` }} /></div>
          <p className="sr-only" aria-live="polite">{left === 0 ? '시간이 됐어요. 둘 다 어땠는지 알려 주세요.' : ''}</p>
          <button className="btn btn-danger btn-block together__tense" onClick={tenseHere}>긴장했어요</button>
          <div className="row3">
            <button className="btn btn-ghost" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>{paused ? '계속 걷기' : '잠깐 멈춤'}</button>
            <button className={`btn ${left === 0 ? 'btn-signal' : 'btn-ink'}`} onClick={() => update({ phase: 'check' })}>{left === 0 ? '시간 됐어요 · 확인' : '둘 다 편해요?'}</button>
          </div>
        </section>
      )}

      {phase === 'check' && (
        <section className="together__panel">
          <p className="together__kicker"><span className="num">{d}m</span>에서</p>
          <h1 ref={headRef} tabIndex={-1} className="together__title">둘 다 어땠나요?</h1>
          <div className="stack-s">
            <button className="btn btn-signal btn-block" onClick={calmHere}>둘 다 편안했어요{i < steps.length - 1 ? ` → ${steps[i + 1]}m로` : ''}</button>
            <button className="btn btn-ghost btn-block" onClick={tenseHere}>한쪽이 긴장했어요</button>
          </div>
        </section>
      )}

      {phase === 'tense' && (
        <section className="together__panel">
          <h1 ref={headRef} tabIndex={-1} className="together__title">괜찮아요. 물러나는 것도 순서예요.</h1>
          <p className="together__line">귀가 서거나 걸음이 멈추면 거리를 벌려 주세요.</p>
          <div className="stack-s">
            <button className="btn btn-ink btn-block" onClick={stepBack}><span><span className="num">{i > 0 ? steps[i - 1] : stepAbove(d)}m</span>로 물러나 다시 걷기</span></button>
            <button className="btn btn-ghost btn-block" onClick={() => walkAt(i)}><span><span className="num">{d}m</span>에서 한 번 더</span></button>
            <button className="btn-quiet" onClick={() => finish(true)}>오늘은 여기까지</button>
          </div>
        </section>
      )}

      {phase === 'greet' && (
        <section className="together__panel">
          <h1 ref={headRef} tabIndex={-1} className="together__title">짧게 인사해 볼까요?</h1>
          <p className="together__line">둘 다 원할 때만요. 잠깐 냄새를 맡고, 다시 같은 방향으로 걸어요. 망설여지면 인사 없이 마쳐도 좋아요.</p>
          <div className="stack-s">
            <button className="btn btn-signal btn-block" onClick={() => finish(false, [], true)}>짧게 인사했어요</button>
            <button className="btn btn-ghost btn-block" onClick={() => finish(false)}>인사 없이 마칠게요</button>
          </div>
        </section>
      )}

      {phase === 'done' && done && (
        <section className="together__panel" aria-live="polite">
          <p className="together__kicker">오늘의 사이</p>
          <h1 ref={headRef} tabIndex={-1} className="together__title">
            {done.closest !== null ? <><span className="num">{done.closest}m</span>까지 나란히 걸었어요.</> : '오늘은 서로를 알아본 날이에요.'}
          </h1>
          <p className="together__line">
            다음엔 <span className="num">{plan.start}m</span>에서 {done.closest !== null ? '몸을 풀고 ' : '다시 '}시작해요.
            {done.greeted ? ' 짧은 인사도 나눴어요.' : ''} 멈춘 곳까지가 오늘의 성공이에요.
          </p>
          <div className="stack-s">
            <button className="btn btn-ink btn-block" onClick={() => nav('/app/bond')}>사이 기록 보기</button>
            <button className="btn btn-ghost btn-block" onClick={() => nav('/app')}>카드로 돌아가기</button>
          </div>
        </section>
      )}

      <Confirm open={confirmStop} title="오늘은 여기까지 할까요?" body="지금까지 걸은 거리는 기록되고, 다음엔 편안했던 거리 한 단계 뒤에서 시작해요."
        confirmLabel="마치기" cancelLabel="계속 걷기" onCancel={() => setConfirmStop(false)} onConfirm={() => { setConfirmStop(false); finish(true) }} />
    </div>
  )
}
