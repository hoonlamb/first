import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ExternalLink, EyeOff, HardDrive, MapPin, Pencil, Printer, Settings, Trash2, Users, X } from 'lucide-react'
import type { Greeting, Pace, Slot, Trigger } from '../../lib/store'
import { GREETING_ASK, GREETING_LABEL, PACE_LABEL, SIZE_LABEL, SLOT_LABEL, TRIGGER_LABEL, resetDemo, setState, useStore } from '../../lib/store'
import { distanceWords, josa } from '../../lib/korean'
import { awardBadge } from '../../lib/badges'
import { NEIGHBORS } from '../../lib/demo'
import { RootHeader, Sheet, SubHeader } from '../ui/kit'
import { asset } from '../ui/asset'
import './me.css'

const GREETING_EMOJI: Record<Greeting, string> = { hello: '👋', slow: '👃', pass: '🚶' }
const PACE_EMOJI: Record<Pace, string> = { slow: '🐢', steady: '🐕', brisk: '🐇' }
const TRIGGER_EMOJI: Record<Trigger, string> = { bike: '🚲', bigdog: '🐕‍🦺', smalldog: '🐩', kids: '🧒', touch: '✋', noise: '📢' }
const SLOT_EMOJI: Record<Slot, string> = { dawn: '🌅', morning: '☀️', evening: '🌇', night: '🌙' }
const FALLBACK_PHOTO = 'photos/dog-03-bori-terrier.jpg'
const ageLabel = (a?: number) => (a === undefined ? '' : a === 0 ? '1살 미만' : `${a}살`)

