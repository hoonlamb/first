import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GREETING_LABEL, PACE_LABEL, SIZE_LABEL, setState, useStore } from '../lib/store'
import { HOODS, NEIGHBORS, fit } from '../lib/demo'
import { PageHead } from './ui'

type Phase = 'ask' | 'locating' | 'denied' | 'timeout' | 'manual' | 'loading' | 'list'

export function Nearby() {
  const card = useStore((s) => s.card)!
  const location = useStore((s) => s.location)
  const hood = useStore((s) => s.neighborhood)
  const requests = useStore((s) => s.requests)
  const [phase, setPhase] = useState<Phase>(hood ? 'loading' : location === 'denied' ? 'denied' : 'ask')
  const [sameSlot, setSameSlot] = useState(false)
  const [calmOnly, setCalmOnly] = useState(false)

  useEffect(() => {
    if (phase !== 'loading') return
    const t = setTimeout(() => setPhase('list'), 900)
    return () => clearTimeout(t)
  }, [phase])

  const findByLocation = () => {
    setPhase('locating')
    if (!('geolocation' in navigator)) { deny(); return }
    // A dismissed/ignored prompt can stay pending forever: fall back to manual choice.
    const giveUp = setTimeout(() => setPhase((p) => (p === 'locating' ? 'timeout' : p)), 12000)
    // Real permission prompt; the position itself is not stored or sent. The demo neighbourhood is fixed.
    navigator.geolocation.getCurrentPosition(
      () => { clearTimeout(giveUp); setState((s) => ({ ...s, location: 'granted', neighborhood: '망원동' })); setPhase('loading') },
      () => { clearTimeout(giveUp); deny() },
      { timeout: 8000, maximumAge: 600000 },
    )
  }
  const deny = () => { setState((s) => ({ ...s, location: 'denied' })); setPhase('denied') }
  const pickHood = (h: string) => { setState((s) => ({ ...s, location: s.location === 'granted' ? 'granted' : 'manual', neighborhood: h })); setPhase('loading') }

  const results = useMemo(() => {
    if (!hood) return []
    return NEIGHBORS
      .filter((n) => n.hood === hood || (hood === '망원동' && n.hood === '합정동'))
      .map((n) => ({ n, f: fit(card, n) }))
      .filter(({ f }) => (sameSlot ? f.sharedSlots.length > 0 : true))
      .filter(({ n }) => (calmOnly ? n.greeting !== 'hello' : true))
      .sort((a, b) => b.f.score - a.f.score || a.f.start - b.f.start)
  }, [hood, card, sameSlot, calmOnly])

  if (phase === 'ask' || phase === 'locating') {
    return (
      <div className="stack">
        <PageHead kicker="나란히" title="같은 동네에서 먼저 찾아볼게요.">
          <p>가까운 곳의 산책 카드만 보여 드려요. 정확한 위치는 다른 사람에게 보이지 않아요.</p>
        </PageHead>
        <button className="btn btn-ink btn-block" onClick={findByLocation} disabled={phase === 'locating'} aria-busy={phase === 'locating'}>
          {phase === 'locating' ? '위치 확인 중…' : '현재 위치로 찾기'}
        </button>
        <button className="btn btn-ghost btn-block" onClick={() => setPhase('manual')}>동네 직접 고르기</button>
        <p className="fineprint">체험 모드: 위치를 허용해도 좌표는 저장하지 않고, 시연용 동네(망원동)로 보여 드려요.</p>
      </div>
    )
  }

  if (phase === 'denied' || phase === 'manual' || phase === 'timeout') {
    return (
      <div className="stack">
        <PageHead kicker="나란히" title={phase === 'denied' ? '위치 없이도 찾을 수 있어요.' : phase === 'timeout' ? '위치를 확인하지 못했어요.' : '어느 동네에서 걷나요?'}>
          {phase === 'denied' && <p>위치 권한이 꺼져 있어요. 주로 산책하는 동네를 골라 주세요. 권한은 브라우저 설정에서 언제든 바꿀 수 있어요.</p>}
          {phase === 'timeout' && <p>응답이 오지 않았어요. 주로 산책하는 동네를 골라 주세요.</p>}
        </PageHead>
        <div className="hoods" role="list">
          {HOODS.map((h) => <button key={h} role="listitem" className="hood" onClick={() => pickHood(h)}>{h}</button>)}
        </div>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div className="stack" aria-busy="true">
        <PageHead kicker={hood ?? ''} title="산책 카드를 찾는 중…" />
        <p className="sr-only" role="status">근처 산책 카드를 불러오고 있어요.</p>
        {[0, 1, 2].map((i) => <div key={i} className="skeleton" aria-hidden="true" />)}
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHead kicker={`${hood} · 체험 데이터`} title={`${card.name}와 나란히 걸을 이웃`}>
        <p>외모가 아니라 걷는 속도, 인사 방식, 거리로 맞춰요. 첫 만남은 언제나 멀리서, 인사 없이 시작해요.</p>
      </PageHead>
      <div className="filters" role="group" aria-label="걸러 보기">
        <label className="choice"><input type="checkbox" checked={sameSlot} onChange={(e) => setSameSlot(e.target.checked)} /><span>산책 시간 겹침</span></label>
        <label className="choice"><input type="checkbox" checked={calmOnly} onChange={(e) => setCalmOnly(e.target.checked)} /><span>차분한 인사</span></label>
        <button className="btn-quiet" onClick={() => setPhase('manual')}>동네 바꾸기</button>
      </div>
      <p className="sr-only" role="status">{results.length}마리의 이웃이 있어요.</p>
      {results.length === 0 ? (
        <div className="emptybox">
          <p><b>조건에 맞는 이웃이 없어요.</b></p>
          <p>{hood}에는 아직 산책 카드가 많지 않아요. 조건을 풀거나 옆 동네를 골라 보세요.</p>
          <button className="btn btn-ghost" onClick={() => { setSameSlot(false); setCalmOnly(false) }}>조건 풀기</button>
        </div>
      ) : (
        <ul className="nlist">
          {results.map(({ n, f }) => {
            const r = requests[n.id]
            return (
              <li key={n.id}>
                <Link to={`/app/together/${n.id}`} className="ncard">
                  <span className="ncard__head">
                    <b className="ncard__name">{n.name}</b>
                    <span className="ncard__meta">{SIZE_LABEL[n.size]} · {PACE_LABEL[n.pace]} · {GREETING_LABEL[n.greeting]}</span>
                  </span>
                  <span className="ncard__dist"><span className="num">{f.start}m</span><small>에서 시작</small></span>
                  <span className="ncard__why">{f.reasons.slice(0, 2).join(' · ') || '조건을 확인해 보세요'}</span>
                  {r && <span className={`tag tag--${r.status}`}>{r.status === 'pending' ? '요청 보냄' : '수락됨'}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
