import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  Bookmark, ChevronLeft, ChevronRight, Clock3, Dog, Droplets, Info, MapPin, Navigation, Search, Share, ShoppingBag,
  SquareParking, Trees, TriangleAlert, Sparkles, X, CircleCheck, Footprints,
} from 'lucide-react'
import { PLACES, type Place } from '../../lib/places'
import { awardBadge, type BadgeDef } from '../../lib/badges'
import { setState, useStore } from '../../lib/store'
import { NEIGHBORS } from '../../lib/demo'
import { josa } from '../../lib/korean'
import { RootHeader, Sheet, Toast } from '../ui/kit'
import { asset } from '../ui/asset'
import './places.css'

type Kind = Place['kind']
const CATEGORIES: { kind: Kind | 'all'; emoji: string; label: string }[] = [
  { kind: 'all', emoji: '🐾', label: '전체' },
  { kind: '공원/산책로', emoji: '🌳', label: '공원·산책' },
  { kind: '카페', emoji: '☕', label: '카페' },
  { kind: '여행지', emoji: '🧳', label: '여행지' },
  { kind: '이색공간', emoji: '✨', label: '이색공간' },
]

const AMENITIES: { key: Place['amenities'][number]; label: string; icon: typeof Dog }[] = [
  { key: '대형견', label: '대형견', icon: Dog },
  { key: '주차', label: '주차', icon: SquareParking },
  { key: '물그릇', label: '물그릇', icon: Droplets },
  { key: '배변봉투', label: '배변봉투', icon: ShoppingBag },
  { key: '그늘', label: '그늘', icon: Trees },
]

/* ---------- shared bits (local to this file) ---------- */

/** Toast rendered into the phone screen (not the scroll area), auto-hides. */
function useToast(): [ReactNode, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const show = (m: string) => {
    clearTimeout(timer.current)
    setMsg(m)
    timer.current = setTimeout(() => setMsg(null), 2600)
  }
  const host = typeof document !== 'undefined' ? document.querySelector('.hf-screen') : null
  const node = <Toast message={msg} />
  return [host ? createPortal(node, host) : node, show]
}

/** Toggle a saved place. Returns the badge when this was the very first save. */
function toggleSaved(id: string, saved: string[]): { nowSaved: boolean; badge: BadgeDef | null } {
  const nowSaved = !saved.includes(id)
  setState((s) => ({ ...s, saved: nowSaved ? [...s.saved, id] : s.saved.filter((x) => x !== id) }))
  return { nowSaved, badge: nowSaved ? awardBadge('place') : null }
}

function BadgeEarned({ badge, onClose }: { badge: BadgeDef | null; onClose: () => void }) {
  const nav = useNavigate()
  return (
    <Sheet open={!!badge} onClose={onClose} title="새 배지를 받았어요" center>
      {badge && (
        <div className="pl-earned">
          <div className="pl-earned__medal" aria-hidden="true"><span>{badge.emoji}</span></div>
          <div className="pl-earned__tags"><span className="pl-tag pl-tag--place">장소</span><span className="pl-tag pl-tag--first">첫 저장</span></div>
          <p className="pl-earned__name">‘{badge.title}’</p>
          <p className="hf-sub">장소를 처음 저장했어요.<br />저장한 곳은 멍슐랭 ‘저장소’에서 다시 볼 수 있어요.</p>
          <div className="pl-earned__actions">
            <button className="hf-btn hf-btn--primary hf-btn--block" onClick={() => { onClose(); nav('/app/badges') }}>인증소에서 보기</button>
            <button className="hf-btn hf-btn--line hf-btn--block hf-btn--sm" onClick={onClose}>계속 둘러보기</button>
          </div>
        </div>
      )}
    </Sheet>
  )
}