/* ================================================================ 마이 */
export function MeScreen() {
  const card = useStore((s) => s.card)!
  const walks = useStore((s) => s.walks)
  const bonds = useStore((s) => s.bonds)
  const saved = useStore((s) => s.saved)
  const reviews = useStore((s) => s.reviews)
  const badges = useStore((s) => s.badges)
  const ask = GREETING_ASK[card.greeting]
  const photo = card.photo ?? FALLBACK_PHOTO

  const actions = [
    { to: '/app/show', e: '📣', t: '보여주기', s: '화면 한 장으로' },
    { to: '/app/tag', e: '🏷️', t: '리드줄 태그', s: '휴대폰 없이도' },
    { to: '/app/walk', e: '🐾', t: '산책 기록', s: walks.length ? `${walks.length}번 걸었어요` : '첫 산책 남기기' },
    { to: '/app/card/edit', e: '✏️', t: '카드 수정', s: '사진·거리·인사' },
  ]

  return (
    <div className="hf-fade-in">
      <RootHeader>
        <Link to="/app/settings" className="hf-iconbtn" aria-label="설정"><Settings size={24} strokeWidth={1.9} /></Link>
      </RootHeader>
      <div className="hf-page me">
        <h1 className="sr-only">마이 · {card.name}</h1>

        <section className="me-profile" aria-label={`${card.name} 프로필`}>
          <div className="me-profile__photo">
            <img src={asset(photo)} alt={`${card.name} 사진`} />
            <Link to="/app/card/edit" className="me-profile__edit" aria-label="카드 수정"><Pencil size={16} strokeWidth={2.4} /></Link>
          </div>
          <p className="me-profile__name">
            {card.name}
            {card.sex && <span className={`me-sex me-sex--${card.sex}`} aria-label={card.sex === 'm' ? '남아' : '여아'}>{card.sex === 'm' ? '♂' : '♀'}</span>}
            {card.age !== undefined && <span className="me-profile__age num">{ageLabel(card.age)}</span>}
          </p>
          <p className="me-profile__breed">{[card.breed, SIZE_LABEL[card.size]].filter(Boolean).join(' · ')}</p>
          <p className="me-profile__dist"><span aria-hidden="true">📏</span> 편한 거리 <b className="num">{card.comfort}m</b> · {distanceWords(card.comfort)}</p>
          <div className="me-stats">
            <Link to="/app/walk"><b className="num">{walks.length}</b><span>산책</span></Link>
            <Link to="/app/together"><b className="num">{Object.keys(bonds).length}</b><span>나란히 이웃</span></Link>
            <Link to="/app/badges"><b className="num">{badges.length}</b><span>배지</span></Link>
          </div>
        </section>

        <nav className="me-actions" aria-label="바로 가기">
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className="me-action">
              <span className="me-action__e" aria-hidden="true">{a.e}</span>
              <span className="me-action__t">{a.t}</span>
              <span className="me-action__s">{a.s}</span>
            </Link>
          ))}
        </nav>

        <section className="hf-section" aria-labelledby="me-card-title">
          <div className="hf-section__head">
            <div>
              <h2 id="me-card-title" className="hf-h2">{card.name}의 산책 카드</h2>
              <p className="hf-sub">보여주기와 리드줄 태그에 이 내용이 들어가요</p>
            </div>
            <Link to="/app/card/edit" className="hf-section__more">수정</Link>
          </div>
          <dl className="me-details">
            <div>
              <dt><span aria-hidden="true">{GREETING_EMOJI[card.greeting]}</span>인사</dt>
              <dd><b>{GREETING_LABEL[card.greeting]}</b><small>“{ask.title}”</small></dd>
            </div>
            <div>
              <dt><span aria-hidden="true">{PACE_EMOJI[card.pace]}</span>걸음</dt>
              <dd><b>{PACE_LABEL[card.pace]}</b></dd>
            </div>
            <div>
              <dt><span aria-hidden="true">⚠️</span>조심할 것</dt>
              <dd>{card.triggers.length
                ? <span className="me-chips">{card.triggers.map((t) => <span key={t} className="hf-chip hf-chip--sm">{TRIGGER_EMOJI[t]} {TRIGGER_LABEL[t]}</span>)}</span>
                : <span className="me-none">특별히 없어요</span>}</dd>
            </div>
            <div>
              <dt><span aria-hidden="true">🕐</span>시간대</dt>
              <dd>{card.slots.length
                ? <span className="me-chips">{card.slots.map((s) => <span key={s} className="hf-chip hf-chip--sm hf-chip--soft">{SLOT_EMOJI[s]} {SLOT_LABEL[s]}</span>)}</span>
                : <span className="me-none">정하지 않았어요</span>}</dd>
            </div>
            <div>
              <dt><span aria-hidden="true">💬</span>한마디</dt>
              <dd>{card.note ? <span className="me-note">{card.note}</span> : <span className="me-none">아직 없어요</span>}</dd>
            </div>
          </dl>
        </section>

        <section className="hf-section" aria-labelledby="me-act-title">
          <h2 id="me-act-title" className="hf-h2">활동</h2>
          <div className="hf-list">
            <Link to="/app/places" className="hf-listrow"><span className="me-ico" aria-hidden="true">📍</span>저장한 장소<span className="hf-listrow__value num">{saved.length}곳 <ChevronRight size={18} /></span></Link>
            <div className="hf-listrow"><span className="me-ico" aria-hidden="true">💌</span>후기<span className="hf-listrow__value">남긴 후기 <b className="num">{reviews.length}</b> · 받은 후기 <b className="num">0</b></span></div>
            <Link to="/app/badges" className="hf-listrow"><span className="me-ico" aria-hidden="true">🏅</span>댕댕인증소 배지<span className="hf-listrow__value num">{badges.length}개 <ChevronRight size={18} /></span></Link>
          </div>
        </section>

        <footer className="me-foot">
          <Link to="/" className="me-foot__link">소개 사이트</Link>
          <span aria-hidden="true">·</span>
          <Link to="/case" className="me-foot__link">케이스 스터디</Link>
          <span aria-hidden="true">·</span>
          <Link to="/app/settings" className="me-foot__link">설정</Link>
          <p className="me-foot__note">댕큐 체험 모드 · 입력은 이 브라우저에만 저장돼요</p>
        </footer>
      </div>
    </div>
  )
}

