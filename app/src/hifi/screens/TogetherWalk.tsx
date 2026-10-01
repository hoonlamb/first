import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { X, MoveRight, Spline, HeartHandshake, Flag, Pause, Play, Check, Hand, PencilLine, Undo2, RotateCcw, Footprints, MessageCircle, Lock, Clock3, BookHeart, MailCheck, IdCard, Megaphone, PawPrint, MapPin, type LucideIcon } from 'lucide-react'
import type { ActiveTogether, Reaction, TogetherStep } from '../../lib/store'
import { getState, setState, useStore } from '../../lib/store'
import { NEIGHBORS, planFor, stepAbove } from '../../lib/demo'
import { distanceWords, josa } from '../../lib/korean'
import { awardBadge, type BadgeDef } from '../../lib/badges'
import { useTween } from '../../lib/motion'
import { Dog } from '../../components/Dog'
import { Sheet } from '../ui/kit'
import { asset } from '../ui/asset'
import './walk.css'

const DEMO_STEP_SEC = 10 // 체험을 위해 줄인 시간. 실제로는 둘 다 차분해질 때까지 걷는다.
const REST_AFTER_MS = 5000 // walking legs rest after a few seconds (less motion, less battery)

// Badge art: a pink medal with a line icon (emoji glyphs render off-brand across platforms).
const BADGE_ICON: Record<string, LucideIcon> = {
  'first-together': Footprints, 'step-back': Undo2, closer: HeartHandshake, review: MailCheck,
  card: IdCard, show: Megaphone, 'first-walk': PawPrint, place: MapPin,
}

const REVIEW_DOG = ['끝까지 편안했어요', '냄새에 관심 보였어요', '조금 긴장했어요', '다음엔 더 가까이 가도 될 것 같아요']
const REVIEW_OWNER = ['리드줄을 느슨하게 잡아 줬어요', '속도를 맞춰 줬어요', '거리를 잘 지켜 줬어요', '시간 약속을 지켰어요']

interface Done {
  closest: number | null
  stopped: boolean
  greeted: boolean
  start: number
  steps: number[]
  log: TogetherStep[]
  ms: number
}

const stepBackKey = (startedAt: number) => `dangq.walk.stepback.${startedAt}`
function markStepBack(startedAt: number) { try { sessionStorage.setItem(stepBackKey(startedAt), '1') } catch { /* ignore */ } }
function hadStepBack(startedAt: number) { try { return sessionStorage.getItem(stepBackKey(startedAt)) === '1' } catch { return false } }

const elapsed = (from: number) => Date.now() - from

function duration(ms: number) {
  const s = Math.max(1, Math.round(ms / 1000))
  return s < 60 ? `${s}초` : `${Math.floor(s / 60)}분${s % 60 ? ` ${s % 60}초` : ''}`
}

/**
 * Signature interaction — 나란히 산책 (state machine and guards carried over from the QA-verified low-fi version; see git history).
 * Distance closes only when both dogs are calm; stepping back and stopping are first-class outcomes.
 * Progress is persisted (store.activeTogether), so leaving or reloading never loses the session.
 */
