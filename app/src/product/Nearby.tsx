import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GREETING_LABEL, PACE_LABEL, SIZE_LABEL, setState, useStore } from '../lib/store'
import { HOODS, NEIGHBORS, fit, planFor } from '../lib/demo'
import { josa } from '../lib/korean'
import { PageHead } from './ui'

type Phase = 'ask' | 'locating' | 'denied' | 'unavailable' | 'manual' | 'loading' | 'list'

export function Nearby() {
  const card = useStore((s) => s.card)!
  const location = useStore((s) => s.location)
  const hood = useStore((s) => s.neighborhood)
  const requests = useStore((s) => s.requests)
  const bonds = useStore((s) => s.bonds)
  const hidden = useStore((s) => s.hidden)
  const [phase, setPhase] = useState<Phase>(hood ? 'loading' : location === 'denied' ? 'denied' : 'ask')
  const [slow, setSlow] = useState(false)
  const [sameSlot, setSameSlot] = useState(false)
  const [calmOnly, setCalmOnly] = useState(false)

  useEffect(() => {
    if (phase !== 'loading') return
    const t = setTimeout(() => setPhase('list'), 900)
    return () => clearTimeout(t)
  }, [phase])

  const findByLocation = () => {
    setPhase('locating'); setSlow(false)
    if (!('geolocation' in navigator)) { setPhase('unavailable'); return }
    // An ignored prompt can stay pending forever: offer the manual choice early, give up later.
    const hint = setTimeout(() => setSlow(true), 4000)
    const giveUp = setTimeout(() => setPhase((p) => (p === 'locating' ? 'unavailable' : p)), 15000)
    const clear = () => { clearTimeout(hint); clearTimeout(giveUp) }
    // Real permission prompt; the position itself is not stored or sent. The demo neighbourhood is fixed.
    navigator.geolocation.getCurrentPosition(
      () => { clear(); setState((s) => ({ ...s, location: 'granted', neighborhood: '망원동' })); setPhase('loading') },
      (err) => {
        clear()
        if (err.code === 1) { setState((s) => ({ ...s, location: 'denied' })); setPhase('denied') }
        else setPhase('unavailable')
      },
      { timeout: 10000, maximumAge: 600000 },
    )
  }
  const pickHood = (h: string) => { setState((s) => ({ ...s, location: s.location === 'granted' ? 'granted' : 'manual', neighborhood: h })); setPhase('loading') }

  const inHood = useMemo(() => NEIGHBORS.filter((n) => !hidden.includes(n.id) && (n.hood === hood || (hood === '망원동' && n.hood === '합정동'))), [hood, hidden])
  const results = useMemo(() => inHood
    .map((n) => ({ n, f: fit(card, n), p: planFor(card, n, bonds[n.id]?.sessions) }))
    .filter(({ f }) => (sameSlot ? f.sharedSlots.length > 0 : true))
    .filter(({ n }) => (calmOnly ? n.greeting !== 'hello' : true))
    .sort((a, b) => Number(a.p.needsPro) - Number(b.p.needsPro) || b.f.score - a.f.score || a.p.start - b.p.start), [inHood, card, bonds, sameSlot, calmOnly])

  if (phase === 'ask' || phase === 'locating') {
    return (
      <div className="stack">
        <PageHead kicker="나란히" title="같은 동네에서 먼저 찾아볼게요.">
          <p>가까운 곳의 산책 카드만 보여 드려요. 상대에게는 동네 이름만 보이고, 정확한 위치는 보이지 않아요.</p>
        </PageHead>
        <button className="btn btn-ink btn-block" onClick={findByLocation} disabled={phase === 'locating'} aria-busy={phase === 'locating'}>
          {phase === 'locating' ? '위치 확인 중…' : '현재 위치로 찾기'}
        </button>
        {slow && <p className="notice" role="status">위치 확인이 늦어지고 있어요. 동네를 직접 골라도 돼요.</p>}
        <button className="btn btn-ghost btn-block" onClick={() => setPhase('manual')}>동네 직접 고르기</button>
        <p className="fineprint">체험 모드: 위치를 허용해도 좌표는 저장하지 않고, 시연용 동네(망원동)로 보여 드려요.</p>
      </div>
    )
  }

  if (phase === 'denied' || phase === 'manual' || phase === 'unavailable') {
    return (
      <div className="stack">
        <PageHead kicker="나란히" title={phase === 'denied' ? '위치 없이도 찾을 수 있어요.' : phase === 'unavailable' ? '위치를 찾지 못했어요.' : '어느 동네에서 걷나요?'}>
          {phase === 'denied' && <p>위치 권한이 꺼져 있어요. 주로 산책하는 동네를 골라 주세요. 권한은 브라우저 설정에서 바꿀 수 있어요.</p>}
          {phase === 'unavailable' && <p>신호가 약하거나 응답이 없었어요. 다시 시도하거나 동네를 골라 주세요.</p>}
        </PageHead>
        <ul className="hoods">
          {HOODS.map((h) => <li key={h}><button className="hood" onClick={() => pickHood(h)}>{h}</button></li>)}
        </ul>
        {phase !== 'manual' && <button className="btn btn-ghost btn-block" onClick={findByLocation}>현재 위치로 다시 찾기</button>}
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

  const filtered = sameSlot || calmOnly
  return (
    <div className="stack">
      <PageHead kicker={`${hood} · 체험 데이터`} title={`${josa(card.name, '과/와')} 나란히 걸을 이웃`}>
        <p>외모가 아니라 걷는 속도, 인사 방식, 거리로 맞춰요. 첫 만남은 언제나 멀리서, 인사 없이 시작해요.</p>
      </PageHead>
      <div className="filters" role="group" aria-label="걸러 보기">
        <label className="choice"><input type="checkbox" checked={sameSlot} onChange={(e) => setSameSlot(e.target.checked)} /><span>산책 시간 겹침</span></label>
        <label className="choice"><input type="checkbox" checked={calmOnly} onChange={(e) => setCalmOnly(e.target.checked)} /><span>차분한 인사</span></label>
        <button className="btn-quiet" onClick={() => setPhase('manual')}>동네 바꾸기</button>
      </div>
      <p className="sr-only" role="status">{results.length}마리의 이웃이 있어요.</p>
      {inHood.length === 0 ? (
        <div className="emptybox">
          {hidden.length > 0 && NEIGHBORS.some((n) => hidden.includes(n.id) && (n.hood === hood || (hood === '망원동' && n.hood === '합정동'))) ? (
            <>
              <p><b>이 동네 이웃을 모두 숨겼어요.</b></p>
              <p>숨긴 이웃은 설정에서 다시 볼 수 있어요.</p>
              <Link className="btn btn-ghost" to="/app/settings">숨긴 이웃 관리</Link>
            </>
          ) : (
            <>
              <p><b>{hood}에는 아직 산책 카드가 없어요.</b></p>
              <p>동네에 카드가 모이면 여기에 보여 드려요.{hood !== '망원동' ? ' 가까운 망원동부터 볼까요?' : ''}</p>
              {hood !== '망원동' && <button className="btn btn-ghost" onClick={() => pickHood('망원동')}>망원동 보기</button>}
            </>
          )}
        </div>
      ) : results.length === 0 ? (
        <div className="emptybox">
          <p><b>조건에 맞는 이웃이 없어요.</b></p>
          <p>{filtered ? '걸러 보기 조건을 풀면 더 많은 이웃이 보여요.' : '다른 동네를 골라 보세요.'}</p>
          {filtered && <button className="btn btn-ghost" onClick={() => { setSameSlot(false); setCalmOnly(false) }}>조건 풀기</button>}
        </div>
      ) : (
        <ul className="nlist">
          {results.map(({ n, f, p }) => {
            const r = requests[n.id]
            return (
              <li key={n.id}>
                <Link to={`/app/together/${n.id}`} className={`ncard ${p.needsPro ? 'ncard--pro' : ''}`}>
                  <span className="ncard__head">
                    <b className="ncard__name">{n.name}</b>
                    <span className="ncard__meta">{SIZE_LABEL[n.size]} · {PACE_LABEL[n.pace]} · {GREETING_LABEL[n.greeting]}</span>
                  </span>
                  <span className="ncard__dist"><span className="num">{p.start}m</span><small>에서 시작</small></span>
                  <span className="ncard__why">{p.needsPro ? '훈련사와 함께 권해요' : f.reasons.slice(0, 2).join(' · ') || '조건을 확인해 보세요'}</span>
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