/* ================================================================ 보여주기 */
/**
 * Outdoor, one-handed, shown to a stranger. First line = what the person should do now;
 * second = how far to keep another dog, in steps (people can't judge "8m").
 */
export function ShowCard() {
  const card = useStore((s) => s.card)!
  const nav = useNavigate()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [awake, setAwake] = useState<'on' | 'off' | 'unsupported'>(() => ('wakeLock' in navigator ? 'off' : 'unsupported'))
  const ask = GREETING_ASK[card.greeting]
  const close = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) nav(-1)
    else nav('/app')
  }

  useEffect(() => {
    awardBadge('show')
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return }
      if (e.key === 'Tab') { e.preventDefault(); closeRef.current?.focus() } // only one control: keep focus inside
    }
    window.addEventListener('keydown', onKey)
    let lock: { release: () => Promise<void> } | null = null
    let gone = false
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
    wl?.request('screen').then((l) => { if (gone) { l.release().catch(() => {}); return } lock = l; setAwake('on') }).catch(() => setAwake('unsupported'))
    return () => { gone = true; window.removeEventListener('keydown', onKey); lock?.release().catch(() => {}) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lines = ask.title.split(', ')
  return (
    <div className={`me-show me-show--${card.greeting}`} role="dialog" aria-modal="true" aria-labelledby="show-ask" aria-describedby="show-dist">
      <div className="me-show__top">
        <span className="me-show__brand"><img src={asset('photos/mascot.png')} alt="" />{card.name}의 산책 카드</span>
        <button ref={closeRef} className="me-show__close" onClick={close} aria-label="보여주기 닫기"><X size={22} strokeWidth={2.6} /><span>닫기</span></button>
      </div>
      <div className="me-show__dog">
        <span className="me-show__ring"><img src={asset(card.photo ?? FALLBACK_PHOTO)} alt="" /></span>
        <span className="me-show__emoji" aria-hidden="true">{GREETING_EMOJI[card.greeting]}</span>
      </div>
      <div className="me-show__sheet">
        <h1 id="show-ask" className="me-show__ask">{lines.map((line, k) => <span key={line}>{line}{k < lines.length - 1 && <>{','}<br /></>}</span>)}</h1>
        <p className="me-show__body">{ask.body}</p>
        <div id="show-dist" className="me-show__dist">
          <span className="me-show__distlabel">개와 함께라면</span>
          <b>{distanceWords(card.comfort)}</b>
          <span className="me-show__distlabel">떨어져 지나가 주세요 <span className="num">(약 {card.comfort}m)</span></span>
          <span className="me-show__steps" aria-hidden="true">{Array.from({ length: Math.min(12, Math.max(3, Math.round(card.comfort / 0.8))) }).map((_, i) => <i key={i} />)}</span>
        </div>
        {card.triggers.length > 0 && (
          <div className="me-show__care">
            <p>{josa(card.name, '은/는')} 이런 것에 놀라요</p>
            <ul>{card.triggers.map((t) => <li key={t} className="hf-chip"><span aria-hidden="true">{TRIGGER_EMOJI[t]}</span>{TRIGGER_LABEL[t]}</li>)}</ul>
          </div>
        )}
        <p className="me-show__thanks">거리를 지켜 줘서, 댕큐.</p>
      </div>
      <p className="sr-only" aria-live="polite">{awake === 'on' ? '보여주는 동안 화면이 꺼지지 않아요.' : ''}</p>
    </div>
  )
}

