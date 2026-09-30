import type { DogCard } from '../lib/store'
import { GREETING_ASK, GREETING_LABEL, PACE_LABEL, SIZE_LABEL, SLOT_LABEL, TRIGGER_LABEL } from '../lib/store'
import { Mark } from './Logo'
import { distanceWords } from '../lib/korean'

type Props = { card: Omit<DogCard, 'updatedAt'>; compact?: boolean; headingLevel?: 1 | 2 | 3 }

/** 산책 카드 — the dog's self-introduction. Distance is the headline, not the photo. */
export function CardFace({ card, compact = false, headingLevel = 3 }: Props) {
  const H = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const ask = GREETING_ASK[card.greeting]
  const ring = Math.min(card.comfort / 20, 1)
  return (
    <article className={`cardface ${compact ? 'cardface--compact' : ''}`} aria-label={`${card.name || '이름 없음'}의 산책 카드`}>
      <header className="cardface__top">
        <span className="cardface__kicker">산책 카드</span>
        <Mark tone="paper" size={26} />
      </header>
      <H className="cardface__name">{card.name || '우리 개'}</H>
      <div className="cardface__dist">
        <svg viewBox="0 0 200 60" className="cardface__lanes" aria-hidden="true">
          <line x1="4" y1="10" x2="150" y2="10" stroke="#F4F1EA" strokeWidth="5" strokeLinecap="round" />
          <line x1="30" y1={10 + 12 + ring * 36} x2="150" y2={10 + 12 + ring * 36} stroke="#FF6A2B" strokeWidth="5" strokeLinecap="round" />
          <circle cx="164" cy="10" r="6" fill="#F4F1EA" />
          <circle cx="164" cy={10 + 12 + ring * 36} r="6" fill="#FF6A2B" />
        </svg>
        <p><span className="num cardface__m">{card.comfort}m</span><span className="cardface__mlabel">다른 개와 편한 거리</span><span className="cardface__steps">{distanceWords(card.comfort)}</span></p>
      </div>
      <p className="cardface__ask"><small>다가오는 사람에게</small>{ask.title}</p>
      {!compact && (
        <dl className="cardface__facts">
          <div><dt>인사</dt><dd>{GREETING_LABEL[card.greeting]}</dd></div>
          <div><dt>걸음</dt><dd>{PACE_LABEL[card.pace]} · {SIZE_LABEL[card.size]}</dd></div>
          <div><dt>조심해 주세요</dt><dd>{card.triggers.length ? card.triggers.map((t) => TRIGGER_LABEL[t]).join(', ') : '특별히 없어요'}</dd></div>
          {card.slots.length > 0 && <div><dt>주로 걷는 때</dt><dd>{card.slots.map((s) => SLOT_LABEL[s]).join(' · ')}</dd></div>}
          {card.note && <div><dt>한마디</dt><dd>{card.note}</dd></div>}
        </dl>
      )}
    </article>
  )
}
