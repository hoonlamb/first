import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from '../components/Logo'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="siteheader">
      <a className="skip" href="#main">본문 바로가기</a>
      <div className="wrap siteheader__bar">
        <Link to="/" className="siteheader__logo" aria-label="댕큐 홈"><Logo tone="paper" size={26} /></Link>
        <button className="siteheader__menu" aria-expanded={open} aria-controls="sitenav" onClick={() => setOpen((v) => !v)}>
          {open ? '닫기' : '메뉴'}
        </button>
        <nav id="sitenav" className={`siteheader__nav ${open ? 'is-open' : ''}`} aria-label="주요 메뉴">
          <NavLink to="/" end onClick={() => setOpen(false)}>서비스</NavLink>
          <NavLink to="/brand" onClick={() => setOpen(false)}>브랜드 가이드</NavLink>
          <NavLink to="/case" onClick={() => setOpen(false)}>케이스 스터디</NavLink>
          <Link to="/app" className="btn btn-signal siteheader__cta" onClick={() => setOpen(false)}>체험하기</Link>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="sitefooter">
      <div className="wrap sitefooter__grid">
        <Logo tone="paper" size={40} />
        <p className="sitefooter__vision">동네의 모든 개가 서로의 거리를 존중하는 산책. 댕큐가 그리는 반려생활이에요.</p>
        <nav aria-label="바닥글" className="sitefooter__nav">
          <Link to="/app">체험하기</Link>
          <Link to="/brand">브랜드 가이드</Link>
          <Link to="/case">케이스 스터디</Link>
        </nav>
        <p className="sitefooter__legal">포트폴리오 프로젝트입니다. 실제 서비스·제휴·결제는 운영하지 않아요. © 2026 댕큐 리프로젝트</p>
      </div>
    </footer>
  )
}