/* ================================================================ 리드줄 태그 */
/** The phone-free version of 보여주기: the same sentences printed at tag size (80×50mm, front + back). */
export function TagScreen() {
  const card = useStore((s) => s.card)!
  const ask = GREETING_ASK[card.greeting]
  const [printed, setPrinted] = useState(false)
  const print = () => {
    try { window.print(); setPrinted(true) } catch { setPrinted(true) }
  }
  return (
    <div className="hf-fade-in">
      <SubHeader title="리드줄 태그" back="/app/me" />
      <div className="hf-page hf-page--notabs me-tag">
        <div className="me-tag__intro">
          <p className="me-tag__kicker">🏷️ 휴대폰 없이도 보이게</p>
          <h2 className="me-tag__title">누가 다가오는 3초,<br />태그가 대신 말해 줘요</h2>
          <p className="hf-body">휴대폰을 꺼낼 틈이 없을 때를 위해 카드와 같은 문장을 태그로 인쇄해 리드줄이나 하네스에 달아 주세요.</p>
        </div>

        <div className="me-tagp" aria-label="인쇄될 태그 미리보기 (앞면, 뒷면)">
          <div className="me-tagp__item">
            <span className="me-tagp__side" aria-hidden="true">앞면</span>
            <div className="me-tagc me-tagc--front">
              <span className="me-tagc__hole" aria-hidden="true" />
              <p className="me-tagc__ask">{ask.title.split(', ').map((l, k, a) => <span key={l}>{l}{k < a.length - 1 && <>{','}<br /></>}</span>)}</p>
              <p className="me-tagc__dist">개와 함께라면 <b>{distanceWords(card.comfort)}</b> 떨어져 주세요</p>
              <img className="me-tagc__mascot" src={asset('photos/mascot.png')} alt="" />
            </div>
          </div>
          <div className="me-tagp__item">
            <span className="me-tagp__side" aria-hidden="true">뒷면</span>
            <div className="me-tagc me-tagc--back">
              <span className="me-tagc__hole" aria-hidden="true" />
              <span className="me-tagc__photo"><img src={asset(card.photo ?? FALLBACK_PHOTO)} alt="" /></span>
              <div className="me-tagc__who">
                <p className="me-tagc__name">{card.name}</p>
                <p className="me-tagc__thanks">거리를 지켜 줘서, 댕큐.</p>
              </div>
              <span className="me-tagc__logo">댕큐</span>
            </div>
          </div>
        </div>

        <ul className="me-tips">
          <li><span aria-hidden="true">📐</span>실제 크기 약 8×5cm, 앞뒤 한 쌍으로 인쇄돼요.</li>
          <li><span aria-hidden="true">✂️</span>모서리를 둥글게 잘라 구멍에 고리를 끼워 주세요.</li>
          <li><span aria-hidden="true">💧</span>방수 코팅이나 비닐 커버를 씌우면 오래가요.</li>
        </ul>

        <div className="me-tag__cta">
          <button className="hf-btn hf-btn--primary hf-btn--block" onClick={print}><Printer size={20} /> 인쇄하기</button>
          {printed && <p className="hf-meta me-tag__note" role="status">인쇄 창이 열리지 않았다면, 미리보기 화면 안에서는 인쇄가 막혀 있을 수 있어요. 새 탭에서 열어 다시 시도해 주세요.</p>}
          <Link to="/app/card/edit" className="hf-btn hf-btn--line hf-btn--block"><Pencil size={18} /> 문장 바꾸기(카드 수정)</Link>
        </div>
      </div>
    </div>
  )
}

