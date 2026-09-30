import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { Home as HomeIcon, Compass, Footprints, Award, User, Wifi, BatteryFull, SignalHigh } from 'lucide-react'
import { setState, useStore } from '../lib/store'
import { NEIGHBORS } from '../lib/demo'
import { josa } from '../lib/korean'
import { Toast } from './ui/kit'
import './hifi.css'
import { HomeScreen } from './screens/Home'
import { Onboarding } from './screens/Onboarding'
import { PlacesScreen, PlaceDetail } from './screens/Places'
import { TogetherList, NeighborProfile } from './screens/Together'
import { ChatList, ChatThread, MeetPlanner } from './screens/Chat'
import { TogetherWalk } from './screens/TogetherWalk'
import { BadgesScreen } from './screens/Badges'
import { MeScreen, ShowCard, TagScreen, SettingsScreen } from './screens/Me'
import { WalkLog } from './screens/WalkLog'

function RequireCard({ children }: { children: ReactNode }) {
  const card = useStore((s) => s.card)
  if (!card) return <Navigate to="/app/start" replace />
  return <>{children}</>
}

const TABS = [
  { to: '/app', label: '홈', icon: HomeIcon, end: true },
  { to: '/app/places', label: '멍슐랭', icon: Compass },
  { to: '/app/together', label: '나란히', icon: Footprints },
  { to: '/app/badges', label: '인증소', icon: Award },
  { to: '/app/me', label: '마이', icon: User },
]

const DEMO_REPLY_MS = 2500

/** Demo replies: pending 나란히 requests get accepted, and the neighbour answers in chat. */
function useDemoReplies() {
  const requests = useStore((s) => s.requests)
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    const timers = Object.entries(requests).filter(([, r]) => r.status === 'pending').map(([id, r]) =>
      setTimeout(() => {
        const n = NEIGHBORS.find((x) => x.id === id)
        setState((s) => {
          if (s.requests[id]?.status !== 'pending') return s
          const thread = s.threads[id] ?? []
          return {
            ...s,
            requests: { ...s.requests, [id]: { ...s.requests[id], status: 'accepted' } },
            threads: { ...s.threads, [id]: [...thread, { id: `r${Date.now()}`, from: 'them', at: Date.now(), text: `좋아요! ${n ? josa(n.name, '이/(없음)') + '도' : ''} 첫날은 멀리서 걷는 게 편할 거예요. 약속 잡아 볼까요?` }] },
          }
        })
        setToast(`${n ? n.owner : '이웃'} 님이 나란히 요청을 수락했어요`)
        setTimeout(() => setToast(null), 3000)
      }, Math.max(0, DEMO_REPLY_MS - (Date.now() - r.at))))
    return () => timers.forEach(clearTimeout)
  }, [requests])
  return toast
}

function StatusBar() {
  const { pathname } = useLocation()
  const overlay = /\/app\/(together\/[^/]+$|places\/[^/]+$)/.test(pathname)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t) }, [])
  return (
    <div className={`hf-status ${overlay ? 'is-overlay hf-status--light' : ''}`} aria-hidden="true">
      <span className="num">{now.getHours()}:{String(now.getMinutes()).padStart(2, '0')}</span>
      <span className="hf-status__icons"><SignalHigh size={17} strokeWidth={2.6} /><Wifi size={17} strokeWidth={2.6} /><BatteryFull size={22} strokeWidth={2} /></span>
    </div>
  )
}

function KeyedProfile() { const { id } = useParams(); return <NeighborProfile key={id} /> }

export function HfApp() {
  const { pathname } = useLocation()
  const card = useStore((s) => s.card)
  const threads = useStore((s) => s.threads)
  const toast = useDemoReplies()
  const scrollRef = useRef<HTMLDivElement>(null)
  const unread = Object.values(threads).filter((t) => t.length && t[t.length - 1].from === 'them').length
  const tabRoots = ['/app', '/app/places', '/app/together', '/app/badges', '/app/me']
  const showTabs = !!card && tabRoots.includes(pathname.replace(/\/$/, '') || '/app')

  useEffect(() => { scrollRef.current?.scrollTo(0, 0) }, [pathname])

  return (
    <div className="hf hf-stage">
      <div className="hf-phone">
        <div className="hf-screen">
          <div className="hf-notch" aria-hidden="true" />
          <StatusBar />
          <div className="hf-scroll" ref={scrollRef} id="hf-scroll">
            <main id="main">
              <Routes>
                <Route index element={card ? <HomeScreen /> : <Navigate to="/app/start" replace />} />
                <Route path="start/*" element={<Onboarding />} />
                <Route path="card/edit" element={<RequireCard><Onboarding edit /></RequireCard>} />
                <Route path="places" element={<RequireCard><PlacesScreen /></RequireCard>} />
                <Route path="places/:id" element={<RequireCard><PlaceDetail /></RequireCard>} />
                <Route path="together" element={<RequireCard><TogetherList /></RequireCard>} />
                <Route path="together/:id" element={<RequireCard><KeyedProfile /></RequireCard>} />
                <Route path="together/:id/walk" element={<RequireCard><TogetherWalk /></RequireCard>} />
                <Route path="chat" element={<RequireCard><ChatList /></RequireCard>} />
                <Route path="chat/:id" element={<RequireCard><ChatThread /></RequireCard>} />
                <Route path="chat/:id/meet" element={<RequireCard><MeetPlanner /></RequireCard>} />
                <Route path="badges" element={<RequireCard><BadgesScreen /></RequireCard>} />
                <Route path="me" element={<RequireCard><MeScreen /></RequireCard>} />
                <Route path="show" element={<RequireCard><ShowCard /></RequireCard>} />
                <Route path="tag" element={<RequireCard><TagScreen /></RequireCard>} />
                <Route path="walk" element={<RequireCard><WalkLog /></RequireCard>} />
                <Route path="settings" element={<SettingsScreen />} />
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </main>
          </div>
          {showTabs && (
            <nav className="hf-tabbar" aria-label="앱 메뉴">
              {TABS.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className="hf-tab">
                  {({ isActive }) => (<>
                    <Icon size={26} strokeWidth={isActive ? 2.4 : 1.8} fill={isActive && label === '홈' ? 'currentColor' : 'none'} />
                    <span>{label}</span>
                    {label === '나란히' && unread > 0 && <span className="hf-tab__badge num">{unread}</span>}
                  </>)}
                </NavLink>
              ))}
            </nav>
          )}
          <Toast message={toast} />
        </div>
      </div>
      <p className="hf-stage__meta">댕큐 하이파이 프로토타입 · 체험 모드 <Link to="/">소개 사이트</Link> <Link to="/case">케이스 스터디</Link></p>
    </div>
  )
}
