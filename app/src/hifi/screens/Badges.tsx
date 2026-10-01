import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Lock, CircleCheck, Footprints, CalendarDays } from 'lucide-react'
import { BADGES, type BadgeDef } from '../../lib/badges'
import { useStore, type Bond, type Walk } from '../../lib/store'
import { NEIGHBORS, planFor } from '../../lib/demo'
import { josa } from '../../lib/korean'
import { RootHeader, Sheet } from '../ui/kit'
import { asset } from '../ui/asset'
import './badges.css'

const TAG_CLASS: Record<BadgeDef['tag'], string> = { 나란히: 'bd-tag--pink', 산책: 'bd-tag--green', 카드: 'bd-tag--purple', 장소: 'bd-tag--blue' }
const BADGE_ROUTE: Record<string, { to: string; label: string }> = {
  card: { to: '/app/card/edit', label: '산책 카드 보기' },
  show: { to: '/app/show', label: '보여주기 열기' },
  'first-walk': { to: '/app/walk', label: '산책 기록하러 가기' },
  'first-together': { to: '/app/together', label: '나란히 이웃 보기' },
  'step-back': { to: '/app/together', label: '나란히 이웃 보기' },
  closer: { to: '/app/together', label: '나란히 이웃 보기' },
  review: { to: '/app/together', label: '나란히 이웃 보기' },
  place: { to: '/app/places', label: '멍슐랭 둘러보기' },
}

