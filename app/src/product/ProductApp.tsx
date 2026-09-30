import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'
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

export function ProductApp() {
  const card = useStore((s) => s.card)
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
          <Link to="/" className="appbar__home" aria-label="댕큐 소개 사이트로"><Logo tone="ink" size={20} /></Link>
          <span className="demo-badge" title="입력은 이 브라우저에만 저장되고 이웃·응답은 시연용이에요">체험 모드</span>
          <Link to="/app/settings" className="appbar__settings">설정</Link>
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
      </div>
    </div>
  )
}