export function TogetherWalk() {
  const { id } = useParams()
  const n = NEIGHBORS.find((x) => x.id === id)
  const card = useStore((s) => s.card)!
  const bond = useStore((s) => (id ? s.bonds[id] : undefined))
  const req = useStore((s) => (id ? s.requests[id] : undefined))
  const active = useStore((s) => (s.activeTogether && s.activeTogether.neighborId === id ? s.activeTogether : null))
  const otherActive = useStore((s) => (s.activeTogether && s.activeTogether.neighborId !== id ? s.activeTogether.neighborId : null))
  const nav = useNavigate()
  const [left, setLeft] = useState(DEMO_STEP_SEC)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState<Done | null>(null)
  const [confirmStop, setConfirmStop] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const [badgeQueue, setBadgeQueue] = useState<BadgeDef[]>([])
  const [badgesReady, setBadgesReady] = useState(false)
  const steppedBack = useRef(false)
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

  // After the result settles in, offer the review (skippable).
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setReviewOpen(true), 1100)
    return () => clearTimeout(t)
  }, [done])

  if (!n) return <Navigate to="/app/together" replace />
  if (!done && !active && req?.status !== 'accepted') return <Navigate to={`/app/together/${n.id}`} replace />

  const plan = planFor(card, n, bond?.sessions)
  // Guards: trainer-only pairs and a second walk while another is in progress can't start from a direct URL.
  if (!done && !active && (plan.needsPro || otherActive)) return <Navigate to={`/app/together/${n.id}`} replace />
  const gated = !done && !!active && plan.needsPro // card changed to ≥12m mid-walk
  const steps = active?.steps ?? plan.steps
  const d = steps[i]
  const update = (patch: Partial<ActiveTogether>) =>
    setState((s) => (s.activeTogether ? { ...s, activeTogether: { ...s.activeTogether, ...patch } } : s))

  const begin = () => {
    if (getState().activeTogether) return // never overwrite a walk in progress
    setState((s) => ({ ...s, activeTogether: { neighborId: n.id, steps: plan.steps, i: 0, phase: 'walking', log: [], canGreet: plan.canGreet, startedAt: Date.now() } }))
    setLeft(DEMO_STEP_SEC); setPaused(false)
  }
  const walkAt = (idx: number, newSteps?: number[]) => { update({ i: idx, phase: 'walking', ...(newSteps ? { steps: newSteps } : {}) }); setLeft(DEMO_STEP_SEC); setPaused(false) }

  const finish = (stopped: boolean, extra: TogetherStep[] = [], greeted = false) => {
    const a = getState().activeTogether
    const all = [...(a?.log ?? []), ...extra]
    const calm = all.filter((s) => s.result === 'both-calm').map((s) => s.distance)
    const closest = calm.length ? Math.min(...calm) : null
    const prevSessions = getState().bonds[n.id]?.sessions.length ?? 0
    const backed = steppedBack.current || (a ? hadStepBack(a.startedAt) : false)
      || all.some((e, j) => e.result === 'tense' && all.slice(j + 1).some((x) => x.distance > e.distance))
    setDone({ closest, stopped, greeted, start: a?.steps[0] ?? plan.start, steps: a?.steps ?? plan.steps, log: all, ms: a ? elapsed(a.startedAt) : 0 })
    setState((s) => {
      const prev = s.bonds[n.id] ?? { neighborId: n.id, sessions: [] }
      const requests = { ...s.requests }
      delete requests[n.id] // one request = one walk
      const meets = { ...s.meets }
      delete meets[n.id] // …and one meet: the next walk gets a new one
      return { ...s, requests, meets, activeTogether: null, bonds: { ...s.bonds, [n.id]: { ...prev, sessions: [...prev.sessions, { at: Date.now(), steps: all, closest, endedEarly: stopped }] } } }
    })
    // Badges: queued now, shown one at a time after the review sheet.
    const earned = [
      awardBadge('first-together'),
      backed ? awardBadge('step-back') : null,
      prevSessions + 1 >= 2 ? awardBadge('closer') : null,
    ].filter((b): b is BadgeDef => !!b)
    setBadgeQueue(earned)
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
    const moved = i > 0 || stepAbove(d) > d
    if (moved && active) { steppedBack.current = true; markStepBack(active.startedAt) }
    if (i > 0) walkAt(i - 1)
    else if (stepAbove(d) > d) walkAt(0, [stepAbove(d), ...steps]) // already at the start: add a farther step in front
    else walkAt(0) // already at the farthest step
  }

  const closeReview = (submitted: { tags: string[]; note: string } | null) => {
    setReviewOpen(false)
    if (submitted) {
      setState((s) => ({ ...s, reviews: [...s.reviews, { neighborId: n.id, at: Date.now(), tags: submitted.tags, note: submitted.note }] }))
      setReviewed(true)
      const b = awardBadge('review')
      if (b) setBadgeQueue((q) => [...q, b])
    }
    setTimeout(() => setBadgesReady(true), 380) // let the sheet slide away first
  }
  const nextBadge = () => setBadgeQueue((q) => q.slice(1))

  const heroDistance = phase === 'done' ? (done?.closest ?? done?.start ?? steps[0]) : phase === 'intro' ? plan.start : d
  const heroSteps = phase === 'done' && done ? done.steps : phase === 'intro' ? plan.steps : steps
  const meState: Reaction = phase === 'tense' ? 'alert' : 'calm'
  const showStop = phase === 'walking' || phase === 'check' || phase === 'tense'
  const photo = card.photo ?? 'photos/dog-03-bori-terrier.jpg'
  const NumTag = phase === 'walking' && !gated ? 'h1' : 'p'
  const calmSet = new Set((done?.log ?? active?.log ?? []).filter((e) => e.result === 'both-calm').map((e) => e.distance))
  const live = phase === 'walking' && !paused && !gated
  const tone = phase === 'tense' ? 'tense' : phase === 'done' ? 'done' : 'calm'

  const kicker = gated ? '여기서 멈춰요'
    : phase === 'intro' ? `${plan.sessionIndex === 0 ? '첫' : `${plan.sessionIndex + 1}번째`} 나란히 · 오늘의 계획`
    : phase === 'walking' ? `${i + 1}단계 · ${paused ? '잠깐 멈춤' : '나란히 걷는 중'}`
    : phase === 'check' ? `${i + 1}단계 · 확인`
    : phase === 'tense' ? `${i + 1}단계 · 쉬어 가기`
    : phase === 'greet' ? '마지막 · 인사'
    : '오늘의 사이'
  const numCaption = phase === 'done'
    ? (done?.closest !== null ? '오늘 가장 가까이 편안했던 거리' : '오늘 함께 선 거리')
    : `${distanceWords(heroDistance)} 떨어져 같은 방향으로`

  return (
    <div className="wk hf-fade-in">
      <header className="hf-header hf-header--sub wk-header">
        {phase === 'intro' || phase === 'done'
          ? <button className="hf-iconbtn" onClick={() => nav(`/app/together/${n.id}`)} aria-label={phase === 'done' ? '닫기' : '계획으로 돌아가기'}><X size={24} strokeWidth={2} /></button>
          : showStop && !gated
            ? <button className="wk-stopbtn" onClick={() => setConfirmStop(true)}>그만하기</button>
            : <span className="wk-header__spacer" />}
        <p className="hf-header__title">나란히 산책</p>
        <span className="wk-pair" aria-label={`${josa(card.name, '과/와')} ${n.name}`} role="img">
          <img src={asset(photo)} alt="" />
          <img src={asset(n.photo)} alt="" />
        </span>
      </header>

      <div className="wk-page">
        {/* ---------- hero: the two lanes ---------- */}
        <section className={`wk-hero wk-hero--${tone}`} aria-label="두 친구 사이의 거리">
          <div className="wk-hero__top">
            <span className={`wk-kicker ${live ? 'is-live' : ''}`}>{live && <i aria-hidden="true" />}{kicker}</span>
          </div>
          <WalkScene distance={heroDistance} maxD={Math.max(...heroSteps, heroDistance, 10) * 1.12}
            me={{ name: card.name, state: meState }} them={{ name: n.name, state: 'calm' }}
            walking={live} motionKey={`${phase}-${i}-${d}-${paused}`} tone={tone} />
          <div className="wk-hero__num">
            <NumTag ref={NumTag === 'h1' ? headRef : undefined} tabIndex={NumTag === 'h1' ? -1 : undefined} className="wk-bignum">
              {NumTag === 'h1' && <span className="sr-only">{i + 1}단계, </span>}
              <span className="num">{heroDistance}</span><small>m</small>
            </NumTag>
            <p className="wk-caption">{numCaption}</p>
          </div>
          <StepDots steps={heroSteps} current={phase === 'intro' ? 0 : phase === 'done' ? -1 : i} calm={calmSet} intro={phase === 'intro'} />
        </section>

        {/* ---------- phases ---------- */}
        {gated && (
          <section className="wk-panel wk-panel--alert" role="alert">
            <h1 ref={headRef} tabIndex={-1} className="wk-title">이 산책은 여기서 멈춰 주세요.</h1>
            <p className="wk-line">카드의 편한 거리가 바뀌어서, 이제 이 조합은 훈련사와 함께 걷는 게 좋아요. 지금까지 걸은 거리는 기록돼요.</p>
            <button className="hf-btn hf-btn--dark hf-btn--block" onClick={() => finish(true)}>여기까지 기록하고 마치기</button>
          </section>
        )}

        {!gated && phase === 'intro' && (
          <>
            <section className="wk-panel">
              <h1 ref={headRef} tabIndex={-1} className="wk-title">{josa(card.name, '과/와')} {n.name}, 나란히 걸어요.</h1>
              <ul className="wk-rules">
                <Rule icon={<MoveRight size={20} />} title="같은 방향으로">마주 보고 다가가지 않아요.</Rule>
                <Rule icon={<Spline size={20} />} title="리드줄은 느슨하게">당기는 줄이 긴장을 만들어요.</Rule>
                <Rule icon={<HeartHandshake size={20} />} title="둘 다 편할 때만 가까이">한쪽이라도 긴장하면 멈추거나 물러나요.</Rule>
                <Rule icon={<Flag size={20} />} title={<>오늘은 <span className="num">{plan.target}m</span>까지만</>}>
                  {plan.sessionIndex === 0 ? '첫 만남에는 인사하지 않아요.' : plan.canGreet ? '둘 다 원하면 마지막에 짧게 인사할 수 있어요.' : '이번에도 인사 없이 걸어요.'}
                </Rule>
              </ul>
              <p className="wk-demo"><Clock3 size={15} aria-hidden="true" />체험 모드: 단계마다 {DEMO_STEP_SEC}초로 줄였어요. 실제로는 둘 다 차분해질 때까지 걸어요.</p>
            </section>
            <div className="hf-bottom-cta wk-cta">
              <button className="hf-btn hf-btn--primary hf-btn--block" onClick={begin}><Footprints size={19} /><span><span className="num">{plan.start}m</span>에서 걷기 시작</span></button>
            </div>
          </>
        )}

        {!gated && phase === 'walking' && (
          <section className="wk-panel" aria-label={`${i + 1}단계`}>
            <div className="wk-timer">
              <TimerRing left={left} total={DEMO_STEP_SEC} paused={paused} />
              <div>
                <p className="wk-timer__title">{paused ? '잠깐 멈췄어요' : left > 0 ? <><span className="num">{left}</span>초 더 나란히</> : '시간이 됐어요'}</p>
                <p className="wk-timer__sub">{paused ? '둘 다 준비되면 다시 걸어요.' : left === 0 ? '둘 다 어땠는지 알려 주세요.' : i === 0 ? '서로를 알아채기만 해도 충분해요.' : '걸음은 그대로, 리드줄은 느슨하게.'}</p>
              </div>
            </div>
            <p className="sr-only" aria-live="polite">{left === 0 ? '시간이 됐어요. 둘 다 어땠는지 알려 주세요.' : ''}</p>
            <button className="wk-tense" onClick={tenseHere}>
              <span className="wk-tense__icon" aria-hidden="true"><Hand size={24} /></span>
              <span className="wk-tense__text"><b>긴장했어요</b><small>한쪽이라도 굳으면 바로 눌러요</small></span>
            </button>
            <div className="wk-row2">
              <button className="hf-btn hf-btn--line" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>{paused ? <><Play size={17} />계속 걷기</> : <><Pause size={17} />잠깐 멈춤</>}</button>
              <button className={`hf-btn ${left === 0 ? 'hf-btn--primary wk-glow' : 'hf-btn--dark'}`} onClick={() => update({ phase: 'check' })}>{left === 0 ? '시간 됐어요 · 확인' : '둘 다 편해요?'}</button>
            </div>
          </section>
        )}

        {!gated && phase === 'check' && (
          <section className="wk-panel">
            <p className="wk-eyebrow"><span className="num">{d}m</span>에서</p>
            <h1 ref={headRef} tabIndex={-1} className="wk-title">둘 다 어땠나요?</h1>
            <div className="wk-choices">
              <button className="wk-choice wk-choice--calm" onClick={calmHere}>
                <span className="wk-choice__icon" aria-hidden="true"><Check size={22} strokeWidth={2.6} /></span>
                <span className="wk-choice__text"><b>둘 다 편안했어요</b><small>{i < steps.length - 1 ? <>한 걸음 가까이, <span className="num">{steps[i + 1]}m</span>로</> : '오늘 목표 거리까지 왔어요'}</small></span>
              </button>
              <button className="wk-choice" onClick={tenseHere}>
                <span className="wk-choice__icon wk-choice__icon--warm" aria-hidden="true"><Hand size={20} /></span>
                <span className="wk-choice__text"><b>한쪽이 긴장했어요</b><small>물러나거나 쉬어 갈 수 있어요</small></span>
              </button>
            </div>
          </section>
        )}

        {!gated && phase === 'tense' && (
          <section className="wk-panel wk-panel--warm">
            <h1 ref={headRef} tabIndex={-1} className="wk-title">괜찮아요. 물러나는 것도 순서예요.</h1>
            <p className="wk-line">귀가 서거나 걸음이 멈추면 거리를 벌려 주세요. 천천히 숨 고르고, 편해지면 다시 걸어요.</p>
            <div className="wk-choices">
              <button className="wk-choice wk-choice--primary" onClick={stepBack}>
                <span className="wk-choice__icon" aria-hidden="true"><Undo2 size={21} /></span>
                <span className="wk-choice__text"><b><span className="num">{i > 0 ? steps[i - 1] : stepAbove(d)}m</span>로 물러나 다시 걷기</b><small>한 단계 멀리서 다시 시작해요</small></span>
              </button>
              <button className="wk-choice" onClick={() => walkAt(i)}>
                <span className="wk-choice__icon" aria-hidden="true"><RotateCcw size={19} /></span>
                <span className="wk-choice__text"><b><span className="num">{d}m</span>에서 한 번 더</b><small>금방 풀렸다면 같은 거리에서요</small></span>
              </button>
            </div>
            <button className="wk-quiet" onClick={() => finish(true)}>오늘은 여기까지</button>
          </section>
        )}

        {!gated && phase === 'greet' && (
          <section className="wk-panel">
            <h1 ref={headRef} tabIndex={-1} className="wk-title">짧게 인사해 볼까요?</h1>
            <p className="wk-line">둘 다 원할 때만요. 잠깐 냄새를 맡고, 다시 같은 방향으로 걸어요. 망설여지면 인사 없이 마쳐도 좋아요.</p>
            <div className="wk-stack">
              <button className="hf-btn hf-btn--primary hf-btn--block" onClick={() => finish(false, [], true)}>짧게 인사했어요</button>
              <button className="hf-btn hf-btn--line hf-btn--block" onClick={() => finish(false)}>인사 없이 마칠게요</button>
            </div>
          </section>
        )}

        {phase === 'done' && done && (
          <section className="wk-panel wk-result" aria-live="polite">
            <h1 ref={headRef} tabIndex={-1} className="wk-title wk-result__title">
              {done.closest !== null ? <>{josa(n.name, '과/와')} <span className="num">{done.closest}m</span>까지<br />나란히 걸었어요</> : <>{josa(n.name, '과/와')}<br />서로를 알아본 날이에요</>}
            </h1>
            <p className="wk-line">
              {done.greeted ? '짧은 인사도 나눴어요. ' : ''}멈춘 곳까지가 오늘의 성공이에요.
            </p>
            <dl className="wk-stats">
              <div><dt>걸은 시간</dt><dd className="num">{duration(done.ms)}</dd></div>
              <div><dt>편안한 단계</dt><dd><span className="num">{done.steps.filter((x) => calmSet.has(x)).length}</span><small>/<span className="num">{done.steps.length}</span></small></dd></div>
              <div><dt>쉬어 간 순간</dt><dd><span className="num">{done.log.filter((e) => e.result === 'tense').length}</span><small>번</small></dd></div>
            </dl>
            <p className="wk-next"><Footprints size={18} aria-hidden="true" /><span>다음엔 <b className="num">{plan.start}m</b>부터 {done.closest !== null ? '몸을 풀고 시작해요' : '다시 시작해요'}</span></p>
            {reviewed
              ? <p className="wk-reviewed"><Lock size={14} aria-hidden="true" />후기를 남겼어요. 체험 모드에서는 나만 볼 수 있어요.</p>
              : <button className="wk-quiet wk-quiet--pink" onClick={() => setReviewOpen(true)}><PencilLine size={16} aria-hidden="true" />{josa(n.name, '과/와')}의 후기 남기기</button>}
          </section>
        )}
        {phase === 'done' && done && (
          <div className="hf-bottom-cta wk-cta">
            <div className="wk-row2">
              <button className="hf-btn hf-btn--soft" onClick={() => nav(`/app/chat/${n.id}`)}><MessageCircle size={18} />채팅으로</button>
              <button className="hf-btn hf-btn--primary" onClick={() => nav('/app/badges')}><BookHeart size={18} />사이 기록 보기</button>
            </div>
          </div>
        )}
      </div>

      <Sheet open={confirmStop} onClose={() => setConfirmStop(false)} title="오늘은 여기까지 할까요?">
        <p className="wk-line">지금까지 걸은 거리는 기록되고, 다음엔 편안했던 거리 한 단계 뒤에서 시작해요.</p>
        <div className="wk-stack">
          <button className="hf-btn hf-btn--dark hf-btn--block" autoFocus onClick={() => { setConfirmStop(false); finish(true) }}>마치기</button>
          <button className="hf-btn hf-btn--line hf-btn--block" onClick={() => setConfirmStop(false)}>계속 걷기</button>
        </div>
      </Sheet>

      {done && <ReviewSheet open={reviewOpen} name={n.name} owner={n.owner} onDone={closeReview} />}

      <BadgeModal badge={badgesReady && !reviewOpen ? badgeQueue[0] ?? null : null} more={badgeQueue.length - 1}
        onNext={nextBadge} onSee={() => { setBadgeQueue([]); nav('/app/badges') }} />
    </div>
  )
}

