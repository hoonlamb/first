import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'
import { Logo } from '../components/Logo'
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
      <a className="skip" href="#main">본문 바로가기</a>
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

/** Tab icons drawn from the same two-line vocabulary. */
function TabIcon({ name }: { name: string }) {
  const common = { width: 26, height: 20, viewBox: '0 0 26 20', 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const }
  if (name === '카드') return <svg {...common}><rect x="3" y="2" width="20" height="16" rx="4" /><line x1="7" y1="8" x2="14" y2="8" /><line x1="7" y1="13" x2="19" y2="13" /></svg>
  if (name === '산책') return <svg {...common}><line x1="2" y1="14" x2="18" y2="14" /><circle cx="22" cy="14" r="2" fill="currentColor" /><line x1="6" y1="6" x2="12" y2="6" strokeDasharray="1 4" /></svg>
  if (name === '나란히') return <svg {...common}><line x1="2" y1="6" x2="17" y2="6" /><line x1="7" y1="14" x2="17" y2="14" /><circle cx="22" cy="6" r="2" fill="currentColor" /><circle cx="22" cy="14" r="2" fill="currentColor" /></svg>
  return <svg {...common}><line x1="3" y1="4" x2="23" y2="4" /><line x1="3" y1="10" x2="16" y2="10" /><line x1="3" y1="16" x2="10" y2="16" /></svg>
}
