import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, MapPin, Bookmark, Footprints, Megaphone, RefreshCw, ChevronRight } from 'lucide-react'
import { GREETING_ASK, closestCalm, getState, setState, useStore } from '../../lib/store'
import { unreadIds } from '../../lib/chat'
import { NEIGHBORS, fit, planFor } from '../../lib/demo'
import { PLACES } from '../../lib/places'
import { distanceWords, josa } from '../../lib/korean'
import { RootHeader, Section } from '../ui/kit'
import { asset } from '../ui/asset'
import './home.css'

const QUESTIONS = [
  {
    id: 'approach', q: '다른 개가 다가오면 우리 개는?',
    options: [
      { e: '🐕', t: '먼저 다가가요', tip: '반가운 친구네요. 그래도 상대가 원하는지 먼저 물어보는 연습을 해 봐요.' },
      { e: '👀', t: '멈춰서 지켜봐요', tip: '관찰하는 친구예요. 나란히 첫날처럼 멀리서 같은 방향으로 걸으면 편해져요.' },
      { e: '🙈', t: '피하고 싶어해요', tip: '편한 거리를 넉넉히 두세요. 카드의 인사 방식을 ‘인사 없이 지나가요’로 두는 것도 방법이에요.' },
      { e: '🌀', t: '그때그때 달라요', tip: '산책 기록을 남기면 언제 편하고 언제 긴장하는지 보이기 시작해요.' },
    ],
  },
  {
    id: 'pace', q: '우리 개가 제일 신나는 산책은?',
    options: [
      { e: '🌳', t: '공원 한 바퀴', tip: '넓은 곳은 첫 나란히에 딱 좋아요. 멍슐랭에서 탁 트인 곳을 찾아보세요.' },
      { e: '🏃', t: '빠르게 달리기', tip: '걷는 속도가 비슷한 친구와 나란히 걸으면 둘 다 편해요.' },
      { e: '🐾', t: '천천히 냄새 맡기', tip: '느긋한 친구예요. 카드의 걸음을 ‘느긋하게’로 두면 비슷한 이웃을 먼저 보여 드려요.' },
      { e: '🌊', t: '물가 산책', tip: '물가는 사람이 많을 수 있어요. 한적한 시간대를 골라 보세요.' },
    ],
  },
]