/* ================================================================ 설정 */
export function SettingsScreen() {
  const s = useStore((x) => x)
  const [ask, setAsk] = useState(false)
  const nav = useNavigate()
  const counts = [
    { k: '산책 카드', v: s.card ? '1장' : '없음' },
    { k: '산책 기록', v: `${s.walks.length}개` },
    { k: '나란히 기록', v: `${Object.keys(s.bonds).length}명` },
    { k: '채팅', v: `${Object.keys(s.threads).length}개` },
    { k: '저장한 장소', v: `${s.saved.length}곳` },
    { k: '배지', v: `${s.badges.length}개` },
  ]
  const hasData = !!s.card || s.walks.length > 0 || s.badges.length > 0 || s.saved.length > 0 || s.reviews.length > 0
    || s.hidden.length > 0 || Object.keys(s.threads).length > 0 || Object.keys(s.bonds).length > 0 || Object.keys(s.requests).length > 0 || Object.keys(s.answers).length > 0
  const facts = [
    { icon: HardDrive, t: '이 브라우저에만 저장돼요', b: '입력한 카드와 기록은 이 브라우저(localStorage)에만 있어요. 서버로 보내지 않아요.' },
    { icon: Users, t: '이웃은 시연용이에요', b: '이웃 개 6마리와 수락·채팅 응답은 시연용 데이터예요. 실제 사람에게 전달되지 않아요.' },
    { icon: MapPin, t: '위치는 저장하지 않아요', b: '위치 권한을 허용해도 좌표는 저장하지 않고 시연용 동네를 보여 줘요.' },
    { icon: EyeOff, t: '체험에 없는 기능', b: '이웃 숨기기는 이 브라우저에서만 작동해요. 신고, 보호자 인증, 결제, 실제 매칭은 운영 체계가 필요해서 이 체험에 없어요.' },
  ]
  return (
    <div className="hf-fade-in">
      <SubHeader title="설정" back="/app/me" />
      <div className="hf-page hf-page--notabs me-set">
        <section className="hf-section" aria-labelledby="set-demo">
          <h2 id="set-demo" className="hf-h2">체험 모드 안내</h2>
          <ul className="hf-list me-facts">
            {facts.map(({ icon: Icon, t, b }) => (
              <li key={t}><span className="me-facts__ico" aria-hidden="true"><Icon size={18} strokeWidth={2} /></span><div><b>{t}</b><p>{b}</p></div></li>
            ))}
          </ul>
        </section>

        <section className="hf-section" aria-labelledby="set-hidden">
          <div><h2 id="set-hidden" className="hf-h2">숨긴 이웃</h2><p className="hf-sub">숨긴 이웃은 나란히 목록과 홈에 보이지 않아요</p></div>
          {s.hidden.length === 0 ? (
            <p className="me-empty">숨긴 이웃이 없어요.</p>
          ) : (
            <ul className="hf-list">
              {s.hidden.map((hid) => {
                const n = NEIGHBORS.find((x) => x.id === hid)
                return (
                  <li key={hid} className="hf-listrow">
                    <span className="hf-avatar">{n && <img src={asset(n.photo)} alt="" />}</span>
                    <span>{n?.name ?? hid}<small className="me-sub">{n ? `${n.breed} · ${n.hood}` : ''}</small></span>
                    <button className="hf-btn hf-btn--soft hf-btn--sm me-unhide" onClick={() => setState((x) => ({ ...x, hidden: x.hidden.filter((y) => y !== hid) }))}
                      aria-label={`${n?.name ?? hid} 다시 보기`}>다시 보기</button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="hf-section" aria-labelledby="set-data">
          <h2 id="set-data" className="hf-h2">저장된 데이터</h2>
          <dl className="me-counts">
            {counts.map((c) => <div key={c.k}><dt>{c.k}</dt><dd className="num">{c.v}</dd></div>)}
          </dl>
          <button className="hf-btn hf-btn--line hf-btn--block me-danger" onClick={() => setAsk(true)} disabled={!hasData}><Trash2 size={18} /> 체험 데이터 모두 지우기</button>
        </section>

        <nav className="me-foot" aria-label="댕큐 더 보기">
          <Link to="/" className="me-foot__link">소개 사이트 <ExternalLink size={13} /></Link>
          <span aria-hidden="true">·</span>
          <Link to="/case" className="me-foot__link">케이스 스터디 <ExternalLink size={13} /></Link>
        </nav>
      </div>
      <Sheet open={ask} onClose={() => setAsk(false)} title="체험 데이터를 모두 지울까요?" center>
        <p className="hf-body">카드, 산책 기록, 사이 기록, 채팅과 배지가 모두 사라지고 처음 화면으로 돌아가요.</p>
        <div className="me-confirm">
          <button className="hf-btn hf-btn--line" onClick={() => setAsk(false)}>취소</button>
          <button className="hf-btn hf-btn--danger" onClick={() => { resetDemo(); setAsk(false); nav('/app/start', { replace: true }) }}>모두 지우기</button>
        </div>
      </Sheet>
    </div>
  )
}
