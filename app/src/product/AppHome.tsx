import { Link, useLocation } from 'react-router-dom'
import { closestCalm, useStore } from '../lib/store'
import { CardFace } from '../components/CardFace'
import { Lanes } from '../components/Lanes'
import { NEIGHBORS, planFor } from '../lib/demo'
import { josa } from '../lib/korean'

export function AppHome() {
  const card = useStore((s) => s.card)
  const walks = useStore((s) => s.walks)
  const activeWalk = useStore((s) => s.activeWalk)
  const bonds = useStore((s) => s.bonds)
  const requests = useStore((s) => s.requests)
  const activeT = useStore((s) => s.activeTogether)
  const location = useLocation()
  const needCard = (location.state as { needCard?: boolean } | null)?.needCard

  if (!card) {
    return (
      <section className="empty-hero" aria-labelledby="start-title">
        {needCard && <p className="notice" role="status">산책 카드를 먼저 만들어야 쓸 수 있는 메뉴예요.</p>}
        <div className="empty-hero__art" aria-hidden="true">
          <Lanes distance={12} me={{ name: '우리 개', state: 'calm' }} them={null} theme="paper" height={220} showLabel={false} walking />
        </div>
        <h1 id="start-title" className="empty-hero__title">우리 개의 거리부터<br />알려 주세요.</h1>
        <p className="empty-hero__body">이름, 편한 거리, 인사 방식만 있으면 산책 카드가 만들어져요. 1분이면 충분해요.</p>
        <Link to="/app/card/new" className="btn btn-ink btn-block">산책 카드 만들기</Link>
        <p className="fineprint">체험 모드에서는 입력한 내용이 이 브라우저에만 저장돼요.</p>
      </section>
    )
  }

  const calm = closestCalm(walks)
  const pending = Object.entries(requests).filter(([id, v]) => v.status === 'accepted' && !bonds[id]).length
  const lastBond = Object.values(bonds).map((b) => ({ b, last: b.sessions[b.sessions.length - 1] })).sort((x, y) => y.last.at - x.last.at)[0]
  const lastNeighbor = lastBond && NEIGHBORS.find((n) => n.id === lastBond.b.neighborId)
  const nextStart = lastBond && lastNeighbor ? planFor(card, lastNeighbor, lastBond.b.sessions).start : null

  return (
    <div className="stack">
      <h1 className="sr-only">{card.name}의 산책 카드</h1>
      <div className="home__card">
        <CardFace card={card} headingLevel={2} />
      </div>
      <div className="home__actions">
        <Link to="/app/show" className="btn btn-signal btn-block home__show">보여주기 <span className="home__showhint">누가 다가올 때</span></Link>
        <div className="row2">
          <Link to="/app/tag" className="btn btn-ghost">리드줄 태그 만들기</Link>
          <Link to="/app/card/edit" className="btn btn-ghost">카드 고치기</Link>
        </div>
      </div>

      <section className="panel" aria-labelledby="today-title">
        <h2 id="today-title" className="panel__title">오늘의 산책</h2>
        {activeWalk ? (
          <Link to="/app/walk" className="rowlink"><span><b>산책 중이에요</b><small>마주침을 기록하고 있어요</small></span><span aria-hidden="true">→</span></Link>
        ) : (
          <Link to="/app/walk" className="rowlink"><span><b>산책 시작하기</b><small>{walks.length ? `지금까지 ${walks.length}번 기록했어요` : '마주친 개와 거리를 기록해요'}</small></span><span aria-hidden="true">→</span></Link>
        )}
        {calm !== null && (
          <p className="panel__note">기록 중 가장 가까이서 편안했던 거리 <b className="num">{calm}m</b></p>
        )}
      </section>

      <section className="panel" aria-labelledby="next-title">
        <h2 id="next-title" className="panel__title">나란히</h2>
        {activeT ? (
          <Link to={`/app/together/${activeT.neighborId}/walk`} className="rowlink"><span><b>{josa(NEIGHBORS.find((x) => x.id === activeT.neighborId)?.name ?? '이웃', '과/와')} 걷는 중</b><small><span className="num">{activeT.steps[activeT.i]}m</span> 단계에서 이어서 걸어요</small></span><span aria-hidden="true">→</span></Link>
        ) : lastBond && lastNeighbor ? (
          <Link to={`/app/together/${lastNeighbor.id}`} className="rowlink"><span><b>{josa(lastNeighbor.name, '과/와')} 다음 산책</b><small><span className="num">{nextStart}m</span>에서 시작해요</small></span><span aria-hidden="true">→</span></Link>
        ) : (
          <Link to="/app/together" className="rowlink"><span><b>동네 이웃 개 찾기</b><small>{pending ? '수락된 요청이 있어요' : '걷는 속도와 거리가 맞는 이웃'}</small></span><span aria-hidden="true">→</span></Link>
        )}
      </section>
    </div>
  )
}
