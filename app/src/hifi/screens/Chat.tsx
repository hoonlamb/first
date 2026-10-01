import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, ArrowUp, CalendarHeart, CalendarPlus, Check, ChevronLeft, ChevronRight, Footprints, IdCard, Info,
  LoaderCircle, MapPin, MapPinned, MessageCircle, PenLine, Plus, Sun, X,
} from 'lucide-react'
import { GREETING_LABEL, PACE_LABEL, TRIGGER_LABEL, getState, useStore, type Message, type Meet } from '../../lib/store'
import { sendMessage, proposeMeet, markRead } from '../../lib/chat'
import { NEIGHBORS, planFor, type Neighbor, type Plan } from '../../lib/demo'
import { PLACES, type Place } from '../../lib/places'
import { distanceWords, josa } from '../../lib/korean'
import { Avatar, Sheet, SubHeader } from '../ui/kit'
import { asset } from '../ui/asset'
import './chat.css'

/* ---------------------------------------------------------------- helpers */

const WD = ['일', '월', '화', '수', '목', '금', '토']
const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseYmd = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() }
const DAY = 86400000

/** "오후 7:12" */
function clock(ts: number) {
  const d = new Date(ts)
  const h = d.getHours()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${pad(d.getMinutes())}`
}
/** "18:00" → "오후 6:00" */
function timeLabel(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${pad(m)}`
}
/** "2026-10-02" → "10월 2일 (금)", with 오늘/내일 prefix */
function dateLabel(s: string, withRel = true) {
  const d = parseYmd(s)
  const base = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`
  if (!withRel) return base
  const diff = Math.round((d.getTime() - startOfDay(Date.now())) / DAY)
  return diff === 0 ? `오늘 · ${base}` : diff === 1 ? `내일 · ${base}` : base
}
/** date separator: "오늘", "어제", "9월 28일 월요일" */
function dayDivider(ts: number) {
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / DAY)
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  const d = new Date(ts)
  return `${d.getFullYear() !== new Date().getFullYear() ? `${d.getFullYear()}년 ` : ''}${d.getMonth() + 1}월 ${d.getDate()}일 ${WD[d.getDay()]}요일`
}
/** list time: 방금 / N분 전 / 오후 7:12 / 어제 / 9월 28일 */
function relTime(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60000) return '방금'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  const days = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / DAY)
  if (days === 0) return clock(ts)
  if (days === 1) return '어제'
  const d = new Date(ts)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** Meet.placeId is a PLACES id, or "custom:<text>" when the user typed a place, or null (decide in chat). */
function meetPlace(placeId: string | null): { name: string; place?: Place } | null {
  if (!placeId) return null
  if (placeId.startsWith('custom:')) return { name: placeId.slice(7) }
  const place = PLACES.find((p) => p.id === placeId)
  return place ? { name: place.name, place } : null
}

const PLACE_PREFIX = '여기 어때요? '
const CARD_PREFIX = '🪪 '
const placeFromText = (text?: string) => (text?.startsWith(PLACE_PREFIX) ? PLACES.find((p) => p.name === text.slice(PLACE_PREFIX.length).trim()) : undefined)

/* unread state lives in the store (lib/chat isUnread/markRead) so the tab badge and home icon agree */
const readSeen = (): Record<string, number> => getState().seen
const markSeen = (id: string, _len: number) => markRead(id)

/** Arrow-key navigation for role="radio" chips inside a radiogroup (roving focus). */
function radioKeys(e: KeyboardEvent<HTMLElement>) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(e.key)) return
  const radios = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not([disabled])'))
  const i = radios.indexOf(document.activeElement as HTMLButtonElement)
  if (!radios.length) return
  e.preventDefault()
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? radios.length - 1
    : (i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + radios.length) % radios.length
  radios[next].focus()
  radios[next].click()
}

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Demo partner reply (fictional neighbour, 체험 모드). Rotates canned lines; reacts to place / card posts. */
function demoReply(n: Neighbor, text: string, myName: string, myComfort: number, nth: number) {
  const place = placeFromText(text)
  if (place) return place.open
    ? `${place.name} 좋아요! 탁 트인 곳이라 ${josa(n.name, '이/(없음)')}도 편할 것 같아요.`
    : `거기도 좋은데, 첫날은 좀 더 넓은 곳이면 ${josa(n.name, '이/(없음)')}가 편할 것 같아요.`
  if (text.startsWith(CARD_PREFIX)) return `카드 잘 받았어요. ${myName} 편한 거리 ${myComfort}m, 꼭 지킬게요 🙂`
  const lines = [
    `반가워요! ${josa(n.name, '이/(없음)')}도 산책 정말 좋아해요 🐾`,
    '네, 좋아요. 첫날은 멀리서 같은 방향으로만 걸어요.',
    '편하실 때 + 버튼으로 약속 카드 보내 주세요!',
    `${josa(n.name, '은/는')} 오늘 컨디션 좋아요. 천천히 맞춰 가요.`,
  ]
  return lines[nth % lines.length]
}

/** A clock that re-renders on an interval (keeps render pure; Date.now() is read in state/effects only). */
function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t) }, [ms])
  return now
}

function useNeighbor(id: string | undefined) {
  return NEIGHBORS.find((n) => n.id === id)
}

/* ---------------------------------------------------------------- ChatList */

export function ChatList() {
  const threads = useStore((s) => s.threads)
  const requests = useStore((s) => s.requests)
  const meets = useStore((s) => s.meets)
  const hidden = useStore((s) => s.hidden)
  const [seen] = useState(readSeen)

  const rows = NEIGHBORS
    .filter((n) => !hidden.includes(n.id) && ((threads[n.id]?.length ?? 0) > 0 || requests[n.id]))
    .map((n) => {
      const t = threads[n.id] ?? []
      const last = t[t.length - 1]
      const req = requests[n.id]
      const at = last?.at ?? req?.at ?? 0
      const unread = !!last && last.from === 'them' && t.length > (seen[n.id] ?? 0)
      let preview: string
      if (!last) preview = req?.status === 'pending' ? '나란히 요청을 보냈어요 · 답을 기다리는 중' : '대화를 시작해 보세요'
      else if (last.meet) preview = `${last.from === 'me' ? '나' : n.owner}: 약속 카드 · ${dateLabel(last.meet.date, false)} ${timeLabel(last.meet.time)}`
      else if (last.text?.startsWith(CARD_PREFIX)) preview = '산책 카드를 보냈어요'
      else preview = last.text ?? ''
      const meet = meets[n.id]
      return { n, at, unread, preview, pending: req?.status === 'pending', meet }
    })
    .sort((a, b) => b.at - a.at)

  return (
    <div className="hf-fade-in cx-fill">
      <SubHeader title="채팅" back="/app" />
      {rows.length === 0 ? (
        <div className="hf-page hf-page--notabs cx-empty-page">
          <div className="hf-empty cx-empty">
            <img src={asset('photos/mascot.png')} alt="" />
            <h2 className="hf-h2">아직 대화가 없어요</h2>
            <p className="hf-sub">나란히 탭에서 이웃에게 요청해 보세요.<br />요청이 수락되면 여기서 약속을 잡을 수 있어요.</p>
            <Link to="/app/together" className="hf-btn hf-btn--primary"><Footprints size={18} /> 나란히 이웃 보러 가기</Link>
          </div>
        </div>
      ) : (
        <div className="hf-page hf-page--notabs cx-list-page">
          <p className="cx-demo-note"><Info size={15} aria-hidden="true" /> 체험 모드 · 이웃의 답장은 미리 만든 예시예요</p>
          <ul className="cx-list" aria-label="대화 목록">
            {rows.map(({ n, at, unread, preview, pending, meet }) => (
              <li key={n.id}>
                <Link to={`/app/chat/${n.id}`} className={`cx-item ${unread ? 'is-unread' : ''}`}
                  aria-label={`${n.name} · ${n.owner}${unread ? ', 새 메시지' : ''}. ${preview}${at > 0 ? `. ${relTime(at)}` : ''}`}>
                  <span className="cx-item__av"><img src={asset(n.photo)} alt="" /></span>
                  <span className="cx-item__main">
                    <span className="cx-item__top">
                      <span className="cx-item__name">{n.name}<small> · {n.owner}</small></span>
                      {at > 0 && <span className="cx-item__time num">{relTime(at)}</span>}
                    </span>
                    <span className="cx-item__bottom">
                      <span className={`cx-item__preview ${pending ? 'is-muted' : ''}`}>{preview}</span>
                      {unread && <span className="cx-item__dot" aria-hidden="true" />}
                    </span>
                    {(pending || meet) && (
                      <span className="cx-item__tags">
                        {pending && <span className="hf-pill hf-pill--alert">수락 대기</span>}
                        {meet && <span className={`hf-pill ${meet.confirmed ? 'hf-pill--calm' : 'hf-pill--pink'}`}>
                          {meet.confirmed ? <Check size={12} strokeWidth={3} /> : <CalendarHeart size={12} />}
                          <span className="num">{dateLabel(meet.date, false)} {timeLabel(meet.time)}</span>
                        </span>}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- ChatThread */

export function ChatThread() {
  const { id } = useParams()
  const n = useNeighbor(id)
  if (!n) return <Navigate to="/app/chat" replace />
  return <Thread key={n.id} n={n} />
}

type Group = { key: string; from: Message['from']; msgs: Message[]; day?: string }

function groupMessages(msgs: Message[]): Group[] {
  const out: Group[] = []
  let lastDay = -1
  for (const m of msgs) {
    const day = startOfDay(m.at)
    const newDay = day !== lastDay
    lastDay = day
    const prev = out[out.length - 1]
    const prevMsg = prev?.msgs[prev.msgs.length - 1]
    const join = !newDay && prev && prev.from === m.from && m.from !== 'system' && !m.meet && !prevMsg?.meet && m.at - (prevMsg?.at ?? 0) < 5 * 60000
    if (join) prev.msgs.push(m)
    else out.push({ key: m.id, from: m.from, msgs: [m], day: newDay ? dayDivider(m.at) : undefined })
  }
  return out
}

function Thread({ n }: { n: Neighbor }) {
  const nav = useNavigate()
  const card = useStore((s) => s.card)!
  const thread = useStore((s) => s.threads[n.id])
  const req = useStore((s) => s.requests[n.id])
  const meet = useStore((s) => s.meets[n.id])
  const sessions = useStore((s) => s.bonds[n.id]?.sessions)
  const msgs = useMemo(() => thread ?? [], [thread])
  const plan = planFor(card, n, sessions)
  const accepted = req?.status === 'accepted'
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [sheet, setSheet] = useState<null | 'actions' | 'places'>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Latest message carrying the current meet → the only "live" meet card.
  const liveMeetMsgId = useMemo(() => {
    if (!meet) return null
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i].meet
      if (m && m.date === meet.date && m.time === meet.time && m.placeId === meet.placeId) return msgs[i].id
    }
    return null
  }, [msgs, meet])
  const liveMeetMsg = msgs.find((m) => m.id === liveMeetMsgId)
  const pendingMeet = !!meet && !meet.confirmed && !!liveMeetMsg
  const now = useNow(pendingMeet ? 1000 : 30000)
  const confirming = pendingMeet && now - liveMeetMsg.at < 4000
  const showTyping = typing || confirming

  // Seen map for the list's unread dot.
  useEffect(() => { markSeen(n.id, msgs.length) }, [n.id, msgs.length])

  // Keep #hf-scroll pinned to the newest message (after HfApp's own scroll-to-top on route change).
  const first = useRef(true)
  useEffect(() => {
    const el = document.getElementById('hf-scroll')
    if (!el) return
    const smooth = !first.current && !reduceMotion()
    first.current = false
    const raf = requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }))
    return () => cancelAnimationFrame(raf)
  }, [msgs.length, showTyping])

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) nav(-1)
    else nav('/app/chat')
  }

  const post = (body: string) => {
    const t = body.trim()
    if (!t) return
    sendMessage(n.id, { from: 'me', text: t })
    if (!accepted) return
    const nth = (getState().threads[n.id] ?? []).filter((m) => m.from === 'me' && m.text).length - 1
    setTyping(true)
    setTimeout(() => {
      if (getState().requests[n.id]?.status === 'accepted') sendMessage(n.id, { from: 'them', text: demoReply(n, t, card.name, card.comfort, nth) })
      setTyping(false)
    }, 1200)
  }

  const submit = () => { post(text); setText(''); inputRef.current?.focus() }

  const sendCard = () => {
    const lines = [
      `${CARD_PREFIX}${card.name}의 산책 카드`,
      `편한 거리 ${card.comfort}m · ${distanceWords(card.comfort)}`,
      `${PACE_LABEL[card.pace]} 걸어요 · ${GREETING_LABEL[card.greeting]}`,
    ]
    if (card.triggers.length) lines.push(`조심해 주세요: ${card.triggers.map((t) => TRIGGER_LABEL[t]).join(', ')}`)
    setSheet(null)
    post(lines.join('\n'))
  }

  const groups = groupMessages(msgs)
  const ruleText = plan.sessionIndex === 0
    ? <>첫날은 <b className="num">{plan.start}m</b>부터 · <b className="num">{plan.floor}m</b>까지 · 인사 없이</>
    : <><span className="num">{plan.sessionIndex + 1}</span>번째 나란히 · <b className="num">{plan.start}m</b>부터 · <b className="num">{plan.floor}m</b>까지 · {plan.canGreet ? '인사는 둘 다 편할 때' : '인사 없이'}</>

  return (
    <div className="cx-fill cx-thread">
      <header className="hf-header hf-header--sub cx-head">
        <button className="hf-iconbtn" onClick={goBack} aria-label="뒤로"><ChevronLeft size={26} strokeWidth={2} /></button>
        <Link to={`/app/together/${n.id}`} className="cx-head__who" aria-label={`${n.name} 프로필 보기`}>
          <span className="cx-head__av"><img src={asset(n.photo)} alt="" /></span>
          <span className="cx-head__text">
            <h1 className="cx-head__name">{n.name}</h1>
            <span className="cx-head__owner">{n.owner} · {n.hood}</span>
          </span>
        </Link>
        <span className="cx-head__demo">체험 모드</span>
      </header>

      <div className="cx-rules">
        <span className="cx-rules__icon" aria-hidden="true"><Footprints size={18} /></span>
        <span className="cx-rules__text">
          <b className="cx-rules__title">나란히 약속 규칙</b>
          <span>{ruleText}</span>
          {plan.needsPro && <span className="cx-rules__pro">편한 거리가 먼 조합이라 훈련사 동행이 필요해요 (준비 중)</span>}
        </span>
      </div>

      <div className="cx-msgs" role="log" aria-label={`${n.owner}님과의 대화`} aria-live="polite">
        <p className="cx-system cx-system--intro"><Info size={13} aria-hidden="true" /> 체험 모드 · {n.owner}님의 답장은 미리 만든 예시예요</p>

        {!accepted && (
          <div className="cx-gate" role="note">
            <span className="cx-gate__icon" aria-hidden="true">{req ? <LoaderCircle size={20} className="cx-spin" /> : <Footprints size={20} />}</span>
            <span>
              <b>요청이 수락되면 약속을 잡을 수 있어요</b>
              <small>{req ? `${n.owner}님에게 나란히 요청을 보냈어요. 답을 기다리는 중이에요.` : `먼저 ${josa(n.name, '과/와')} 나란히 걷기를 요청해 주세요.`}</small>
            </span>
            {!req && <Link to={`/app/together/${n.id}`} className="hf-btn hf-btn--soft hf-btn--sm">요청하기</Link>}
          </div>
        )}

        {groups.map((g) => (
          <div key={g.key} className="cx-group-wrap">
            {g.day && <p className="cx-day"><span>{g.day}</span></p>}
            {g.from === 'system' ? (
              g.msgs.map((m) => <p key={m.id} className="cx-system">{m.text}</p>)
            ) : (
              <div className={`cx-group cx-group--${g.from}`}>
                {g.from === 'them' && <span className="cx-group__av"><img src={asset(n.photo)} alt="" /></span>}
                <div className="cx-group__col">
                  {g.from === 'them' && <p className="cx-group__name">{n.owner}</p>}
                  {g.msgs.map((m, i) => (
                    <div key={m.id} className="cx-line">
                      {m.meet ? (
                        <MeetCard n={n} m={m.meet} stale={now - m.at > 4000} live={m.id === liveMeetMsgId} meet={meet} accepted={accepted} plan={plan} />
                      ) : (
                        <Bubble m={m} from={g.from} photo={g.from === 'me' ? card.photo : n.photo} />
                      )}
                      {i === g.msgs.length - 1 && <time className="cx-time num" dateTime={new Date(m.at).toISOString()}>{clock(m.at)}</time>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {showTyping && (
          <div className="cx-group cx-group--them cx-typing-row">
            <span className="cx-group__av"><img src={asset(n.photo)} alt="" /></span>
            <div className="cx-typing" role="status" aria-label={`${n.owner}님 답장 준비 중 (체험)`}><i /><i /><i /></div>
          </div>
        )}
      </div>

      <form className="cx-composer" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <button type="button" className="cx-plus" disabled={!req} aria-label="더하기: 약속 잡기, 장소 추천, 산책 카드" aria-haspopup="dialog" onClick={() => setSheet('actions')}>
          <Plus size={22} strokeWidth={2.4} />
        </button>
        <label className="cx-field">
          <span className="sr-only">메시지</span>
          <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder={req ? '메시지를 입력하세요' : '요청을 보내면 대화할 수 있어요'} enterKeyHint="send" disabled={!req}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault() }} maxLength={500} />
          <button type="submit" className="cx-send" disabled={!text.trim()} aria-label="보내기"><ArrowUp size={20} strokeWidth={2.6} /></button>
        </label>
      </form>

      <Sheet open={sheet === 'actions'} onClose={() => setSheet((s) => (s === 'actions' ? null : s))} title="보내기">
        <ul className="cx-actions">
          <li>
            <button className="cx-action" disabled={!accepted} onClick={() => { setSheet(null); nav(`/app/chat/${n.id}/meet`) }}>
              <span className="cx-action__icon cx-action__icon--pink" aria-hidden="true"><CalendarPlus size={22} /></span>
              <span className="cx-action__text"><b>약속 잡기</b><small>{accepted ? '날짜·시간·장소를 골라 Meet 카드로 보내요' : '요청이 수락되면 약속을 잡을 수 있어요'}</small></span>
              <ChevronRight size={18} className="cx-action__chev" aria-hidden="true" />
            </button>
          </li>
          <li>
            <button className="cx-action" onClick={() => setSheet('places')}>
              <span className="cx-action__icon cx-action__icon--green" aria-hidden="true"><MapPin size={22} /></span>
              <span className="cx-action__text"><b>장소 추천</b><small>첫 나란히 하기 좋은 탁 트인 곳을 보내요</small></span>
              <ChevronRight size={18} className="cx-action__chev" aria-hidden="true" />
            </button>
          </li>
          <li>
            <button className="cx-action" onClick={sendCard}>
              <span className="cx-action__icon cx-action__icon--blue" aria-hidden="true"><IdCard size={22} /></span>
              <span className="cx-action__text"><b>내 산책 카드 보내기</b><small>{card.name}의 편한 거리 {card.comfort}m와 조심할 점을 알려요</small></span>
              <ChevronRight size={18} className="cx-action__chev" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </Sheet>

      <Sheet open={sheet === 'places'} onClose={() => setSheet((s) => (s === 'places' ? null : s))} title="장소 추천">
        <p className="hf-sub cx-sheet-sub">넓고 탁 트여서 첫 나란히 하기 좋은 곳만 모았어요.</p>
        <ul className="cx-places">
          {PLACES.filter((p) => p.open).map((p) => (
            <li key={p.id}>
              <button className="cx-place" onClick={() => { setSheet(null); post(`${PLACE_PREFIX}${p.name}`) }} aria-label={`${p.name} 추천 보내기`}>
                <img src={asset(p.photo)} alt="" />
                <span className="cx-place__text"><b>{p.name}</b><small>{p.area} · {p.kind}</small><span className="hf-pill hf-pill--calm">첫 나란히 추천</span></span>
                <span className="cx-place__send">보내기</span>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  )
}

function Bubble({ m, from, photo }: { m: Message; from: 'me' | 'them' | 'system'; photo?: string }) {
  const text = m.text ?? ''
  if (text.startsWith(CARD_PREFIX)) {
    const [title, ...rest] = text.slice(CARD_PREFIX.length).split('\n')
    return (
      <div className={`cx-dogcard cx-dogcard--${from}`}>
        <div className="cx-dogcard__head">
          <span className="cx-dogcard__av">{photo && <img src={asset(photo)} alt="" />}</span>
          <span><small>산책 카드</small><b>{title.replace(/의 산책 카드$/, '')}</b></span>
          <IdCard size={18} className="cx-dogcard__icon" aria-hidden="true" />
        </div>
        <ul className="cx-dogcard__rows">{rest.map((r) => <li key={r}>{r}</li>)}</ul>
      </div>
    )
  }
  const place = placeFromText(text)
  return (
    <div className="cx-bubble-stack">
      <p className={`cx-bubble cx-bubble--${from}`}>{text}</p>
      {place && (
        <Link to={`/app/places/${place.id}`} className="cx-placeprev">
          <img src={asset(place.photo)} alt="" />
          <span className="cx-placeprev__body">
            <b>{place.name}</b>
            <small><MapPin size={12} aria-hidden="true" /> {place.area} · {place.kind}</small>
            {place.open && <span className="cx-placeprev__tag">첫 나란히 추천</span>}
          </span>
        </Link>
      )}
    </div>
  )
}

function MeetCard({ n, m, stale: old, live, meet, accepted, plan }: { n: Neighbor; m: Meet; stale: boolean; live: boolean; meet?: Meet; accepted: boolean; plan: Plan }) {
  const place = meetPlace(m.placeId)
  const status: 'old' | 'wait' | 'ok' = !live ? 'old' : meet?.confirmed ? 'ok' : 'wait'
  const stale = status === 'wait' && old
  const blocked = !accepted ? '요청이 수락되면 시작할 수 있어요' : plan.needsPro ? '훈련사 동행 나란히는 준비 중이에요' : null
  return (
    <article className={`cx-meet cx-meet--${status}`} aria-label={`나란히 약속 카드, ${dateLabel(m.date, false)} ${timeLabel(m.time)}`}>
      <header className="cx-meet__head">
        <CalendarHeart size={17} aria-hidden="true" />
        <span>나란히 약속</span>
        <span className="cx-meet__status" role="status">
          {status === 'ok' && <><Check size={13} strokeWidth={3} aria-hidden="true" /> 확정</>}
          {status === 'wait' && (stale ? '답을 기다리는 중' : <><LoaderCircle size={13} className="cx-spin" aria-hidden="true" /> 확인 중</>)}
          {status === 'old' && '변경됨'}
        </span>
      </header>
      <div className="cx-meet__body">
        <p className="cx-meet__when"><span>{dateLabel(m.date)}</span><b className="num">{timeLabel(m.time)}</b></p>
        <div className="cx-meet__place">
          {place?.place ? <img src={asset(place.place.photo)} alt="" /> : <span className="cx-meet__pin" aria-hidden="true"><MapPin size={20} /></span>}
          <span>
            <b>{place ? place.name : '장소는 대화로 정해요'}</b>
            <small>{place?.place ? `${place.place.area} · ${place.place.open ? '탁 트인 곳' : place.place.kind}` : place ? '직접 입력한 장소' : '장소 추천을 보내 보세요'}</small>
          </span>
        </div>
        <p className="cx-meet__rule"><Footprints size={14} aria-hidden="true" /> <span><span className="num">{plan.start}m</span>부터 · <span className="num">{plan.floor}m</span>까지{plan.sessionIndex === 0 ? ' · 인사 없이' : ''}</span></p>
        {status === 'ok' && (
          blocked ? (
            <div className="cx-meet__cta">
              <button className="hf-btn hf-btn--primary hf-btn--block" disabled aria-describedby={`why-${n.id}`}>나란히 시작</button>
              <p className="cx-meet__why" id={`why-${n.id}`}>{blocked}</p>
            </div>
          ) : (
            <Link to={`/app/together/${n.id}/walk`} className="hf-btn hf-btn--primary hf-btn--block cx-meet__go"><Footprints size={18} /> 나란히 시작</Link>
          )
        )}
        {status === 'wait' && <p className="cx-meet__why">{n.owner}님이 확인하면 확정돼요</p>}
      </div>
    </article>
  )
}

/* ---------------------------------------------------------------- MeetPlanner */

const TIMES = {
  am: ['07:00', '08:00', '09:00', '10:00', '11:00'],
  pm: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'],
}
const FIRST_MEET_LAST = '19:00'

export function MeetPlanner() {
  const { id } = useParams()
  const n = useNeighbor(id)
  if (!n) return <Navigate to="/app/chat" replace />
  return <Planner key={n.id} n={n} />
}

function Planner({ n }: { n: Neighbor }) {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const card = useStore((s) => s.card)!
  const req = useStore((s) => s.requests[n.id])
  const sessions = useStore((s) => s.bonds[n.id]?.sessions)
  const existing = useStore((s) => s.meets[n.id])
  const plan = planFor(card, n, sessions)
  const firstMeet = plan.sessionIndex === 0
  const accepted = req?.status === 'accepted'

  const now = useNow(60000)
  const today = startOfDay(now)
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(today + i * DAY + 3600000)), [today]) // +1h guards DST edges
  const dayIds = days.map(ymd)

  const qPlace = params.get('place')
  const initPlace = PLACES.find((p) => p.id === qPlace) ?? (existing?.placeId ? PLACES.find((p) => p.id === existing.placeId) : undefined)
  const initCustom = !qPlace && existing?.placeId?.startsWith('custom:') ? existing.placeId.slice(7) : ''
  const [date, setDate] = useState<string | null>(existing && dayIds.includes(existing.date) ? existing.date : null)
  const [time, setTime] = useState<string | null>(existing && dayIds.includes(existing.date) ? existing.time : null)
  const [mode, setMode] = useState<'pick' | 'custom' | null>(initPlace ? 'pick' : initCustom ? 'custom' : null)
  const [placeId, setPlaceId] = useState<string | null>(initPlace?.id ?? null)
  const [custom, setCustom] = useState(initCustom)
  const [alarm, setAlarm] = useState(true)
  const [placeSheet, setPlaceSheet] = useState(false)
  const [tried, setTried] = useState(false)
  const customRef = useRef<HTMLInputElement>(null)

  const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
  /** Why a time can't be picked on a given day: night (first meeting) or already past / within 30 minutes. */
  const disabledFor = (d: string | null, t: string): 'night' | 'past' | null => {
    if (firstMeet && t > FIRST_MEET_LAST) return 'night'
    if (d !== dayIds[0]) return null
    const soon = new Date(now + 30 * 60000)
    if (ymd(soon) !== d) return 'past'
    return t <= hm(soon) ? 'past' : null
  }
  const timeDisabled = (t: string) => disabledFor(date, t)
  const isToday = date === dayIds[0]
  const pickDate = (d: string) => {
    setDate(d)
    if (time && disabledFor(d, time)) setTime(null)
  }

  const place = placeId ? PLACES.find((p) => p.id === placeId) : undefined
  const placeValue = mode === 'pick' && placeId ? placeId : mode === 'custom' && custom.trim() ? `custom:${custom.trim()}` : null
  const ready = !!date && !!time && accepted
  const missing = !date && !time ? '날짜와 시간을 골라 주세요' : !date ? '날짜를 골라 주세요' : !time ? '시간을 골라 주세요' : null

  const send = () => {
    setTried(true)
    if (!ready || !date || !time) {
      const target = document.getElementById(!date ? 'meet-date' : 'meet-time')
      target?.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' })
      return
    }
    proposeMeet(n.id, { date, time, placeId: placeValue })
    nav(`/app/chat/${n.id}`, { replace: true })
  }

  const visiblePlaces = firstMeet ? PLACES.filter((p) => p.open) : PLACES
  const allDisabled = [...TIMES.am, ...TIMES.pm].every((t) => timeDisabled(t))

  return (
    <div className="hf-fade-in cx-fill cx-planner">
      <SubHeader title="약속 잡기" back={`/app/chat/${n.id}`} />
      <div className="hf-page hf-page--notabs cx-plan">
        <div className="cx-plan__intro">
          <Avatar src={n.photo} size="lg" />
          <div>
            <h2 className="cx-plan__title">{n.owner}님과 나란히 약속</h2>
            <p className="hf-sub">{n.name} · {n.breed} · {firstMeet ? '첫 만남이에요' : `${plan.sessionIndex + 1}번째 나란히`}</p>
          </div>
        </div>

        {!accepted && (
          <div className="cx-gate" role="note">
            <span className="cx-gate__icon" aria-hidden="true"><Info size={20} /></span>
            <span><b>요청이 수락되면 약속을 잡을 수 있어요</b><small>{req ? '답을 기다리는 중이에요.' : `먼저 나란히 탭에서 ${josa(n.name, '과/와')} 걷기를 요청해 주세요.`}</small></span>
          </div>
        )}

        {/* date */}
        <section className="cx-sec" aria-labelledby="meet-date">
          <div className="cx-sec__head"><h3 id="meet-date" className="cx-sec__title">날짜</h3>{date && <span className="cx-sec__value">{dateLabel(date)}</span>}</div>
          <div className="cx-dates" role="radiogroup" aria-labelledby="meet-date" aria-required="true" onKeyDown={radioKeys}>
            {days.map((d, i) => {
              const v = dayIds[i]
              const on = date === v
              return (
                <button key={v} type="button" role="radio" aria-checked={on} tabIndex={on || (!date && i === 0) ? 0 : -1}
                  aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일 ${WD[d.getDay()]}요일${i === 0 ? ', 오늘' : ''}`}
                  className={`cx-date ${on ? 'is-on' : ''} ${d.getDay() === 0 ? 'is-sun' : d.getDay() === 6 ? 'is-sat' : ''}`} onClick={() => pickDate(v)}>
                  <span className="cx-date__wd">{i === 0 ? '오늘' : WD[d.getDay()]}</span>
                  <span className="cx-date__d num">{d.getDate()}</span>
                </button>
              )
            })}
          </div>
          {tried && !date && <p className="cx-err" role="alert">날짜를 골라 주세요</p>}
        </section>

        {/* time */}
        <section className="cx-sec" aria-labelledby="meet-time">
          <div className="cx-sec__head"><h3 id="meet-time" className="cx-sec__title">시간</h3>{time && <span className="cx-sec__value num">{timeLabel(time)}</span>}</div>
          {firstMeet && <p className="cx-hint"><Sun size={15} aria-hidden="true" /> 첫 만남은 밝을 때 만나요. 저녁 7시 이후는 두 번째 나란히부터 열려요.</p>}
          <div className="cx-times" role="radiogroup" aria-labelledby="meet-time" aria-required="true" onKeyDown={radioKeys}>
            {(['am', 'pm'] as const).map((k) => (
              <div key={k} className="cx-tgroup" role="group" aria-label={k === 'am' ? '오전' : '오후'}>
                <span className="cx-tgroup__label" aria-hidden="true">{k === 'am' ? '오전' : '오후'}</span>
                <div className="cx-tgroup__chips">
                  {TIMES[k].map((t) => {
                    const dis = timeDisabled(t)
                    const on = time === t
                    const [h, mm] = t.split(':').map(Number)
                    const firstEnabled = !time && [...TIMES.am, ...TIMES.pm].find((x) => !timeDisabled(x)) === t
                    return (
                      <button key={t} type="button" role="radio" aria-checked={on} disabled={!!dis} tabIndex={on || firstEnabled ? 0 : -1}
                        aria-label={`${timeLabel(t)}${dis === 'night' ? ', 첫 만남에는 선택할 수 없어요' : dis === 'past' ? ', 지난 시간' : ''}`}
                        className={`cx-time-chip ${on ? 'is-on' : ''} ${dis === 'night' ? 'is-night' : ''}`} onClick={() => setTime(t)}>
                        <span className="num">{h % 12 === 0 ? 12 : h % 12}:{pad(mm)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          {isToday && allDisabled && <p className="cx-hint">오늘은 고를 수 있는 시간이 지났어요. 다른 날을 골라 주세요.</p>}
          {tried && date && !time && <p className="cx-err" role="alert">시간을 골라 주세요</p>}
        </section>

        {/* place */}
        <section className="cx-sec" aria-labelledby="meet-place">
          <div className="cx-sec__head"><h3 id="meet-place" className="cx-sec__title">장소</h3><span className="cx-sec__opt">선택</span></div>
          <div className="cx-tiles">
            <button type="button" className={`cx-tile ${mode === 'pick' ? 'is-on' : ''}`} aria-pressed={mode === 'pick'} aria-haspopup="dialog" onClick={() => setPlaceSheet(true)}>
              <MapPinned size={24} className="cx-tile__icon" aria-hidden="true" />
              <span className="cx-tile__label">멍슐랭에서<br />고르기</span>
              <ArrowRight size={20} strokeWidth={2.6} className="cx-tile__arrow" aria-hidden="true" />
            </button>
            <button type="button" className={`cx-tile ${mode === 'custom' ? 'is-on' : ''}`} aria-pressed={mode === 'custom'}
              onClick={() => { setMode('custom'); requestAnimationFrame(() => customRef.current?.focus()) }}>
              <PenLine size={24} className="cx-tile__icon" aria-hidden="true" />
              <span className="cx-tile__label">만날 곳<br />직접 입력</span>
              <ArrowRight size={20} strokeWidth={2.6} className="cx-tile__arrow" aria-hidden="true" />
            </button>
          </div>
          {mode === 'pick' && place && (
            <div className="cx-picked">
              <img src={asset(place.photo)} alt="" />
              <span className="cx-picked__text"><b>{place.name}</b><small>{place.area} · {place.hours}</small>{place.open && <span className="hf-pill hf-pill--calm">첫 나란히 추천</span>}</span>
              <button type="button" className="hf-iconbtn cx-picked__x" aria-label="장소 선택 취소" onClick={() => { setMode(null); setPlaceId(null) }}><X size={18} /></button>
            </div>
          )}
          {mode === 'custom' && (
            <label className="cx-input">
              <span className="cx-input__label">만날 곳</span>
              <input ref={customRef} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="예: 망원역 2번 출구 앞 벤치" maxLength={40} />
            </label>
          )}
          {!mode && <p className="cx-hint cx-hint--plain">장소는 나중에 대화로 정해도 괜찮아요.</p>}
        </section>

        {/* alarm */}
        <section className="cx-sec" aria-label="알림">
          <div className="cx-setrow">
            <span className="cx-setrow__label" id="alarm-label">약속 30분 전 알림 <span className="cx-demo-tag">체험</span></span>
            <button type="button" role="switch" aria-checked={alarm} aria-labelledby="alarm-label" className="cx-switch" onClick={() => setAlarm(!alarm)}><span /></button>
          </div>
          <p className="cx-hint cx-hint--plain">체험 모드에선 실제 알림이 가지 않아요.</p>
        </section>
      </div>

      <div className="hf-bottom-cta cx-plan__cta">
        {date && time ? (
          <p className="cx-plan__summary"><CalendarHeart size={15} aria-hidden="true" /> <span className="num">{dateLabel(date, false)} {timeLabel(time)}</span>{placeValue && <> · {meetPlace(placeValue)?.name}</>}</p>
        ) : (
          <p className="cx-plan__summary is-muted">{accepted ? missing : '요청이 수락되면 보낼 수 있어요'}</p>
        )}
        <button type="button" className="hf-btn hf-btn--primary hf-btn--block" onClick={send} aria-disabled={!ready} data-ready={ready}>
          <MessageCircle size={18} /> {n.owner}님에게 약속 보내기
        </button>
      </div>

      <Sheet open={placeSheet} onClose={() => setPlaceSheet(false)} title="멍슐랭에서 고르기">
        {firstMeet && <p className="cx-hint"><Sun size={15} aria-hidden="true" /> 첫 만남이라 넓고 탁 트인 곳만 보여 드려요.</p>}
        <ul className="cx-places" role="radiogroup" aria-label="장소" onKeyDown={radioKeys}>
          {visiblePlaces.map((p) => {
            const on = mode === 'pick' && placeId === p.id
            return (
              <li key={p.id}>
                <button type="button" role="radio" aria-checked={on} tabIndex={on || (!placeId && p === visiblePlaces[0]) ? 0 : -1} className={`cx-place ${on ? 'is-on' : ''}`}
                  onClick={() => { setPlaceId(p.id); setMode('pick'); setPlaceSheet(false) }}>
                  <img src={asset(p.photo)} alt="" />
                  <span className="cx-place__text"><b>{p.name}</b><small>{p.area} · {p.kind} · {p.hours}</small>
                    {p.open ? <span className="hf-pill hf-pill--calm">첫 나란히 추천</span> : <span className="hf-pill hf-pill--alert">두 번째부터 추천</span>}</span>
                  <span className="cx-place__check" aria-hidden="true">{on && <Check size={16} strokeWidth={3} />}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Sheet>
    </div>
  )
}
