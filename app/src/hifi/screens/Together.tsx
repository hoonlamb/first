import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, EyeOff, Flag, Footprints, Hourglass,
  MapPin, MessageCircle, MoreHorizontal, ShieldAlert, UserRound,
} from 'lucide-react'
import type { DogCard, Meet, Slot } from '../../lib/store'
import { GREETING_LABEL, PACE_LABEL, SLOT_LABEL, getState, setState, useStore } from '../../lib/store'
import { NEIGHBORS, PRO_THRESHOLD, fit, planFor } from '../../lib/demo'
import type { Neighbor, Plan } from '../../lib/demo'
import { PLACES } from '../../lib/places'
import { sendMessage, unreadIds } from '../../lib/chat'
import { distanceWords, josa } from '../../lib/korean'
import { RootHeader, Sheet } from '../ui/kit'
import { asset } from '../ui/asset'
import './together.css'

/* Demo proximity: 망원동 is the demo neighbourhood; the rest fan out from there. Only used for "가까운 순". */
const HOOD_ORDER: Record<string, number> = { 망원동: 0, 합정동: 1, 연남동: 2, 서교동: 3 }
const sexMark = (s: 'm' | 'f') => (s === 'm' ? '♂' : '♀')
const sexWord = (s: 'm' | 'f') => (s === 'm' ? '남아' : '여아')
const WEEK = ['일', '월', '화', '수', '목', '금', '토']

/**
 * Photo that degrades gracefully: when the source is much smaller than its frame (some demo photos are
 * ~150px), show it at its natural aspect on top of a blurred fill instead of a 4× crop.
 */
function Photo({ src, alt = '' }: { src: string; alt?: string }) {
  const [low, setLow] = useState(false)
  return (
    <>
      {low && <img className="tg-ph__bg" src={asset(src)} alt="" aria-hidden="true" />}
      <img src={asset(src)} alt={alt} className={low ? 'tg-ph__fg' : undefined}
        onLoad={(e) => { const i = e.currentTarget; const box = i.parentElement?.clientHeight ?? 0; if (box && i.naturalHeight < box * 0.5) setLow(true) }} />
    </>
  )
}

function useCard(): DogCard { return useStore((s) => s.card)! }

/* =====================================================================
 * 나란히 이웃 목록 (tab root)
 * ===================================================================== */