function Rule({ icon, title, children }: { icon: ReactNode; title: ReactNode; children: ReactNode }) {
  return (
    <li className="wk-rule">
      <span className="wk-rule__icon" aria-hidden="true">{icon}</span>
      <span><b>{title}</b><small>{children}</small></span>
    </li>
  )
}

/* ---------- the signature scene: two lanes, same direction; the gap is the distance ---------- */
function WalkScene({ distance, maxD, me, them, walking, motionKey, tone }: {
  distance: number; maxD: number; me: { name: string; state: Reaction }; them: { name: string; state: Reaction }
  walking: boolean; motionKey: string; tone: 'calm' | 'tense' | 'done'
}) {
  const shown = useTween(distance, 620)
  const [restedKey, setRestedKey] = useState<string | null>(null)
  const moving = walking && restedKey !== motionKey
  useEffect(() => {
    if (!walking) return
    const t = setTimeout(() => setRestedKey(motionKey), REST_AFTER_MS)
    return () => clearTimeout(t)
  }, [walking, motionKey])

  const W = 350, H = 200
  const t = Math.min(Math.max(shown / maxD, 0), 1)
  const gap = 54 + Math.pow(t, 1.4) * 76 // stretch so each step reads as a visible change
  const mid = 126
  const yMe = mid - gap / 2
  const yThem = mid + gap / 2
  const meX = 206, themX = 178
  const S = 0.8
  const feet = 26 * S
  const bx = 306
  const accent = tone === 'tense' ? '#B26A00' : '#D42A58'

  return (
    <svg className={`wk-scene ${moving ? 'is-moving' : ''}`} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <text x={W - 18} y="14" textAnchor="end" className="wk-scene__dir">같은 방향 →</text>

      {/* lanes */}
      {[{ y: yMe, x: meX, color: '#2A2A2A', detail: '#FFE4ED', dog: me, cls: 'me' }, { y: yThem, x: themX, color: '#FF4375', detail: '#2A2A2A', dog: them, cls: 'them' }].map((l) => (
        <g key={l.cls} className={`wk-lane wk-lane--${l.cls}`}>
          <line x1="14" y1={l.y + 2} x2={W - 14} y2={l.y + 2} stroke="#D42A58" strokeOpacity=".08" strokeWidth="18" strokeLinecap="round" />
          <line x1="14" y1={l.y} x2={W - 14} y2={l.y} stroke="#fff" strokeWidth="16" strokeLinecap="round" />
          <line x1="22" y1={l.y} x2={l.x - 40} y2={l.y} stroke={l.color} strokeWidth="4" strokeLinecap="round" />
          <line className="wk-lane__ahead" x1={l.x + 48} y1={l.y} x2={bx - 20} y2={l.y} stroke={l.color} strokeWidth="4" strokeLinecap="round" strokeDasharray="0 11" opacity=".38" />
          <text x="24" y={l.y - 13} className="wk-lane__name" fill={l.cls === 'me' ? '#2A2A2A' : '#D42A58'}>{l.dog.name}</text>
          <g transform={`translate(${l.x},${l.y - feet - 1}) scale(${S})`}>
            <Dog state={l.dog.state} color={l.color} detail={l.detail} walking={moving} />
          </g>
        </g>
      ))}

      {/* bracket: the gap between lanes */}
      <g className="wk-bracket" stroke={accent}>
        <line x1={bx} x2={bx} y1={yMe + 10} y2={yThem - 10} strokeWidth="2" strokeLinecap="round" />
        <path d={`M${bx - 5} ${yMe + 15} L${bx} ${yMe + 10} L${bx + 5} ${yMe + 15}`} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${bx - 5} ${yThem - 15} L${bx} ${yThem - 10} L${bx + 5} ${yThem - 15}`} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x={bx - 20} y={mid - 11} width="40" height="22" rx="11" fill="#fff" stroke="none" />
        <text x={bx} y={mid + 4.5} textAnchor="middle" className="wk-bracket__text" fill={accent} stroke="none">{Math.round(shown)}m</text>
      </g>

      {tone === 'done' && (
        <g className="wk-sparkles" fill="#FF4375">
          {[[meX + 52, yMe - 50, 1], [meX - 44, yMe - 40, .7], [bx - 36, mid - 6, .55], [themX + 74, yThem - 44, .6]].map(([x, y, s], k) => (
            <path key={k} style={{ animationDelay: `${k * 120}ms` }} transform={`translate(${x},${y}) scale(${s})`} d="M0 -9 C 1 -3, 3 -1, 9 0 C 3 1, 1 3, 0 9 C -1 3, -3 1, -9 0 C -3 -1, -1 -3, 0 -9 Z" />
          ))}
        </g>
      )}
    </svg>
  )
}

function StepDots({ steps, current, calm, intro }: { steps: number[]; current: number; calm: Set<number>; intro: boolean }) {
  const label = intro ? `오늘의 단계: ${steps.map((s) => `${s}m`).join(', ')}` : current >= 0 ? `${steps.length}단계 중 ${current + 1}단계` : `${steps.length}단계 중 ${calm.size}단계 편안`
  return (
    <ol className="wk-dots" aria-label={label}>
      {steps.map((s, k) => {
        const state = current >= 0 ? (k < current ? 'past' : k === current ? 'now' : 'next') : calm.has(s) ? 'past' : 'next'
        return (
          <li key={`${s}-${k}`} className={`wk-dot wk-dot--${intro && k === 0 ? 'start' : state}`} aria-hidden="true">
            <span className="wk-dot__mark">{state === 'past' && <Check size={12} strokeWidth={3.2} />}</span>
            <span className="wk-dot__label num">{s}m</span>
          </li>
        )
      })}
    </ol>
  )
}

function TimerRing({ left, total, paused }: { left: number; total: number; paused: boolean }) {
  const r = 24, C = 2 * Math.PI * r
  const over = left === 0
  return (
    <span className={`wk-ring ${over ? 'is-over' : ''} ${paused ? 'is-paused' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 60 60" width="60" height="60">
        <circle cx="30" cy="30" r={r} className="wk-ring__track" />
        <circle cx="30" cy="30" r={r} className="wk-ring__bar" strokeDasharray={C} strokeDashoffset={C * (1 - left / total)} transform="rotate(-90 30 30)" />
      </svg>
      <span className="wk-ring__num num">{over ? <Check size={22} strokeWidth={3} /> : paused ? <Pause size={18} /> : left}</span>
    </span>
  )
}

/* ---------- review (per original 후기 모달, private in the demo) ---------- */
function ReviewSheet({ open, name, owner, onDone }: { open: boolean; name: string; owner: string; onDone: (r: { tags: string[]; note: string } | null) => void }) {
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const toggle = (t: string) => setTags((xs) => (xs.includes(t) ? xs.filter((x) => x !== t) : [...xs, t]))
  const can = tags.length > 0 || note.trim().length > 0
  const group = (gid: string, title: string, sub: string, list: string[]) => (
    <div className="wk-rv__group" role="group" aria-labelledby={gid}>
      <p id={gid} className="wk-rv__label">{title}<small>{sub}</small></p>
      <div className="wk-rv__chips">
        {list.map((t) => (
          <button key={t} className="wk-rv__chip" aria-pressed={tags.includes(t)} onClick={() => toggle(t)}>
            {tags.includes(t) && <Check size={14} strokeWidth={3} aria-hidden="true" />}{t}
          </button>
        ))}
      </div>
    </div>
  )
  return (
    <Sheet open={open} onClose={() => onDone(null)} title={`${josa(name, '과/와')}의 나란히는 어땠나요?`}>
      <p className="wk-rv__lead"><Lock size={13} aria-hidden="true" />체험 모드에서 후기는 나만 볼 수 있어요. 다음 나란히를 준비할 때 참고해요.</p>
      {group('rv-dog', '우리 개', '오늘 우리 개는요', REVIEW_DOG)}
      {group('rv-owner', '상대 보호자', `${owner} 님은요`, REVIEW_OWNER)}
      <label className="wk-rv__note">
        <PencilLine size={18} aria-hidden="true" />
        <span className="sr-only">한마디 (선택)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={60} placeholder="기억하고 싶은 한마디가 있다면 (선택)" />
      </label>
      <div className="wk-stack">
        <button className="hf-btn hf-btn--primary hf-btn--block" disabled={!can} onClick={() => onDone({ tags, note: note.trim() })}>후기 남기기</button>
        <button className="wk-quiet" onClick={() => onDone(null)}>다음에 할게요</button>
      </div>
    </Sheet>
  )
}

/* ---------- badge earned (per original 뱃지 획득 모달) ---------- */
function BadgeModal({ badge, more, onNext, onSee }: { badge: BadgeDef | null; more: number; onNext: () => void; onSee: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [shown, setShown] = useState<BadgeDef | null>(badge)
  if (badge && badge !== shown) setShown(badge) // keep content while the dialog closes
  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (badge && !dlg.open) dlg.showModal()
    if (!badge && dlg.open) dlg.close()
  }, [badge])
  const b = badge ?? shown
  return (
    <dialog ref={ref} className="hf-sheet hf-sheet--center wk-badge" aria-labelledby="wk-badge-title"
      onCancel={(e) => { e.preventDefault(); onNext() }} onClick={(e) => { if (e.target === ref.current) onNext() }}>
      {b && (
        <div key={b.id} className="wk-badge__inner">
          <div className="wk-badge__tags"><span className="hf-pill hf-pill--pink">{b.tag}</span><span className="hf-pill wk-badge__new">새 배지</span></div>
          <div className="wk-badge__art" aria-hidden="true">
            <span className="wk-badge__medal">{BADGE_ICON[b.id] ? (() => { const I = BADGE_ICON[b.id]; return <I size={52} strokeWidth={2.1} /> })() : <span className="wk-badge__emoji">{b.emoji}</span>}</span>
          </div>
          <p className="wk-badge__congrats">축하해요!</p>
          <h2 id="wk-badge-title" className="wk-badge__title">“{b.title}” 배지를 받았어요</h2>
          <p className="wk-badge__how">{b.how} 받는 배지예요.</p>
          <div className="wk-stack">
            <button className="hf-btn hf-btn--primary hf-btn--block" onClick={onSee}>인증소에서 보기</button>
            <button className="wk-quiet" onClick={onNext} autoFocus>{more > 0 ? `다음 배지 보기 (${more})` : '닫기'}</button>
          </div>
        </div>
      )}
    </dialog>
  )
}
