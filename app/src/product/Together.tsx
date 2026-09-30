import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { TogetherStep } from '../lib/store'
import { setState, useStore } from '../lib/store'
import { NEIGHBORS, fit, ladder } from '../lib/demo'
import { Lanes } from '../components/Lanes'
import { Confirm } from './ui'

const DEMO_STEP_SEC = 10 // 실제 권장: 단계당 2~3분. 체험을 위해 줄임.

type Phase = 'intro' | 'walking' | 'check' | 'tense' | 'greet' | 'done'

/**
 * Signature interaction #3 — 나란히 첫 산책.
 * A guided parallel walk: distance closes only when both dogs are calm; stepping back and stopping are first-class outcomes.
 */
export function Together() {
  const { id } = useParams()
  const n = NEIGHBORS.find((x) => x.id === id)
  const card = useStore((s) => s.card)!
  const bond = useStore((s) => (id ? s.bonds[id] : undefined))
  const req = useStore((s) => (id ? s.requests[id] : undefined))
  const lastClosest = bond?.sessions.length ? bond.sessions[bond.sessions.length - 1].closest : null
  const [steps] = useState(() => (n ? ladder(lastClosest ?? fit(card, n).start) : []))
  const [phase, setPhase] = useState<Phase>('intro')
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(DEMO_STEP_SEC)
  const [paused, setPaused] = useState(false)
  const [log, setLog] = useState<TogetherStep[]>([])
  const [greeted, setGreeted] = useState(false)
  const [confirmStop, setConfirmStop] = useState(false)
  const headRef = useRef<HTMLHeadingElement>(null)
  const saved = useRef(false)

  useEffect(() => { headRef.current?.focus() }, [phase, i])

  useEffect(() => {
    if (phase !== 'walking' || paused) return
    const t = setTimeout(() => {
      if (left <= 1) { setLeft(0); setPhase('check') } else setLeft(left - 1)
    }, 1000)
    return () => clearTimeout(t)
  }, [phase, paused, left])

  if (!n) return <Navigate to="/app/together" replace />
  if (!req || req.status !== 'accepted') {
    if (phase !== 'done') return <Navigate to={`/app/together/${n.id}`} replace />
  }

  const d = steps[i]
  const canGreet = card.greeting !== 'pass' && n.greeting !== 'pass'
  const walkStep = (idx: number) => { setI(idx); setLeft(DEMO_STEP_SEC); setPaused(false); setPhase('walking') }

  const finish = (stopped: boolean, extra: TogetherStep[] = []) => {
    const all = [...log, ...extra]
    const calm = all.filter((s) => s.result === 'both-calm').map((s) => s.distance)
    const closest = calm.length ? Math.min(...calm) : null
    setLog(all)
    setPhase('done') // set before the store update removes the request (avoids redirect)
    if (!saved.current) {
      saved.current = true
      setState((s) => {
        const prev = s.bonds[n.id] ?? { neighborId: n.id, sessions: [] }
        const requests = { ...s.requests }
        delete requests[n.id] // one request = one walk. Next time starts from the recorded distance.
        return { ...s, requests, bonds: { ...s.bonds, [n.id]: { ...prev, sessions: [...prev.sessions, { at: Date.now(), steps: all, closest, endedEarly: stopped }] } } }
      })
    }
  }

  const calmHere = () => {
    const entry: TogetherStep = { distance: d, result: 'both-calm' }
    if (i < steps.length - 1) { setLog((l) => [...l, entry]); walkStep(i + 1) }
    else if (canGreet) { setLog((l) => [...l, entry]); setPhase('greet') }
    else finish(false, [entry])
  }
  const tenseHere = () => { setLog((l) => [...l, { distance: d, result: 'tense' }]); setPhase('tense') }

  const closest = (() => { const c = log.filter((s) => s.result === 'both-calm').map((s) => s.distance); return c.length ? Math.min(...c) : null })()
  const meState = phase === 'tense' ? 'alert' : 'calm'

  return (
    <div className="together">
      <div className="together__top">
        <Link to={`/app/together/${n.id}`} className="btn-quiet">{phase === 'done' ? '닫기' : '← 계획'}</Link>
        {phase !== 'intro' && phase !== 'done' && (
          <ol className="progress" aria-label={`${steps.length}단계 중 ${i + 1}단계`}>
            {steps.map((s, k) => <li key={s} className={k <= i ? 'is-on' : ''} />)}
          </ol>
        )}
      </div>

      <div className={`together__stage ${phase === 'tense' ? 'is-tense' : ''}`} aria-hidden="true">
        <Lanes distance={phase === 'done' ? (closest ?? steps[0]) : d} me={{ name: card.name, state: meState }} them={{ name: n.name, state: 'calm' }}
          theme="ink" height={300} walking={phase === 'walking' && !paused} />
      </div>

      {phase === 'intro' && (
        <section className="together__panel">
          <h1 ref={headRef} tabIndex={-1} className="together__title">{card.name}와 {n.name}, 나란히 걸어요.</h1>
          <ul className="rules">
            <li><b>같은 방향으로.</b> 마주 보고 다가가지 않아요.</li>
            <li><b>리드줄은 느슨하게.</b> 당기는 줄이 긴장을 만들어요.</li>
            <li><b>둘 다 편할 때만 가까이.</b> 한쪽이라도 긴장하면 멈추거나 물러나요.</li>
          </ul>
          <p className="fineprint">체험 모드: 단계마다 {DEMO_STEP_SEC}초로 줄였어요. 실제로는 2~3분씩 걸어요.</p>
          <button className="btn btn-signal btn-block" onClick={() => walkStep(0)}><span className="num">{steps[0]}m</span>에서 걷기 시작</button>
        </section>
      )}

      {phase === 'walking' && (
        <section className="together__panel">
          <p className="together__kicker">{i + 1}단계 · {paused ? '잠깐 멈춤' : '나란히 걷는 중'}</p>
          <h1 ref={headRef} tabIndex={-1} className="together__num"><span className="num">{d}m</span></h1>
          <p className="together__line">{i === 0 ? '서로를 알아채기만 해도 충분해요.' : '조금 가까워졌어요. 걸음은 그대로.'}</p>
          <div className="timer" role="timer" aria-live="off" aria-label={`남은 시간 ${left}초`}>
            <span className="timer__bar" style={{ transform: `scaleX(${left / DEMO_STEP_SEC})` }} />
          </div>
          <div className="row3">
            <button className="btn btn-ghost" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>{paused ? '계속 걷기' : '잠깐 멈춤'}</button>
            <button className="btn btn-ink" onClick={() => setPhase('check')}>지금 확인</button>
          </div>
          <button className="btn-quiet" onClick={() => setConfirmStop(true)}>오늘은 여기까지</button>
        </section>
      )}

      {phase === 'check' && (
        <section className="together__panel">
          <p className="together__kicker"><span className="num">{d}m</span>에서</p>
          <h1 ref={headRef} tabIndex={-1} className="together__title">둘 다 어땠나요?</h1>
          <div className="stack-s">
            <button className="btn btn-signal btn-block" onClick={calmHere}>둘 다 편안했어요{i < steps.length - 1 ? ` → ${steps[i + 1]}m로` : ''}</button>
            <button className="btn btn-ghost btn-block" onClick={tenseHere}>한쪽이 긴장했어요</button>
            <button className="btn-quiet" onClick={() => setConfirmStop(true)}>오늘은 여기까지</button>
          </div>
        </section>
      )}

      {phase === 'tense' && (
        <section className="together__panel">
          <h1 ref={headRef} tabIndex={-1} className="together__title">괜찮아요. 물러나는 것도 순서예요.</h1>
          <p className="together__line">귀가 서거나 걸음이 멈추면 거리를 벌려 주세요.</p>
          <div className="stack-s">
            {i > 0 && <button className="btn btn-ink btn-block" onClick={() => walkStep(i - 1)}><span className="num">{steps[i - 1]}m</span>로 물러나 다시 걷기</button>}
            <button className="btn btn-ghost btn-block" onClick={() => walkStep(i)}><span className="num">{d}m</span>에서 한 번 더</button>
            <button className="btn-quiet" onClick={() => finish(true)}>오늘은 여기까지</button>
          </div>
        </section>
      )}

      {phase === 'greet' && (
        <section className="together__panel">
          <h1 ref={headRef} tabIndex={-1} className="together__title">짧게 인사해 볼까요?</h1>
          <p className="together__line">둘 다 원할 때만요. 3초 냄새 맡기, 그리고 다시 같은 방향으로 걸어요.</p>
          <div className="stack-s">
            <button className="btn btn-signal btn-block" onClick={() => { setGreeted(true); finish(false) }}>짧게 인사했어요</button>
            <button className="btn btn-ghost btn-block" onClick={() => finish(false)}>인사 없이 마칠게요</button>
          </div>
        </section>
      )}

      {phase === 'done' && (
        <section className="together__panel" aria-live="polite">
          <p className="together__kicker">오늘의 사이</p>
          <h1 ref={headRef} tabIndex={-1} className="together__title">
            {closest !== null ? <><span className="num">{closest}m</span>까지 나란히 걸었어요.</> : '오늘은 서로를 알아본 날이에요.'}
          </h1>
          <p className="together__line">
            {closest !== null ? `다음엔 ${closest}m에서 시작해요.` : `다음엔 ${steps[0]}m에서 다시 시작해요.`}
            {greeted ? ' 짧은 인사도 나눴어요.' : ''} 멈춘 곳까지가 오늘의 성공이에요.
          </p>
          <div className="stack-s">
            <Link to="/app/bond" className="btn btn-ink btn-block">사이 기록 보기</Link>
            <Link to="/app" className="btn btn-ghost btn-block">카드로 돌아가기</Link>
          </div>
        </section>
      )}

      <Confirm open={confirmStop} title="오늘은 여기까지 할까요?" body="지금까지 걸은 거리는 기록되고, 다음엔 편안했던 거리에서 이어서 시작해요."
        confirmLabel="마치기" cancelLabel="계속 걷기" onCancel={() => setConfirmStop(false)} onConfirm={() => { setConfirmStop(false); finish(true) }} />
    </div>
  )
}