export function HomeScreen() {
  const card = useStore((s) => s.card)!
  const answers = useStore((s) => s.answers)
  const bonds = useStore((s) => s.bonds)
  const walks = useStore((s) => s.walks)
  useStore((s) => s.threads)
  const hidden = useStore((s) => s.hidden)
  const activeT = useStore((s) => s.activeTogether)
  const [qi, setQi] = useState(0)
  const question = QUESTIONS[qi]
  const answered = question.options.find((o) => o.t === answers[question.id])
  useStore((s) => s.seen)
  const unread = unreadIds(getState()).length
  const neighbors = NEIGHBORS.filter((n) => !hidden.includes(n.id)).map((n) => ({ n, p: planFor(card, n, bonds[n.id]?.sessions), score: fit(card, n).score }))
    .sort((a, b) => Number(a.p.needsPro) - Number(b.p.needsPro) || b.score - a.score)
  const calm = closestCalm(walks)
  const photo = card.photo ?? 'photos/dog-03-bori-terrier.jpg'
  const ask = GREETING_ASK[card.greeting]
  const bondCount = Object.keys(bonds).length
  const activeN = activeT && NEIGHBORS.find((n) => n.id === activeT.neighborId)

  return (
    <div className="hf-fade-in">
      <RootHeader>
        <Link to="/app/chat" className="hf-iconbtn" aria-label={`채팅${unread ? `, 새 메시지 ${unread}개` : ''}`}>
          <MessageCircle size={24} strokeWidth={1.9} />
          {unread > 0 && <span className="hf-iconbtn__dot num">{unread}</span>}
        </Link>
      </RootHeader>

      <div className="hf-page">
        <h1 className="sr-only">{card.name}의 홈</h1>

        {activeN && (
          <Link to={`/app/together/${activeN.id}/walk`} className="hf-resume">
            <span className="hf-resume__dot" aria-hidden="true" />
            <span><b>{josa(activeN.name, '과/와')} 나란히 걷는 중</b><small className="num">{activeT!.steps[activeT!.i]}m 단계에서 이어서 걷기</small></span>
            <ChevronRight size={20} />
          </Link>
        )}

        {/* my dog card — the walk card as the hero */}
        <section className="hf-mydog" aria-label={`${card.name}의 산책 카드`}>
          <div className="hf-photo hf-mydog__photo">
            <img src={asset(photo)} alt={`${card.name} 사진`} />
            <div className="hf-photo__top">
              <span className="hf-chip hf-chip--glass hf-chip--sm">산책 카드</span>
              <Link to="/app/card/edit" className="hf-chip hf-chip--glass hf-chip--sm">수정</Link>
            </div>
            <div className="hf-photo__over">
              <p className="hf-photo__name">{card.name}{card.sex && <small>{card.sex === 'm' ? '♂' : '♀'}</small>}{card.age !== undefined && <small className="num">{card.age}살</small>}</p>
              <p className="hf-mydog__ask">“{ask.title}”</p>
            </div>
          </div>
          <div className="hf-mydog__body">
            <div className="hf-mydog__dist">
              <span className="hf-meta">다른 개와 편한 거리</span>
              <b className="num">{card.comfort}m</b>
              <span className="hf-mydog__steps">{distanceWords(card.comfort)}</span>
            </div>
            <div className="hf-mydog__actions">
              <Link to="/app/show" className="hf-btn hf-btn--primary"><Megaphone size={18} /> 보여주기</Link>
              <Link to="/app/walk" className="hf-btn hf-btn--soft"><Footprints size={18} /> 산책 시작</Link>
            </div>
          </div>
        </section>

        {/* daily question (from the original 매칭 질문) */}
        <section className="hf-card hf-card--line hf-question" aria-labelledby="q-title">
          <p className="hf-question__kicker">오늘의 산책 질문</p>
          <h2 id="q-title" className="hf-question__q">Q. {question.q}</h2>
          <div className="hf-question__opts" role="radiogroup" aria-labelledby="q-title">
            {question.options.map((o) => (
              <button key={o.t} role="radio" aria-checked={answers[question.id] === o.t} className="hf-option"
                onClick={() => setState((s) => ({ ...s, answers: { ...s.answers, [question.id]: o.t } }))}>
                <span aria-hidden="true">{o.e}</span>{o.t}
              </button>
            ))}
          </div>
          {answered && <p className="hf-question__tip" aria-live="polite">{answered.tip}</p>}
          <button className="hf-question__next" onClick={() => setQi((qi + 1) % QUESTIONS.length)}>다른 질문 보기 <RefreshCw size={13} /></button>
        </section>

        <Section id="n-title" title="나란히 걸어 볼 이웃" sub="산책 시간·속도·인사 방식이 잘 맞는 순서예요 · 체험 데이터" more={{ to: '/app/together' }}>
          <div className="hf-hscroll">
            {neighbors.slice(0, 5).map(({ n, p }) => (
              <Link key={n.id} to={`/app/together/${n.id}`} className="hf-photo hf-ncard">
                <img src={asset(n.photo)} alt="" />
                <div className="hf-photo__top"><span className={`hf-pill ${p.needsPro ? 'hf-pill--alert' : 'hf-pill--pink'} num`}>{p.needsPro ? '훈련사 동행' : `${p.start}m부터`}</span></div>
                <div className="hf-photo__over">
                  <p className="hf-photo__name">{n.name}<small>{n.sex === 'm' ? '♂' : '♀'}</small></p>
                  <p className="hf-ncard__meta">{n.breed} · <span className="num">{n.age}</span>살</p>
                </div>
              </Link>
            ))}
          </div>
        </Section>

        <Section id="p-title" title="멍슐랭 Pick" sub="첫 나란히는 탁 트인 곳에서 시작해요" more={{ to: '/app/places' }}>
          <div className="hf-hscroll">
            {[...PLACES].sort((a, b) => Number(b.open) - Number(a.open)).map((p) => (
              <Link key={p.id} to={`/app/places/${p.id}`} className="hf-photo hf-pcard">
                <img src={asset(p.photo)} alt="" />
                {p.open && <div className="hf-photo__top"><span className="hf-pill hf-pill--pink">첫 나란히 추천</span></div>}
                <div className="hf-photo__over">
                  <p className="hf-photo__name">{p.name}</p>
                  <p className="hf-pcard__meta"><MapPin size={13} /> {p.area}</p>
                </div>
                <span className="hf-pcard__save" aria-hidden="true"><Bookmark size={16} /></span>
              </Link>
            ))}
          </div>
        </Section>

        <section className="hf-stats" aria-label="우리 기록">
          <Link to="/app/badges" className="hf-stat"><b className="num">{bondCount}</b><span>나란히 이웃</span></Link>
          <Link to="/app/walk" className="hf-stat"><b className="num">{walks.length}</b><span>산책 기록</span></Link>
          <Link to="/app/walk" className="hf-stat"><b className="num">{calm !== null ? `${calm}m` : '–'}</b><span>가장 가까이 편안</span></Link>
        </section>
      </div>
    </div>
  )
}
