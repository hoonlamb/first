import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { setState, useStore } from '../lib/store'
import { NEIGHBORS } from '../lib/demo'
import { josa } from '../lib/korean'
import { Toast } from './ui'
import { Logo } from '../components/Logo'
import { TabIcon } from '../components/TabIcon'
import { SkipLink } from '../components/SkipLink'
import { AppHome } from './AppHome'
import { CardBuilder } from './CardBuilder'
import { ShowMode } from './ShowMode'
import { WalkScreen } from './WalkScreen'
import { Nearby } from './Nearby'
import { NeighborDetail } from './NeighborDetail'
import { Together } from './Together'
import { BondScreen } from './BondScreen'
import { Settings } from './Settings'
import { TagPrint } from './TagPrint'

function RequireCard({ children }: { children: React.ReactNode }) {
  const card = useStore((s) => s.card)
  if (!card) return <Navigate to="/app" replace state={{ needCard: true }} />
  return <>{children}</>
}

const TABS = [
  { to: '/app', label: '카드', end: true },
  { to: '/app/walk', label: '산책' },
  { to: '/app/together', label: '나란히' },
  { to: '/app/bond', label: '사이' },
]

const DEMO_REPLY_MS = 2500

/** Demo replies: any pending request is accepted ~2.5s after it was sent, wherever the user is. */
function useDemoReplies() {
  const requests = useStore((s) => s.requests)
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    const timers = Object.entries(requests).filter(([, r]) => r.status === 'pending').map(([id, r]) =>
      setTimeout(() => {
        setState((s) => (s.requests[id]?.status === 'pending' ? { ...s, requests: { ...s.requests, [id]: { ...s.requests[id], status: 'accepted' } } } : s))
        const n = NEIGHBORS.find((x) => x.id === id)
        setToast(`${n ? josa(n.name, '이/(없음)') : '이웃'} 보호자가 나란히 산책을 수락했어요 (시연 응답)`)
        setTimeout(() => setToast(null), 3200)
      }, Math.max(0, DEMO_REPLY_MS - (Date.now() - r.at))))
    return () => timers.forEach(clearTimeout)
  }, [requests])
  return toast
}

export function ProductApp() {
  const card = useStore((s) => s.card)
  const replyToast = useDemoReplies()
  const { pathname } = useLocation()
  const immersive = pathname.startsWith('/app/show') || /\/app\/together\/[^/]+\/walk/.test(pathname) || pathname.startsWith('/app/card')
  const showTabs = !!card && !immersive

  if (pathname.startsWith('/app/show')) {
    return <RequireCard><ShowMode /></RequireCard>
  }

  return (
    <div className="product on-paper">
      <SkipLink />
      <div className="product__frame">
        <header className="appbar">
          {immersive
            ? <span className="appbar__home"><Logo tone="ink" size={20} /></span>
            : <Link to="/" className="appbar__home" aria-label="댕큐 소개 사이트로"><Logo tone="ink" size={20} /></Link>}
          <span className="demo-badge" title="입력은 이 브라우저에만 저장되고 이웃·응답은 시연용이에요">체험 모드</span>
          {immersive ? <span className="appbar__settings" aria-hidden="true" /> : <Link to="/app/settings" className="appbar__settings">설정</Link>}
        </header>
        <main id="main" className={`product__main ${showTabs ? 'has-tabs' : ''}`}>
          <Routes>
            <Route index element={<AppHome />} />
            <Route path="card/new" element={<CardBuilder mode="new" />} />
            <Route path="card/edit" element={<RequireCard><CardBuilder mode="edit" /></RequireCard>} />
            <Route path="walk" element={<RequireCard><WalkScreen /></RequireCard>} />
            <Route path="together" element={<RequireCard><Nearby /></RequireCard>} />
            <Route path="together/:id" element={<RequireCard><NeighborDetail /></RequireCard>} />
            <Route path="together/:id/walk" element={<RequireCard><Together /></RequireCard>} />
            <Route path="bond" element={<RequireCard><BondScreen /></RequireCard>} />
            <Route path="tag" element={<RequireCard><TagPrint /></RequireCard>} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </main>
        {showTabs && (
          <nav className="tabbar" aria-label="앱 메뉴">
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className="tabbar__item">
                <TabIcon name={t.label} />
                <span>{t.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
        <Toast message={replyToast} />
      </div>
    </div>
  )
}
