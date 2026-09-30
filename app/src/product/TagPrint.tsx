import { useNavigate } from 'react-router-dom'
import { GREETING_ASK, useStore } from '../lib/store'
import { distanceWords } from '../lib/korean'
import { Mark } from '../components/Logo'
import { PageHead } from './ui'

/**
 * 리드줄 태그 — the phone-free version of 보여주기 (the 3-second moment leaves no time to unlock a phone).
 * Same sentences as the card, printed at tag size. Browser print → cut → attach.
 */
export function TagPrint() {
  const card = useStore((s) => s.card)!
  const nav = useNavigate()
  const ask = GREETING_ASK[card.greeting]
  return (
    <div className="stack tagprint">
      <PageHead kicker="리드줄 태그" title="휴대폰 없이도 보이게.">
        <p>누가 다가오는 3초 동안 휴대폰을 꺼내기는 어려워요. 카드와 같은 문장을 태그로 인쇄해 리드줄이나 하네스에 달아 주세요.</p>
      </PageHead>
      <div className="tags" aria-label="인쇄될 태그 미리보기">
        {[0, 1].map((k) => (
          <div key={k} className={`tag-print ${k === 1 ? 'tag-print--back' : ''}`}>
            {k === 0 ? (
              <>
                <p className="tag-print__ask">{ask.title}</p>
                <p className="tag-print__dist">개와 함께라면 {distanceWords(card.comfort)} 떨어져 주세요</p>
              </>
            ) : (
              <>
                <p className="tag-print__name">{card.name}</p>
                <p className="tag-print__thanks">거리를 지켜 줘서, 댕큐.</p>
                <span className="tag-print__mark"><Mark tone="paper" size={28} /></span>
              </>
            )}
          </div>
        ))}
      </div>
      <p className="fineprint">앞뒤 한 쌍이에요. 실제 크기 약 8×5cm로 인쇄돼요. 방수 코팅이나 비닐 커버를 권해요.</p>
      <button className="btn btn-ink btn-block" onClick={() => window.print()}>인쇄하기</button>
      <button className="btn btn-ghost btn-block" onClick={() => nav('/app')}>카드로 돌아가기</button>
    </div>
  )
}
