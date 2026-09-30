import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { NEIGHBORS, planFor } from '../lib/demo'
import { PageHead } from './ui'

const dateLabel = (t: number) => new Date(t).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })

/** Signature interaction #5 — 사이 기록: the relationship drawn as a distance that shrinks over sessions. */
export function BondScreen() {
  const card = useStore((s) => s.card)!
  const bonds = useStore((s) => s.bonds)
  const hidden = useStore((s) => s.hidden)
  const list = Object.values(bonds).filter((b) => !hidden.includes(b.neighborId)).sort((a, b) => b.sessions[b.sessions.length - 1].at - a.sessions[a.sessions.length - 1].at)

  if (list.length === 0) {
    return (
      <div className="stack">
        <PageHead kicker="사이" title="아직 나란히 걸은 이웃이 없어요.">
          <p>나란히 산책을 마치면 얼마나 가까이서 편안했는지 여기에 쌓여요.</p>
        </PageHead>
        <Link to="/app/together" className="btn btn-ink btn-block">이웃 찾기</Link>
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHead kicker="사이" title={`${card.name}의 사이`}>
        <p>선이 짧아질수록 가까워진 거예요. 다음 산책은 마지막으로 편안했던 거리보다 한 단계 멀리서 몸을 풀고 시작해요.</p>
      </PageHead>
      {list.map((b) => {
        const n = NEIGHBORS.find((x) => x.id === b.neighborId)
        if (!n) return null
        const next = planFor(card, n, b.sessions)
        return (
          <section key={b.neighborId} className="bond" aria-labelledby={`bond-${n.id}`}>
            <header className="bond__head">
              <h2 id={`bond-${n.id}`} className="bond__name">{n.name}</h2>
              <span className="bond__next">다음 시작 <b className="num">{next.start}m</b>{next.needsPro ? ' · 훈련사 동행 권장' : ''}</span>
            </header>
            <ol className="bond__sessions">
              {b.sessions.map((s, k) => (
                <li key={s.at} className="bondbar">
                  <span className="bondbar__date">{k + 1}회 · {dateLabel(s.at)}</span>
                  <span className="bondbar__line" style={{ width: `${((s.closest ?? 20) / 20) * 100}%`, opacity: s.closest === null ? 0.35 : 1 }} />
                  <span className="num">{s.closest !== null ? `${s.closest}m` : '알아봄'}</span>
                </li>
              ))}
            </ol>
            <Link to={`/app/together/${n.id}`} className="btn btn-ghost btn-block">다음 나란히 산책 약속하기</Link>
          </section>
        )
      })}
    </div>
  )
}