/** Monday 00:00 of the current week (local time). */
function weekStart(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}
const md = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`

interface Challenge { id: string; tags: string[]; title: string; desc: string; photo: string; goal: number; done: number; period: string }

function challenges(bonds: Record<string, Bond>, walks: Walk[]): Challenge[] {
  const ws = weekStart()
  const we = new Date(ws); we.setDate(ws.getDate() + 6)
  const thisWeek = Object.values(bonds).flatMap((b) => b.sessions).filter((s) => s.at >= ws.getTime()).length
  const calm = walks.flatMap((w) => w.encounters).filter((e) => e.reaction === 'calm').length
  return [
    { id: 'week-together', tags: ['나란히', '이번 주'], title: '이번 주 나란히 2번 걷기', desc: '같은 이웃이든 다른 이웃이든 좋아요. 멀리서부터 천천히요.', photo: 'photos/place-02-beach-dog.jpg', goal: 2, done: thisWeek, period: `${md(ws)} – ${md(we)}` },
    { id: 'walk-5', tags: ['산책', '기록'], title: '산책 기록 5번 남기기', desc: '기록이 쌓이면 편한 거리가 언제 줄어드는지 보여요.', photo: 'photos/dog-05-labrador.jpg', goal: 5, done: walks.length, period: '기간 없음' },
    { id: 'calm-3', tags: ['산책', '거리'], title: '편안했던 만남 3번 모으기', desc: '다른 개를 보고도 편안했던 순간을 산책 중에 기록해 보세요.', photo: 'photos/dog-07-pomeranian.jpg', goal: 3, done: calm, period: '기간 없음' },
  ]
}

export function BadgesScreen() {
  const card = useStore((s) => s.card)!
  const bonds = useStore((s) => s.bonds)
  const hidden = useStore((s) => s.hidden)
  const earned = useStore((s) => s.badges)
  const walks = useStore((s) => s.walks)
  const nav = useNavigate()
  const [open, setOpen] = useState<BadgeDef | null>(null)

  const earnedCount = BADGES.filter((b) => earned.includes(b.id)).length
  const pct = Math.round((earnedCount / BADGES.length) * 100)
  const next = BADGES.find((b) => !earned.includes(b.id))
  const rows = Object.values(bonds)
    .filter((b) => !hidden.includes(b.neighborId) && b.sessions.length)
    .map((b) => ({ b, n: NEIGHBORS.find((x) => x.id === b.neighborId) }))
    .filter((x): x is { b: Bond; n: (typeof NEIGHBORS)[number] } => !!x.n)
    .sort((x, y) => (y.b.sessions.at(-1)?.at ?? 0) - (x.b.sessions.at(-1)?.at ?? 0))
  const list = challenges(bonds, walks)
  const openEarned = open ? earned.includes(open.id) : false
  const route = open ? BADGE_ROUTE[open.id] : undefined

  return (
    <div className="hf-fade-in">
      <RootHeader />
      <div className="hf-page bd-page">
        <div className="bd-titlebar">
          <h1 className="hf-h1">댕댕인증소</h1>
          <p className="hf-sub">{josa(card.name, '과/와')} 함께 쌓은 걸음을 모아 둬요</p>
        </div>

        {/* summary */}
        <section className="bd-summary" aria-labelledby="bd-sum-title">
          <div className="bd-summary__top">
            <div>
              <h2 id="bd-sum-title" className="bd-summary__kicker">모은 배지</h2>
              <p className="bd-summary__count"><b className="num">{earnedCount}</b><span className="num">/ {BADGES.length}</span></p>
            </div>
            <img src={asset('photos/mascot.png')} alt="" className="bd-summary__mascot" />
          </div>
          <div className="bd-progress" role="progressbar" aria-label="배지 모으기 진행" aria-valuemin={0} aria-valuemax={BADGES.length} aria-valuenow={earnedCount} aria-valuetext={`${BADGES.length}개 중 ${earnedCount}개`}>
            <span style={{ width: `${Math.max(pct, earnedCount ? 6 : 0)}%` }} />
          </div>
          <p className="bd-summary__next">
            {next ? <>다음 배지 <b>{next.emoji} {next.title}</b> · {next.how}</> : <>배지를 모두 모았어요. 정말 멋져요!</>}
          </p>
        </section>

        {/* 사이 기록 */}
        <section className="bd-sec" aria-labelledby="bd-bond-title">
          <div className="hf-section__head">
            <div>
              <h2 id="bd-bond-title" className="hf-h2">사이 기록</h2>
              <p className="hf-sub">나란히 걸을수록 막대가 짧아져요 · 가장 가까이 편안했던 거리</p>
            </div>
          </div>
          {rows.length ? (
            <ul className="bd-bonds">
              {rows.map(({ b, n }) => {
                const plan = planFor(card, n, b.sessions)
                const scale = Math.max(12, ...b.sessions.map((s) => s.closest ?? 0))
                return (
                  <li key={n.id}>
                    <Link to={`/app/together/${n.id}`} className="bd-bond">
                      <div className="bd-bond__head">
                        <span className="hf-avatar bd-bond__avatar"><img src={asset(n.photo)} alt="" /></span>
                        <span className="bd-bond__who"><b>{n.name}</b><small>{n.owner} · {n.breed}</small></span>
                        <span className="bd-bond__times num">{b.sessions.length}번 걸음</span>
                        <ChevronRight size={20} strokeWidth={2} className="bd-bond__chev" aria-hidden="true" />
                      </div>
                      <ol className="bd-bars" aria-label={`${josa(n.name, '과/와')} 나란히 걸은 기록`}>
                        {b.sessions.map((s, i) => (
                          <li key={s.at} className={`bd-bar ${s.closest === null ? 'is-intro' : ''}`}>
                            <span className="bd-bar__n num">{i + 1}회</span>
                            <span className="bd-bar__track">
                              <span className="bd-bar__fill" style={{ width: s.closest === null ? '100%' : `${Math.max(14, (s.closest / scale) * 100)}%` }} />
                            </span>
                            <span className="bd-bar__v num">{s.closest === null ? '알아봄' : `${s.closest}m`}</span>
                          </li>
                        ))}
                      </ol>
                      <p className="bd-bond__next">
                        <Footprints size={14} strokeWidth={2.3} aria-hidden="true" />
                        <span>{plan.needsPro ? '다음엔 훈련사와 함께 걸어요' : <>다음엔 <b className="num">{plan.start}m</b>부터 걸어요</>}</span>
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="bd-empty">
              <img src={asset('photos/mascot.png')} alt="" />
              <div>
                <h3 className="bd-empty__title">아직 나란히 걸은 이웃이 없어요</h3>
                <p className="hf-sub">첫 나란히를 걷고 나면 두 친구 사이의 거리가 여기에 기록돼요.</p>
              </div>
              <Link to="/app/together" className="hf-btn hf-btn--primary hf-btn--sm">나란히 걸을 이웃 찾기</Link>
            </div>
          )}
        </section>

        {/* 배지 */}
        <section className="bd-sec" aria-labelledby="bd-badge-title">
          <div className="hf-section__head">
            <div>
              <h2 id="bd-badge-title" className="hf-h2">배지</h2>
              <p className="hf-sub">직접 해 본 일만 배지가 돼요</p>
            </div>
            <span className="bd-count num">{earnedCount}/{BADGES.length}</span>
          </div>
          <ul className="bd-grid">
            {BADGES.map((b) => {
              const on = earned.includes(b.id)
              return (
                <li key={b.id}>
                  <button className={`bd-badge ${on ? 'is-on' : 'is-locked'}`} onClick={() => setOpen(b)} aria-label={`${b.title}, ${on ? '받았어요' : '아직 받지 않았어요'}`}>
                    <span className="bd-badge__medal" aria-hidden="true">
                      <span className="bd-badge__emoji">{b.emoji}</span>
                      {!on && <span className="bd-badge__lock"><Lock size={11} strokeWidth={2.6} /></span>}
                    </span>
                    <span className="bd-badge__title">{b.title}</span>
                    {on ? <span className="bd-badge__got"><CircleCheck size={12} strokeWidth={2.6} aria-hidden="true" />받았어요</span> : <span className="bd-badge__how">{b.how}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        {/* 챌린지 */}
        <section className="bd-sec" aria-labelledby="bd-ch-title">
          <div className="hf-section__head">
            <div>
              <h2 id="bd-ch-title" className="hf-h2">챌린지</h2>
              <p className="hf-sub">작은 목표부터 하나씩 채워 봐요</p>
            </div>
          </div>
          <ul className="bd-challenges">
            {list.map((c) => {
              const done = Math.min(c.done, c.goal)
              const complete = done >= c.goal
              return (
                <li key={c.id} className={`bd-ch ${complete ? 'is-done' : ''}`}>
                  <img src={asset(c.photo)} alt="" className="bd-ch__photo" />
                  <div className="bd-ch__body">
                    <div className="bd-ch__tags">
                      {c.tags.map((t, i) => <span key={t} className={`bd-tag ${i === 0 ? (t === '나란히' ? 'bd-tag--pink' : 'bd-tag--green') : 'bd-tag--grey'}`}>{t}</span>)}
                      {complete && <span className="bd-tag bd-tag--done"><CircleCheck size={12} strokeWidth={2.6} aria-hidden="true" />완료</span>}
                    </div>
                    <h3 className="bd-ch__title">{c.title}</h3>
                    <p className="bd-ch__desc">{c.desc}</p>
                    <div className="bd-ch__foot">
                      <div className="bd-ch__bar" role="progressbar" aria-label={`${c.title} 진행`} aria-valuemin={0} aria-valuemax={c.goal} aria-valuenow={done} aria-valuetext={`${c.goal}번 중 ${done}번`}>
                        <span style={{ width: `${(done / c.goal) * 100}%` }} />
                      </div>
                      <span className="bd-ch__num num"><b>{done}</b>/{c.goal}</span>
                    </div>
                    <p className="bd-ch__period"><CalendarDays size={12} strokeWidth={2.2} aria-hidden="true" />{c.period}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? open.title : '배지'} center>
        {open && (
          <div className="bd-detail">
            <div className={`bd-detail__medal ${openEarned ? 'is-on' : ''}`} aria-hidden="true">
              <span>{open.emoji}</span>
              {!openEarned && <span className="bd-detail__lock"><Lock size={16} strokeWidth={2.4} /></span>}
            </div>
            <div className="bd-detail__tags">
              <span className={`bd-tag ${TAG_CLASS[open.tag]}`}>{open.tag}</span>
              {openEarned
                ? <span className="bd-detail__status is-on"><CircleCheck size={14} strokeWidth={2.4} aria-hidden="true" />받은 배지예요</span>
                : <span className="bd-detail__status"><Lock size={13} strokeWidth={2.4} aria-hidden="true" />아직 받지 않았어요</span>}
            </div>
            {openEarned
              ? <p className="bd-detail__how">{open.how} 받는 배지예요.</p>
              : <p className="bd-detail__how">{open.how} 받을 수 있어요.</p>}
            <div className="bd-detail__actions">
              {!openEarned && route && (
                <button className="hf-btn hf-btn--primary hf-btn--block" onClick={() => { setOpen(null); nav(route.to) }}>{route.label}</button>
              )}
              <button className={`hf-btn ${openEarned ? 'hf-btn--primary' : 'hf-btn--line hf-btn--sm'} hf-btn--block`} onClick={() => setOpen(null)}>{openEarned ? '확인' : '닫기'}</button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