function PlaceCard({ p, saved, onToggle }: { p: Place; saved: boolean; onToggle: () => void }) {
  return (
    <li className="pl-card">
      <Link to={`/app/places/${p.id}`} className="pl-card__link">
        <img src={asset(p.photo)} alt="" loading="lazy" />
        {p.open && <span className="pl-card__flag"><Sparkles size={11} strokeWidth={2.4} aria-hidden="true" />첫 만남 추천</span>}
        <span className="pl-card__over">
          <span className="pl-card__name">{p.name}</span>
          <span className="pl-card__area"><MapPin size={12} strokeWidth={2.2} aria-hidden="true" />{p.area}</span>
        </span>
      </Link>
      <button className={`pl-save ${saved ? 'is-on' : ''}`} aria-pressed={saved} aria-label={`${p.name} 저장`} onClick={onToggle}>
        <Bookmark size={16} strokeWidth={2.2} fill={saved ? 'currentColor' : 'none'} />
      </button>
    </li>
  )
}

/* ---------- 멍슐랭 (tab root) ---------- */

export function PlacesScreen() {
  const saved = useStore((s) => s.saved)
  const [tab, setTab] = useState<'curation' | 'saved'>('curation')
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [firstOnly, setFirstOnly] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const [badge, setBadge] = useState<BadgeDef | null>(null)
  const [toast, showToast] = useToast()
  const searchRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => { if (searchOpen) searchRef.current?.focus() }, [searchOpen])

  const query = q.trim()
  const matches = (p: Place) => !query || p.name.includes(query) || p.area.includes(query)
  const curated = PLACES.filter((p) => matches(p) && (kind === 'all' || p.kind === kind) && (!firstOnly || p.open))
  const savedPlaces = PLACES.filter((p) => saved.includes(p.id) && matches(p))

  const onToggle = (p: Place) => {
    const { nowSaved, badge: b } = toggleSaved(p.id, saved)
    if (b) setBadge(b)
    else showToast(nowSaved ? `${p.name}, 저장했어요` : '저장을 취소했어요')
  }

  const showFirstPicks = () => {
    setKind('all')
    setFirstOnly(true)
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const kindLabel = CATEGORIES.find((c) => c.kind === kind)?.label

  return (
    <div className="hf-fade-in">
      <RootHeader>
        <button className={`hf-iconbtn ${searchOpen ? 'pl-search-on' : ''}`} aria-label="장소 검색" aria-expanded={searchOpen} aria-controls="pl-search"
          onClick={() => { if (searchOpen) setQ(''); setSearchOpen(!searchOpen) }}>
          {searchOpen ? <X size={24} strokeWidth={1.9} /> : <Search size={24} strokeWidth={1.9} />}
        </button>
      </RootHeader>

      <div className="hf-page pl-page">
        <h1 className="sr-only">멍슐랭</h1>

        {searchOpen && (
          <div className="pl-search" id="pl-search" role="search">
            <Search size={18} strokeWidth={2} aria-hidden="true" />
            <input ref={searchRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="장소 이름이나 동네로 찾기" aria-label="장소 이름이나 동네로 찾기" enterKeyHint="search" />
            {q && <button className="pl-search__clear" onClick={() => { setQ(''); searchRef.current?.focus() }} aria-label="검색어 지우기"><X size={14} strokeWidth={2.6} /></button>}
          </div>
        )}

        <div className="pl-seg" role="tablist" aria-label="멍슐랭 보기">
          <button role="tab" id="tab-curation" aria-selected={tab === 'curation'} aria-controls="panel-curation" className="pl-seg__tab" onClick={() => setTab('curation')}>큐레이션</button>
          <button role="tab" id="tab-saved" aria-selected={tab === 'saved'} aria-controls="panel-saved" className="pl-seg__tab" onClick={() => setTab('saved')}>
            저장소{saved.length > 0 && <span className="pl-seg__count num">{saved.length}</span>}
          </button>
        </div>

        {tab === 'curation' ? (
          <div className="pl-panel" role="tabpanel" id="panel-curation" aria-labelledby="tab-curation">
            {!query && (
              <button className="pl-hero" onClick={showFirstPicks} aria-label="첫 나란히 하기 좋은 곳 보기. 탁 트인 곳에서 멀리 걷기부터">
                <img src={asset('photos/place-02-beach-dog.jpg')} alt="" />
                <span className="pl-hero__tag">멍슐랭 Pick</span>
                <span className="pl-hero__text">
                  <span className="pl-hero__title">첫 나란히<br />하기 좋은 곳</span>
                  <span className="pl-hero__sub">탁 트인 곳에서 멀리 걷기부터</span>
                </span>
                <span className="pl-hero__go" aria-hidden="true"><ChevronRight size={18} strokeWidth={2.4} /></span>
                <span className="pl-hero__dots" aria-hidden="true"><i className="is-on" /><i /><i /></span>
              </button>
            )}

            <div className="pl-cats" role="group" aria-label="장소 종류">
              {CATEGORIES.map((c) => (
                <button key={c.kind} className="pl-cat" aria-pressed={kind === c.kind} onClick={() => setKind(c.kind)}>
                  <span className="pl-cat__tile" aria-hidden="true">{c.emoji}</span>
                  <span className="pl-cat__label">{c.label}</span>
                </button>
              ))}
            </div>

            <section className="pl-grid-sec" aria-labelledby="pl-grid-title">
              <div className="pl-grid-head">
                <div>
                  <h2 id="pl-grid-title" ref={gridRef} className="hf-h2">{query ? `‘${query}’ 검색 결과` : kind === 'all' ? '반려견과 함께 가는 곳' : kindLabel}</h2>
                  <p className="hf-sub"><span className="num">{curated.length}</span>곳 · 저장해 두고 약속 장소로 골라 보세요</p>
                </div>
              </div>
              <button className="pl-toggle" aria-pressed={firstOnly} onClick={() => setFirstOnly(!firstOnly)}>
                <span className="pl-toggle__box" aria-hidden="true">{firstOnly && <CircleCheck size={18} strokeWidth={2.4} />}</span>
                첫 만남에 좋은 곳만
                <span className="pl-toggle__hint">넓고 탁 트인 곳</span>
              </button>

              {curated.length ? (
                <ul className="pl-grid">
                  {curated.map((p) => <PlaceCard key={p.id} p={p} saved={saved.includes(p.id)} onToggle={() => onToggle(p)} />)}
                </ul>
              ) : (
                <div className="pl-none">
                  <p className="hf-body">조건에 맞는 곳이 없어요.</p>
                  <button className="hf-link" onClick={() => { setKind('all'); setFirstOnly(false); setQ('') }}>조건 모두 풀기</button>
                </div>
              )}
            </section>

            <p className="pl-demo"><Info size={13} strokeWidth={2.2} aria-hidden="true" />시연용 장소 정보예요. 실제 운영 정보와 다를 수 있어요.</p>
          </div>
        ) : (
          <div className="pl-panel" role="tabpanel" id="panel-saved" aria-labelledby="tab-saved">
            {savedPlaces.length ? (
              <section className="pl-grid-sec" aria-labelledby="pl-saved-title">
                <div>
                  <h2 id="pl-saved-title" className="hf-h2">저장한 장소</h2>
                  <p className="hf-sub"><span className="num">{savedPlaces.length}</span>곳 · 나란히 약속 장소로 바로 쓸 수 있어요</p>
                </div>
                <ul className="pl-grid">
                  {savedPlaces.map((p) => <PlaceCard key={p.id} p={p} saved onToggle={() => onToggle(p)} />)}
                </ul>
              </section>
            ) : (
              <div className="hf-empty pl-empty">
                <img src={asset('photos/mascot.png')} alt="" />
                <h2 className="hf-h2">{query ? '검색한 저장 장소가 없어요' : '아직 저장한 장소가 없어요'}</h2>
                <p className="hf-sub">마음에 드는 곳의 북마크를 누르면<br />여기에 모아 둘게요.</p>
                <button className="hf-btn hf-btn--soft hf-btn--sm" onClick={() => setTab('curation')}>큐레이션 둘러보기</button>
              </div>
            )}
          </div>
        )}
      </div>

      <BadgeEarned badge={badge} onClose={() => setBadge(null)} />
      {toast}
    </div>
  )
}

/* ---------- 장소 상세 ---------- */

/** Why a place is not for a first meeting, taken from its intro text. */
function cautionFrom(intro: string) {
  const sentences = intro.split('.').map((s) => s.trim()).filter(Boolean)
  const hit = sentences.find((s) => /권하지|붐빌|사람이 많/.test(s))
  if (hit) {
    const cut = hit.replace(/\s*첫 만남 장소로는 권하지 않아요$/, '')
    return cut !== hit ? `${cut} 서로 거리를 넉넉히 두기 어려워요.` : `${hit}.`
  }
  if (intro.includes('실내')) return '실내 공간이라 서로 거리를 넉넉히 두기 어려워요.'
  return '공간이 넓지 않아 서로 거리를 넉넉히 두기 어려울 수 있어요.'
}

export function PlaceDetail() {
  const { id } = useParams()
  const place = PLACES.find((p) => p.id === id)
  if (!place) return <Navigate to="/app/places" replace />
  return <PlaceDetailInner key={place.id} place={place} />
}

function PlaceDetailInner({ place: p }: { place: Place }) {
  const nav = useNavigate()
  const saved = useStore((s) => s.saved)
  const requests = useStore((s) => s.requests)
  const hidden = useStore((s) => s.hidden)
  const [badge, setBadge] = useState<BadgeDef | null>(null)
  const [pick, setPick] = useState(false)
  const [toast, showToast] = useToast()
  const isSaved = saved.includes(p.id)
  const accepted = NEIGHBORS.filter((n) => requests[n.id]?.status === 'accepted' && !hidden.includes(n.id))
  const caution = cautionFrom(p.intro)

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) nav(-1)
    else nav('/app/places')
  }
  const onSave = () => {
    const { nowSaved, badge: b } = toggleSaved(p.id, saved)
    if (b) setBadge(b)
    else showToast(nowSaved ? '저장소에 담았어요' : '저장을 취소했어요')
  }
  const onShare = async () => {
    const url = `${location.origin}${location.pathname}#/app/places/${p.id}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('링크를 복사했어요')
    } catch {
      showToast('링크를 복사하지 못했어요. 주소창에서 복사해 주세요')
    }
  }
  const onRoute = () => showToast('체험 모드에서는 지도를 열지 않아요')

  return (
    <div className="pd hf-fade-in">
      <div className="pd-hero">
        <img src={asset(p.photo)} alt={`${p.name} 사진`} />
        <div className="pd-hero__bar">
          <button className="pd-glass" onClick={goBack} aria-label="뒤로"><ChevronLeft size={24} strokeWidth={2.2} /></button>
          <button className="pd-glass" onClick={onShare} aria-label="링크 공유"><Share size={20} strokeWidth={2.2} /></button>
        </div>
        <span className="pd-hero__count num" aria-hidden="true">1 / 1</span>
      </div>

      <article className="pd-sheet">
        <header className="pd-head">
          <span className="hf-pill hf-pill--pink">{p.kind}</span>
          <h1 className="pd-title">{p.name}</h1>
          <p className="pd-addr"><MapPin size={14} strokeWidth={2.2} aria-hidden="true" />{p.address}</p>
        </header>

        <div className="pd-actions">
          <button className={`pd-act ${isSaved ? 'is-on' : ''}`} aria-pressed={isSaved} onClick={onSave}>
            <Bookmark size={16} strokeWidth={2.3} fill={isSaved ? 'currentColor' : 'none'} />{isSaved ? '저장됨' : '저장'}
          </button>
          <button className="pd-act" onClick={onRoute}><Navigation size={16} strokeWidth={2.3} />길찾기</button>
          <button className="pd-act" onClick={onShare}><Share size={16} strokeWidth={2.3} />공유</button>
        </div>

        {p.open ? (
          <div className="pd-callout pd-callout--good">
            <span className="pd-callout__icon" aria-hidden="true"><Footprints size={20} strokeWidth={2.2} /></span>
            <p><b>첫 나란히에 좋아요</b>넓고 탁 트여 멀리서 같은 방향으로 걷기 좋아요.</p>
          </div>
        ) : (
          <div className="pd-callout pd-callout--warn">
            <span className="pd-callout__icon" aria-hidden="true"><TriangleAlert size={20} strokeWidth={2.2} /></span>
            <p><b>첫 만남 장소로는 권하지 않아요</b>{caution}</p>
          </div>
        )}

        <section className="pd-sec" aria-labelledby="pd-amen">
          <h2 id="pd-amen" className="pd-sec__title">편의 시설</h2>
          <ul className="pd-amen">
            {AMENITIES.map(({ key, label, icon: Icon }) => {
              const has = p.amenities.includes(key)
              return (
                <li key={key} className={`pd-amen__item ${has ? '' : 'is-off'}`}>
                  <span className="pd-amen__icon" aria-hidden="true"><Icon size={22} strokeWidth={1.9} /></span>
                  <span className="pd-amen__label">{label}<span className="sr-only">{has ? ' 있음' : ' 없음'}</span></span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="pd-sec" aria-labelledby="pd-info">
          <h2 id="pd-info" className="pd-sec__title">장소 정보</h2>
          <dl className="pd-info">
            <div className="pd-info__row"><dt><Clock3 size={18} strokeWidth={2} aria-hidden="true" />운영 시간</dt><dd className="num">{p.hours}</dd></div>
            <div className="pd-info__row"><dt><MapPin size={18} strokeWidth={2} aria-hidden="true" />주소</dt><dd>{p.address}</dd></div>
            <div className="pd-info__row"><dt><Trees size={18} strokeWidth={2} aria-hidden="true" />지역</dt><dd>{p.area}</dd></div>
          </dl>
        </section>

        <section className="pd-sec" aria-labelledby="pd-intro">
          <h2 id="pd-intro" className="pd-sec__title">소개</h2>
          <p className="hf-body">{p.intro}</p>
        </section>

        <p className="pl-demo"><Info size={13} strokeWidth={2.2} aria-hidden="true" />시연용 장소 정보예요. 실제 운영 정보와 다를 수 있어요.</p>
      </article>

      <div className="hf-bottom-cta pd-cta">
        <button className="hf-btn hf-btn--primary hf-btn--block" onClick={() => setPick(true)}>
          <Footprints size={18} strokeWidth={2.2} />이 장소로 나란히 약속 잡기
        </button>
      </div>

      <Sheet open={pick} onClose={() => setPick(false)} title={accepted.length ? '누구와 걸을까요?' : '아직 약속할 이웃이 없어요'}>
        {accepted.length ? (
          <>
            <p className="hf-sub">나란히 요청을 수락한 이웃이에요. {josa(p.name, '을/를')} 약속 장소로 넣어 둘게요.</p>
            <ul className="pd-pick">
              {accepted.map((n) => (
                <li key={n.id}>
                  <button className="pd-pick__row" onClick={() => { setPick(false); nav(`/app/chat/${n.id}/meet?place=${p.id}`) }}>
                    <span className="hf-avatar"><img src={asset(n.photo)} alt="" /></span>
                    <span className="pd-pick__txt"><b>{n.name}</b><small>{n.owner} · {n.breed} · {n.hood}</small></span>
                    <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="pd-nobody">
              <img src={asset('photos/mascot.png')} alt="" />
              <p className="hf-body">먼저 나란히 탭에서 이웃에게 요청해 주세요. 이웃이 수락하면 이 장소로 약속을 잡을 수 있어요.</p>
            </div>
            <button className="hf-btn hf-btn--primary hf-btn--block" onClick={() => { setPick(false); nav('/app/together') }}>나란히 이웃 보러 가기</button>
            <button className="hf-btn hf-btn--line hf-btn--block hf-btn--sm" onClick={() => setPick(false)}>닫기</button>
          </>
        )}
      </Sheet>

      <BadgeEarned badge={badge} onClose={() => setBadge(null)} />
      {toast}
    </div>
  )
}
