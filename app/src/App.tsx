import { lazy, Suspense, useEffect, useRef } from 'react'
import { focusMainHeading, titleFor } from './lib/a11y'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Home } from './site/Home'
import { HfApp } from './hifi/HfApp'

const Brand = lazy(() => import('./site/Brand'))
const CaseStudy = lazy(() => import('./site/CaseStudy'))

/** On route change: scroll top, per-route document title, and move focus to the new screen's heading. */
function RouteEffects() {
  const { pathname } = useLocation()
  const prev = useRef<string | null>(null)
  useEffect(() => {
    document.title = titleFor(pathname)
    const from = prev.current
    prev.current = pathname
    if (from === null || from === pathname) return // first load (and StrictMode re-run): leave focus alone
    window.scrollTo(0, 0)
    if (from.startsWith('/app/show') && pathname === '/app') focusMainHeading('.home__show')
    else if (!pathname.startsWith('/app/show')) focusMainHeading()
  }, [pathname])
  return null
}

export function App() {
  return (
    <HashRouter>
      <RouteEffects />
      <Suspense fallback={<div className="pageload" role="status">불러오는 중…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/brand" element={<Brand />} />
          <Route path="/case" element={<CaseStudy />} />
          <Route path="/app/*" element={<HfApp />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