export function TogetherList() {
  const card = useCard()
  const hidden = useStore((s) => s.hidden)
  const bonds = useStore((s) => s.bonds)
  const requests = useStore((s) => s.requests)
  useStore((s) => s.threads) // re-render on new messages
  const hood = useStore((s) => s.neighborhood) ?? '망원동'
  const [sameSlot, setSameSlot] = useState(false)
  const [calm, setCalm] = useState(false)
  const [near, setNear] = useState(false)
  useStore((s) => s.seen)
  const unread = unreadIds(getState()).length

  const visible = useMemo(() => NEIGHBORS.filter((n) => !hidden.includes(n.id)), [hidden])
  const results = useMemo(() => {
    const from = HOOD_ORDER[hood] ?? 0
    const dist = (n: Neighbor) => Math.abs((HOOD_ORDER[n.hood] ?? 9) - from)
    return visible
      .map((n) => ({ n, f: fit(card, n), p: planFor(card, n, bonds[n.id]?.sessions) }))
      .filter(({ f }) => (sameSlot ? f.sharedSlots.length > 0 : true))
      .filter(({ n }) => (calm ? n.greeting !== 'hello' : true))
      .sort((a, b) => Number(a.p.needsPro) - Number(b.p.needsPro)
        || (near ? dist(a.n) - dist(b.n) : 0)
        || b.f.score - a.f.score || a.p.start - b.p.start)
  }, [visible, card, bonds, sameSlot, calm, near, hood])

  const [top, ...rest] = results
  const featured = top && !top.p.needsPro ? top : null
  const grid = featured ? rest : results
  const filtered = sameSlot || calm

  return (
    <div className="hf-fade-in">
      <RootHeader>
        <Link to="/app/chat" className="hf-iconbtn" aria-label={`채팅${unread ? `, 새 메시지 ${unread}개` : ''}`}>
          <MessageCircle size={24} strokeWidth={1.9} />
          {unread > 0 && <span className="hf-iconbtn__dot num">{unread}</span>}
        </Link>
      </RootHeader>

      <div className="hf-page tg-list">
        <header className="tg-head">
          <h1 className="hf-h1">나란히 걸어 볼 이웃</h1>
          <p className="hf-sub">외모가 아니라 속도·인사 방식·거리로 맞춰요</p>
          <p className="tg-head__hood"><MapPin size={13} strokeWidth={2.4} aria-hidden="true" />{hood} · 체험 데이터</p>
          <div className="hf-chips hf-chips--scroll tg-filters" role="group" aria-label="걸러 보기">
            <button className="hf-chip" aria-pressed={sameSlot} onClick={() => setSameSlot(!sameSlot)}><span aria-hidden="true">🕖</span>산책 시간 겹침</button>
            <button className="hf-chip" aria-pressed={calm} onClick={() => setCalm(!calm)}><span aria-hidden="true">🤫</span>차분한 인사</button>
            <button className="hf-chip" aria-pressed={near} onClick={() => setNear(!near)}><span aria-hidden="true">📍</span>가까운 순</button>
          </div>
        </header>

        <p className="sr-only" role="status">{results.length}마리의 이웃이 있어요.</p>

        {visible.length === 0 ? (
          <div className="tg-empty">
            <span className="tg-empty__emoji" aria-hidden="true">🙈</span>
            <h2 className="hf-h2">이웃을 모두 숨겼어요</h2>
            <p className="hf-sub">숨긴 이웃은 설정에서 다시 볼 수 있어요.</p>
            <Link to="/app/settings" className="hf-btn hf-btn--soft hf-btn--sm">숨긴 이웃 관리</Link>
          </div>
        ) : results.length === 0 ? (
          <div className="tg-empty">
            <span className="tg-empty__emoji" aria-hidden="true">🐾</span>
            <h2 className="hf-h2">조건에 맞는 이웃이 없어요</h2>
            <p className="hf-sub">걸러 보기 조건을 풀면 더 많은 이웃이 보여요.</p>
            {filtered && <button className="hf-btn hf-btn--soft hf-btn--sm" onClick={() => { setSameSlot(false); setCalm(false) }}>조건 풀기</button>}
          </div>
        ) : (
          <>
            {featured && (
              <section aria-labelledby="tg-best">
                <h2 id="tg-best" className="sr-only">가장 잘 맞는 이웃</h2>
                <Link to={`/app/together/${featured.n.id}`} className="hf-photo tg-feature">
                  <Photo src={featured.n.photo} />
                  <div className="hf-photo__top">
                    <span className="tg-kicker"><span aria-hidden="true">✨</span> 오늘 가장 잘 맞아요</span>
                    <ReqBadge status={requests[featured.n.id]?.status} />
                  </div>
                  <div className="hf-photo__over tg-feature__over">
                    <p className="tg-feature__name">
                      {featured.n.name}
                      <span className="tg-sex" aria-label={sexWord(featured.n.sex)}>{sexMark(featured.n.sex)}</span>
                      <small className="num">{featured.n.age}살</small>
                    </p>
                    <p className="tg-feature__meta">{featured.n.breed} · {featured.n.hood}</p>
                    <div className="tg-feature__likes">
                      {featured.n.likes.map((l) => <span key={l} className="hf-chip hf-chip--glass hf-chip--sm">{l}</span>)}
                    </div>
                    <div className="tg-feature__foot">
                      <ul className="tg-feature__why">
                        {featured.f.reasons.slice(0, 3).map((r) => <li key={r}><Check size={14} strokeWidth={3} aria-hidden="true" />{r}</li>)}
                      </ul>
                      <span className="tg-startpill">
                        <small>시작 거리</small>
                        <b className="num">{featured.p.start}m</b>
                      </span>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {grid.length > 0 && (
              <section className="hf-section" aria-labelledby="tg-more">
                <div className="hf-section__head">
                  <div>
                    <h2 id="tg-more" className="hf-h2">{featured ? '이웃 더 보기' : '이웃'}</h2>
                    <p className="hf-sub">첫 만남은 언제나 멀리서, 인사 없이 시작해요</p>
                  </div>
                </div>
                <ul className="tg-grid">
                  {grid.map(({ n, f, p }) => (
                    <li key={n.id}>
                      <Link to={`/app/together/${n.id}`} className="hf-photo tg-tile" aria-label={`${n.name}, ${n.breed}, ${p.needsPro ? '훈련사 동행' : `${p.start}m부터`}${requests[n.id] ? `, ${requests[n.id].status === 'pending' ? '요청 보냄' : '수락됨'}` : ''}`}>
                        <img src={asset(n.photo)} alt="" />
                        <div className="hf-photo__top">
                          <span className={`hf-pill ${p.needsPro ? 'hf-pill--alert' : 'tg-pill-white'} num`}>
                            {p.needsPro ? <><ShieldAlert size={12} strokeWidth={2.4} aria-hidden="true" />훈련사 동행</> : `${p.start}m부터`}
                          </span>
                          <ReqBadge status={requests[n.id]?.status} />
                        </div>
                        <div className="hf-photo__over">
                          <p className="hf-photo__name">{n.name}<small>{sexMark(n.sex)}</small><small className="num">{n.age}살</small></p>
                          <p className="tg-tile__meta">{n.breed}{near ? ` · ${n.hood}` : ''}</p>
                          <p className="tg-tile__why">{p.needsPro ? (card.comfort >= PRO_THRESHOLD ? '우리 개 거리가 멀어 훈련사 동행' : `${n.name}${'의'} 거리가 멀어 훈련사 동행`) : f.reasons[0] ?? f.cautions[0] ?? PACE_LABEL[n.pace]}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <p className="tg-foot">
              <ShieldAlert size={14} aria-hidden="true" />
              상대에게는 동네와 시간대만 보여요. 체험 모드의 이웃은 모두 가상의 친구예요.
              {hidden.length > 0 && <> <Link to="/app/settings" className="tg-foot__link">숨긴 이웃 {hidden.length}</Link></>}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function ReqBadge({ status }: { status?: 'pending' | 'accepted' }) {
  if (!status) return null
  return status === 'pending'
    ? <span className="hf-pill tg-req tg-req--pending"><Hourglass size={12} strokeWidth={2.4} aria-hidden="true" />요청 보냄</span>
    : <span className="hf-pill tg-req tg-req--ok"><Check size={12} strokeWidth={3} aria-hidden="true" />수락됨</span>
}

/* =====================================================================
 * 이웃 프로필 (no tab bar; status bar overlays the photo)
 * ===================================================================== */
export function NeighborProfile() {
  const { id } = useParams()
  const n = NEIGHBORS.find((x) => x.id === id)
  const card = useCard()
  const req = useStore((s) => (id ? s.requests[id] : undefined))
  const bond = useStore((s) => (id ? s.bonds[id] : undefined))
  const meet = useStore((s) => (id ? s.meets[id] : undefined))
  const active = useStore((s) => s.activeTogether)
  const isHidden = useStore((s) => !!id && s.hidden.includes(id)) // hidden = not shown anywhere, incl. direct links
  const nav = useNavigate()
  const [sheet, setSheet] = useState<null | 'ask' | 'menu' | 'report' | 'cancel'>(null)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400) }
  // A dialog's close event arrives after we may have switched to the next sheet: only clear our own.
  const closeSheet = (k: NonNullable<typeof sheet>) => setSheet((cur) => (cur === k ? null : cur))

  if (!n || isHidden) return <Navigate to="/app/together" replace />
  const f = fit(card, n)
  const plan = planFor(card, n, bond?.sessions)
  const first = plan.sessionIndex === 0
  // First meetings: daytime only (never 'night'). Prefer the slots both dogs share.
  const slotOptions = (f.sharedSlots.length ? f.sharedSlots : n.slots).filter((s) => !first || s !== 'night')
  const chosen = slot && slotOptions.includes(slot) ? slot : slotOptions[0] ?? null
  const mine = active?.neighborId === n.id
  const busyElsewhere = active && !mine ? NEIGHBORS.find((x) => x.id === active.neighborId) ?? null : null
  const myPhoto = card.photo ?? 'photos/dog-03-bori-terrier.jpg'

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) nav(-1)
    else nav('/app/together')
  }

  const send = () => {
    if (!chosen || plan.needsPro) return
    if (getState().requests[n.id]) { setSheet(null); return } // duplicate guard
    setState((s) => ({ ...s, requests: { ...s.requests, [n.id]: { status: 'pending', at: Date.now(), slot: chosen } } }))
    sendMessage(n.id, {
      from: 'me',
      text: `안녕하세요! ${josa(card.name, '과/와')} 나란히 걸어 보고 싶어요. ${first ? '첫날은' : '이번에는'} ${plan.start}m부터 같은 방향으로 걸을게요.`,
    })
    setSheet(null)
    flash(`${n.owner} 님께 요청을 보냈어요`)
  }
  const withdraw = () => {
    const wasAccepted = getState().requests[n.id]?.status === 'accepted'
    setState((s) => {
      const r = { ...s.requests }; delete r[n.id]
      const m = { ...s.meets }; delete m[n.id]
      return { ...s, requests: r, meets: m }
    })
    setSheet(null)
    flash(wasAccepted ? '약속을 취소했어요' : '요청을 취소했어요')
  }
  const hide = () => {
    setState((s) => {
      const r = { ...s.requests }; delete r[n.id]
      return { ...s, requests: r, hidden: [...new Set([...s.hidden, n.id])] }
    })
    setSheet(null)
    nav('/app/together', { replace: true })
  }

  return (
    <div className="tg-profile">
      {/* ---------- immersive photo ---------- */}
      <div className="tg-hero">
        <Photo src={n.photo} alt={`${n.name} 사진 (체험용 샘플)`} />
        <div className="tg-hero__bar">
          <button className="tg-glass" onClick={goBack} aria-label="뒤로"><ChevronLeft size={24} strokeWidth={2.2} /></button>
          <button className="tg-glass" onClick={() => setSheet('menu')} aria-label="더보기 메뉴" aria-haspopup="dialog"><MoreHorizontal size={22} strokeWidth={2.2} /></button>
        </div>
        <span className="tg-hero__demo">체험 데이터</span>
      </div>

      {/* ---------- sheet ---------- */}
      <div className="tg-sheet">
        <header className="tg-id">
          <div className="tg-id__row">
            <h1 className="tg-id__name">{n.name}</h1>
            <span className={`tg-id__sex tg-id__sex--${n.sex}`} aria-label={sexWord(n.sex)}>{sexMark(n.sex)}</span>
            <span className="tg-id__age num">{n.age}살</span>
            {req && <span className="tg-id__req"><ReqBadge status={req.status} /></span>}
          </div>
          <p className="tg-id__breed">{n.breed}</p>
          <p className="tg-id__owner"><span className="tg-id__ownericon" aria-hidden="true"><UserRound size={14} strokeWidth={2.2} /></span>{n.owner} · {n.hood}</p>
        </header>

        <ul className="tg-likes" aria-label={`${josa(n.name, '이/가')} 좋아하는 것`}>
          {n.likes.map((l) => {
            const [emoji, ...words] = l.split(' ')
            return <li key={l} className="tg-like"><span aria-hidden="true">{emoji}</span>{words.join(' ')}</li>
          })}
        </ul>

        <figure className="tg-note">
          <blockquote>“{n.note.replace(/\.$/, '')}”</blockquote>
          <figcaption>{n.owner} 님이 남긴 말</figcaption>
        </figure>

        <dl className="tg-facts">
          <div><dt>편한 거리</dt><dd className="num">{n.comfort}m</dd></div>
          <div><dt>걸음</dt><dd>{PACE_LABEL[n.pace]}</dd></div>
          <div><dt>인사</dt><dd>{GREETING_LABEL[n.greeting]}</dd></div>
          <div><dt>산책 시간</dt><dd>{n.slots.map((s) => SLOT_LABEL[s]).join(' · ')}</dd></div>
        </dl>

        {/* fit */}
        <section className="tg-block" aria-labelledby="tg-fit">
          <h2 id="tg-fit" className="tg-block__title">{josa(card.name, '과/와')} 잘 맞는 점</h2>
          <ul className="tg-fit">
            {f.reasons.map((r) => <li key={r} className="tg-fit__ok"><span className="tg-fit__icon" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>{r}</li>)}
            {f.cautions.map((r) => <li key={r} className="tg-fit__warn"><span className="tg-fit__icon" aria-hidden="true"><AlertTriangle size={14} strokeWidth={2.4} /></span><span><span className="sr-only">주의: </span>{r}</span></li>)}
            {f.reasons.length + f.cautions.length === 0 && <li className="hf-sub">아직 비교할 정보가 적어요</li>}
          </ul>
        </section>

        {/* plan */}
        <section className="tg-plan" aria-labelledby="tg-plan">
          <div className="tg-plan__head">
            <h2 id="tg-plan" className="tg-block__title">{first ? '첫 나란히 계획' : `${plan.sessionIndex + 1}번째 나란히 계획`}</h2>
            {plan.needsPro ? <span className="hf-pill hf-pill--alert">훈련사 동행</span> : <span className="hf-pill hf-pill--pink num">{plan.start}m부터</span>}
          </div>
          <PlanLanes plan={plan} me={{ name: card.name, photo: myPhoto }} them={{ name: n.name, photo: n.photo }} />
          <p className="tg-plan__lead">
            <b className="num">{plan.start}m</b> 떨어져 같은 방향으로 걷기부터 시작해요.{' '}
            {plan.resumed ? '지난번 편안했던 거리보다 한 단계 멀리서 몸을 풀어요.' : `둘 중 더 먼 쪽의 편한 거리(${Math.max(card.comfort, n.comfort)}m)보다 멀리서요.`}
          </p>
          <ol className="tg-steps" aria-label="이번 산책의 단계">
            {plan.steps.map((d, i) => (
              <li key={d} className={i === 0 ? 'is-start' : i === plan.steps.length - 1 ? 'is-floor' : ''}>
                <span className="tg-steps__dot" aria-hidden="true" />
                <b className="num">{d}m</b>
                <small>{i === 0 ? '시작' : i === plan.steps.length - 1 ? '여기까지' : `${i + 1}단계`}</small>
              </li>
            ))}
            <li className="is-end">
              <span className="tg-steps__dot" aria-hidden="true">{plan.canGreet ? '👋' : <Flag size={11} strokeWidth={2.6} />}</span>
              <b>{plan.canGreet ? '인사' : '끝'}</b>
              <small>{plan.canGreet ? '원할 때만' : '인사 없이'}</small>
            </li>
          </ol>
          <p className="tg-rule">
            <ShieldAlert size={16} strokeWidth={2.2} aria-hidden="true" />
            <span>
              <b>{first ? '첫날은' : '오늘은'} <span className="num">{plan.target}m</span>까지 · {plan.canGreet ? '인사는 둘 다 원할 때만' : '인사 없이'}</b>
              <small>{plan.target}m는 {distanceWords(plan.target)}이에요. 이보다 가까이 가지 않아요.</small>
            </span>
          </p>
        </section>

        {bond && bond.sessions.length > 0 && <BondHistory name={n.name} sessions={bond.sessions} next={plan.start} />}

        <p className="tg-privacy">상대에게는 동네와 시간대만 보여요. 정확한 위치와 연락처는 공유하지 않아요. 체험 모드: 실제로 전송되지 않아요.</p>
      </div>

      {/* ---------- sticky CTA ---------- */}
      <div className="hf-bottom-cta tg-cta">
        <div className={`tg-toast ${toast ? 'is-on' : ''}`} role="status" aria-live="polite">{toast}</div>
        {plan.needsPro ? (
          <div className="tg-status tg-status--pro" role="note">
            <ShieldAlert size={20} aria-hidden="true" />
            <p><b>훈련사 동행 나란히는 준비 중이에요</b><small>둘 중 한 친구가 {PRO_THRESHOLD}m 이상 떨어져야 편해서, 보호자끼리만 걷는 나란히는 권하지 않아요.</small></p>
          </div>
        ) : mine ? (
          <>
            <div className="tg-status tg-status--live" role="status">
              <span className="tg-live" aria-hidden="true" />
              <p><b>{josa(n.name, '과/와')} 나란히 걷는 중</b><small className="num">{active!.i + 1}단계 · {active!.steps[active!.i]}m에서 멈췄어요</small></p>
            </div>
            <Link to={`/app/together/${n.id}/walk`} className="hf-btn hf-btn--primary hf-btn--block"><Footprints size={18} aria-hidden="true" />이어서 걷기</Link>
          </>
        ) : busyElsewhere && req?.status === 'accepted' ? (
          <div className="tg-status" role="status">
            <Footprints size={20} aria-hidden="true" />
            <p><b>{josa(busyElsewhere.name, '과/와')} 걷는 중이에요</b><small>한 번에 한 이웃과만 걸어요. 그 산책을 먼저 마쳐 주세요.</small></p>
            <Link to={`/app/together/${busyElsewhere.id}/walk`} className="hf-btn hf-btn--soft hf-btn--sm">이어서 걷기</Link>
          </div>
        ) : !req ? (
          <>
            {slotOptions.length === 0 && <p className="tg-cta__why" role="note">겹치는 낮 시간대가 없어요. 첫 만남은 밤에 잡지 않아요.</p>}
            <button className="hf-btn hf-btn--primary hf-btn--block" onClick={() => setSheet('ask')} disabled={slotOptions.length === 0}>나란히 요청하기</button>
          </>
        ) : req.status === 'pending' ? (
          <div className="tg-status" role="status">
            <span className="tg-wait" aria-hidden="true"><Hourglass size={18} /></span>
            <p><b>응답을 기다리는 중</b><small>체험 모드: 곧 시연 응답이 와요</small></p>
            <button className="hf-btn hf-btn--line hf-btn--sm" onClick={() => setSheet('cancel')}>요청 취소</button>
          </div>
        ) : meet ? (
          <>
            <MeetCard meet={meet} />
            <div className="tg-cta__row">
              <Link to={`/app/chat/${n.id}`} className="hf-btn hf-btn--soft tg-cta__chat" aria-label={`${n.owner} 님과 채팅`}><MessageCircle size={22} /></Link>
              {meet.confirmed
                ? <Link to={`/app/together/${n.id}/walk`} className="hf-btn hf-btn--primary"><Footprints size={18} aria-hidden="true" />나란히 시작</Link>
                : <button className="hf-btn hf-btn--primary" disabled>상대 확인을 기다려요</button>}
            </div>
          </>
        ) : (
          <div className="tg-cta__row">
            <Link to={`/app/chat/${n.id}`} className="hf-btn hf-btn--soft tg-cta__chat" aria-label={`${n.owner} 님과 채팅`}><MessageCircle size={22} /></Link>
            <Link to={`/app/chat/${n.id}`} className="hf-btn hf-btn--primary"><CalendarDays size={18} aria-hidden="true" />채팅에서 약속 잡기</Link>
          </div>
        )}
      </div>

      {/* ---------- sheets ---------- */}
      <Sheet open={sheet === 'ask'} onClose={() => closeSheet('ask')} title={`${josa(n.name, '과/와')} 나란히 걸을까요?`}>
        <div className="tg-asksum">
          <div className="tg-asksum__pair" aria-hidden="true">
            <img src={asset(myPhoto)} alt="" /><span className="tg-asksum__gap num">{plan.start}m</span><img src={asset(n.photo)} alt="" />
          </div>
          <ul className="tg-asksum__rules">
            <li><Check size={14} strokeWidth={3} aria-hidden="true" /><span><b className="num">{plan.start}m</b>({distanceWords(plan.start)}) 떨어져 같은 방향으로 시작</span></li>
            <li><Check size={14} strokeWidth={3} aria-hidden="true" /><span>{first ? '첫날은' : '오늘은'} <b className="num">{plan.target}m</b>까지만 가까워져요</span></li>
            <li><Check size={14} strokeWidth={3} aria-hidden="true" /><span>{plan.canGreet ? '인사는 둘 다 원할 때만' : '인사 없이 나란히만 걸어요'}</span></li>
          </ul>
          <p className="hf-meta">이 규칙이 요청과 함께 전달돼요.</p>
        </div>
        <fieldset className="tg-slots">
          <legend className="tg-slots__legend">언제 걸을까요?</legend>
          {slotOptions.length ? (
            <div className="hf-chips" role="radiogroup" aria-label="산책 시간대">
              {slotOptions.map((s) => (
                <button key={s} role="radio" aria-checked={chosen === s} className="hf-chip tg-slot" onClick={() => setSlot(s)}>
                  {SLOT_EMOJI[s]} {SLOT_LABEL[s]}{f.sharedSlots.includes(s) && <small>겹쳐요</small>}
                </button>
              ))}
            </div>
          ) : <p className="tg-cta__why">겹치는 낮 시간대가 없어요. 첫 만남은 밤에 잡지 않아요.</p>}
          {first && <p className="hf-meta">첫 만남은 밝을 때, 탁 트인 곳에서 해요. 밤 시간대는 고를 수 없어요.</p>}
        </fieldset>
        <button className="hf-btn hf-btn--primary hf-btn--block" onClick={send} disabled={!chosen}>요청 보내기</button>
      </Sheet>

      <Sheet open={sheet === 'menu'} onClose={() => closeSheet('menu')} title={`${n.name} 더보기`}>
        <div className="hf-list tg-menu">
          {req && (
            <button className="hf-listrow" onClick={() => setSheet('cancel')}>
              <Clock size={20} aria-hidden="true" />
              <span className="tg-menu__txt">{req.status === 'accepted' ? '약속 취소하기' : '요청 취소하기'}<small>상대에게는 ‘이번엔 어려워요’로만 전달돼요</small></span>
            </button>
          )}
          <button className="hf-listrow" onClick={hide}>
            <EyeOff size={20} aria-hidden="true" />
            <span className="tg-menu__txt">이 이웃 숨기기<small>목록에서 사라지고 보낸 요청도 취소돼요 · 설정에서 되돌릴 수 있어요</small></span>
          </button>
          <button className="hf-listrow tg-menu__danger" onClick={() => setSheet('report')}>
            <Flag size={20} aria-hidden="true" />
            <span className="tg-menu__txt">신고하기<small>불편한 일이 있었다면 알려 주세요</small></span>
          </button>
        </div>
        <button className="hf-btn hf-btn--line hf-btn--block" onClick={() => setSheet(null)}>닫기</button>
      </Sheet>

      <Sheet open={sheet === 'report'} onClose={() => closeSheet('report')} title="신고하기" center>
        <p className="hf-body">체험 모드에는 신고 운영이 없어요. 실제 서비스에서는 신고 접수와 보호자 확인을 운영팀이 맡을 예정이에요.</p>
        <p className="hf-sub">지금 불편하다면 이 이웃을 숨길 수 있어요. 목록에 다시 보이지 않아요.</p>
        <div className="tg-dual">
          <button className="hf-btn hf-btn--line" onClick={() => setSheet(null)}>닫기</button>
          <button className="hf-btn hf-btn--dark" onClick={hide}>숨기기</button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'cancel'} onClose={() => closeSheet('cancel')} title={req?.status === 'accepted' ? '약속을 취소할까요?' : '요청을 취소할까요?'} center>
        <p className="hf-body">상대에게는 ‘이번엔 어려워요’로만 전달돼요. 체험 모드라 실제로 전송되지는 않아요.</p>
        <div className="tg-dual">
          <button className="hf-btn hf-btn--line" onClick={() => setSheet(null)}>유지하기</button>
          <button className="hf-btn hf-btn--danger" onClick={withdraw}>취소하기</button>
        </div>
      </Sheet>
    </div>
  )
}

const SLOT_EMOJI: Record<Slot, string> = { dawn: '🌅', morning: '☀️', evening: '🌇', night: '🌙' }

/* Two lanes, same direction; the vertical gap is the start distance. */
function PlanLanes({ plan, me, them }: { plan: Plan; me: { name: string; photo: string }; them: { name: string; photo: string } }) {
  const t = Math.min(Math.max(plan.start / 20, 0), 1)
  const gap = 34 + t * 46 // px between lane centres
  return (
    <div className="tg-lanes" style={{ ['--gap' as string]: `${gap}px` }} role="img"
      aria-label={`${josa(me.name, '과/와')} ${josa(them.name, '이/가')} ${plan.start}m 떨어져 같은 방향으로 걷는 그림`}>
      <div className="tg-lane tg-lane--me">
        <span className="tg-lane__trail" />
        <span className="tg-lane__dog"><img src={asset(me.photo)} alt="" /></span>
        <span className="tg-lane__name">{me.name}</span>
      </div>
      <div className="tg-lane tg-lane--them">
        <span className="tg-lane__trail" />
        <span className="tg-lane__dog"><img src={asset(them.photo)} alt="" /></span>
        <span className="tg-lane__name">{them.name}</span>
      </div>
      <div className="tg-lanes__gap">
        <span className="tg-lanes__tick" />
        <span className="tg-lanes__label"><b className="num">{plan.start}m</b><small>{distanceWords(plan.start)}</small></span>
      </div>
      <span className="tg-lanes__dir" aria-hidden="true">같은 방향 →</span>
    </div>
  )
}

function MeetCard({ meet }: { meet: Meet }) {
  const place = meet.placeId ? PLACES.find((p) => p.id === meet.placeId) : null
  return (
    <div className="tg-meet">
      <span className="tg-meet__cal" aria-hidden="true"><CalendarDays size={20} /></span>
      <p className="tg-meet__txt">
        <b>{fmtDate(meet.date)} · {fmtTime(meet.time)}</b>
        <small><MapPin size={12} aria-hidden="true" />{place ? place.name : '장소는 채팅에서 정해요'}</small>
      </p>
      {meet.confirmed
        ? <span className="hf-pill hf-pill--calm"><Check size={12} strokeWidth={3} aria-hidden="true" />확정</span>
        : <span className="hf-pill hf-pill--alert">확인 중</span>}
    </div>
  )
}

function fmtDate(d: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
  if (!m) return d
  const dt = new Date(+m[1], +m[2] - 1, +m[3])
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((dt.getTime() - today.getTime()) / 86400000)
  const label = `${+m[2]}월 ${+m[3]}일 (${WEEK[dt.getDay()]})`
  return diff === 0 ? `오늘 ${label}` : diff === 1 ? `내일 ${label}` : label
}
function fmtTime(t: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t)
  if (!m) return t
  const h = +m[1]
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m[2]}`
}

function BondHistory({ name, sessions, next }: { name: string; sessions: { at: number; closest: number | null; endedEarly: boolean }[]; next: number }) {
  const scale = Math.max(20, ...sessions.map((s) => s.closest ?? 0))
  return (
    <section className="tg-block" aria-labelledby="tg-bond">
      <div className="tg-plan__head">
        <h2 id="tg-bond" className="tg-block__title">{josa(name, '과/와')}의 사이</h2>
        <span className="hf-meta num">{sessions.length}번 걸었어요</span>
      </div>
      <ol className="tg-bond">
        {sessions.map((s, i) => {
          const d = new Date(s.at)
          return (
            <li key={s.at + i}>
              <span className="tg-bond__when"><b>{i + 1}회차</b><small className="num">{d.getMonth() + 1}월 {d.getDate()}일</small></span>
              <span className="tg-bond__bar" aria-hidden="true">
                {s.closest !== null && <span style={{ width: `${Math.max(12, (s.closest / scale) * 100)}%` }} />}
              </span>
              <span className="tg-bond__val">
                {s.closest !== null ? <><b className="num">{s.closest}m</b><small>{s.endedEarly ? '일찍 마침' : '편안'}</small></> : <small>시작 전 멈춤</small>}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="tg-bond__next"><ChevronRight size={16} aria-hidden="true" /><span>다음엔 <b className="num">{next}m</b>부터 몸을 풀어요</span></p>
      <p className="hf-meta">막대는 두 친구 사이의 거리예요. 짧을수록 더 가까이에서 편안했어요.</p>
    </section>
  )
}
