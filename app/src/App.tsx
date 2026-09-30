import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Home } from './site/Home'
import { ProductApp } from './product/ProductApp'

const Brand = lazy(() => import('./site/Brand'))
const CaseStudy = lazy(() => import('./site/CaseStudy'))

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export function App() {
  return (
    <HashRouter>
      <ScrollTop />
      <Suspense fallback={<div className="pageload" role="status">불러오는 중…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/brand" element={<Brand />} />
          <Route path="/case" element={<CaseStudy />} />
          <Route path="/app/*" element={<ProductApp />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
