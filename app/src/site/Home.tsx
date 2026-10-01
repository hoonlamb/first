import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DistanceDial } from './DistanceDial'
import { Lanes } from '../components/Lanes'
import { CardFace } from '../components/CardFace'
import { SiteHeader, SiteFooter } from './SiteChrome'
import { planFor } from '../lib/demo'

const SAMPLE_CARD = {
  name: '뽀리', size: 'medium' as const, pace: 'slow' as const, greeting: 'slow' as const, comfort: 8,
  triggers: ['bike' as const, 'kids' as const], slots: ['evening' as const], note: '처음엔 옆보다 조금 뒤가 편해요.',
}

// Built from the real product rule (lib/demo planFor) for 뽀리(8m) and 두부(6m), so the site never shows other numbers than the app.
const FIRST = planFor({ comfort: 8, greeting: 'slow' }, { comfort: 6, greeting: 'slow' })
const SECOND = planFor({ comfort: 8, greeting: 'slow' }, { comfort: 6, greeting: 'slow' }, [{ closest: FIRST.floor }])
const COPY = [
  { title: '멀리서, 같은 방향으로', body: '마주 보지 않고 같은 쪽으로 걸어요. 서로를 알아채기만 해도 충분해요.' },
  { title: '둘 다 편하면 조금 더 가까이', body: '한쪽이라도 긴장하면 거리를 다시 벌려요. 물러나는 것도 순서예요.' },
  { title: '첫날은 여기까지', body: `첫 만남에는 ${FIRST.floor}m보다 가까이 가지 않고, 인사도 하지 않아요.` },
]
const LADDER = [
  ...FIRST.steps.map((d, k) => ({ d, ...COPY[Math.min(k, COPY.length - 1)] })),
  { d: SECOND.start, title: '다음 산책은 이어서', body: `처음부터가 아니라 ${SECOND.start}m에서 몸을 풀고 시작해요. 가까워지는 건 여러 번에 걸쳐서요.` },
]

function LadderPreview() {
  const [i, setI] = useState(0)
  const step = LADDER[i]
  return (
    <div className="ladder">
      <div className="ladder__stage" aria-hidden="true">
        <Lanes distance={step.d} me={{ name: '뽀리', state: 'calm' }} them={{ name: '두부', state: 'calm' }} theme="paper" height={320} walking />
      </div>
      <ol className="ladder__steps">
        {LADDER.map((s, idx) => (
          <li key={`${s.d}-${idx}`}>
            <button className={`ladder__step ${idx === i ? 'is-on' : ''}`} aria-current={idx === i ? 'step' : undefined} onClick={() => setI(idx)}>
              <span className="num">{s.d}m</span>
              <span>{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="ladder__body" aria-live="polite"><b>{step.title}.</b> {step.body}</p>
    </div>
  )
}

export function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="wrap">
            <p className="eyebrow eyebrow--moss">동네 산책을 위한 거리 약속</p>
            <h1 id="hero-title" className="hero__title">가까워지는 데는<br />순서가 있어요.</h1>
          </div>
          <div className="wrap hero__grid">
            <div className="hero__copy">
              <p className="hero__lede">개마다 편한 거리가 달라요. 댕큐는 우리 개의 거리를 먼저 알려 주고, 그 거리를 지키며 한 걸음씩 가까워지게 도와요.</p>
            </div>
            <DistanceDial />
          </div>
        </section>

        <section className="section problem on-paper" aria-labelledby="problem-title">
          <div className="wrap problem__grid">
            <div>
              <p className="eyebrow">산책길의 3초</p>
              <h2 id="problem-title" className="h-xl problem__title">“귀엽다”며 다가오는 손이<br />어떤 개에게는 가장 무서운 순간이에요.</h2>
            </div>
            <div className="stat">
              <p className="stat__num num">89.4%</p>
              <p className="stat__text">반려견 가구 중 산책하다 비반려인의 행동 때문에 불편을 겪은 비율. 가장 많은 건 <b>개를 놀라게 하거나 겁주는 행동(48.7%)</b>, 다음이 <b>허락 없이 만지기(39.2%)</b>였어요.</p>
              <p className="stat__src">출처: KB금융지주 경영연구소 「2025 한국 반려동물 보고서」 보도 인용(데일리벳, 2025). 원문 대조 전.</p>
            </div>
          </div>
          <div className="wrap">
            <p className="problem__turn">다가오는 사람은 <b>어떻게 다가가면 되는지</b>, 마주 오는 개의 보호자는 <b>얼마나 떨어져야 하는지</b> 몰라요. 불편은 친구가 없어서가 아니라, 서로의 거리를 몰라서 생겨요.</p>
          </div>
        </section>

        <section className="section how on-paper" id="how" aria-labelledby="how-title">
          <div className="wrap">
            <p className="eyebrow">댕큐가 하는 일</p>
            <h2 id="how-title" className="h-xl">거리를 말하고, 지키고, 기억해요.</h2>
          </div>
          <div className="wrap how__rows">
            <article className="how__row">
              <div className="how__text">
                <p className="how__no num">01</p>
                <h3 className="h-l">산책 카드</h3>
                <p>다가오는 사람에게 하는 부탁 한 줄, 다른 개와 편한 거리, 조심할 것이 한 장에 담겨요. 거리는 “큰 걸음 10번쯤”처럼 누구나 가늠할 수 있게 적어요. 휴대폰을 꺼낼 틈이 없다면 같은 문장을 리드줄 태그로 달 수도 있어요.</p>
                <Link to="/app/start" className="btn btn-ink">카드 만들어 보기</Link>
              </div>
              <div className="how__visual how__visual--card"><CardFace card={SAMPLE_CARD} /></div>
            </article>
            <article className="how__row">
              <div className="how__text">
                <p className="how__no num">02</p>
                <h3 className="h-l">나란히 첫 산책</h3>
                <p>이웃 개와의 첫 만남은 마주 보는 인사가 아니라 멀리서 같은 방향으로 걷기부터 시작해요. 여러 반려견 훈련 자료가 개를 처음 소개할 때 권하는 ‘병행 산책’을 단계로 나눴어요. 첫날은 정해진 거리까지만, 인사 없이 걸어요.</p>
              </div>
              <div className="how__visual"><LadderPreview /></div>
            </article>
            <article className="how__row">
              <div className="how__text">
                <p className="how__no num">03</p>
                <h3 className="h-l">사이 기록</h3>
                <p>얼마나 가까이서 편안했는지 기록이 쌓여요. 다음 나란히 산책은 처음부터가 아니라, 지난번 편안했던 거리보다 한 단계 멀리서 몸을 풀고 이어서 시작해요.</p>
                <Link to="/app" className="btn btn-ink">체험 모드로 써 보기</Link>
              </div>
              <div className="how__visual how__visual--bond" aria-hidden="true">
                {[6, 4, 3].map((d, i) => (
                  <div key={d} className="bondbar"><span className="bondbar__date">{['1회 · 첫날', '2회', '3회'][i]}</span><span className="bondbar__line" style={{ width: `${(d / 20) * 100}%` }} /><span className="num">{d}m</span></div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="section show" aria-labelledby="show-title">
          <div className="wrap show__grid">
            <div className="show__phone" aria-hidden="true">
              <p className="show__big">냄새 먼저,<br />손은 나중에.</p>
              <p className="show__small">개와 함께라면 큰 걸음 10번쯤 떨어져 지나가 주세요.</p>
              <p className="show__thanks">거리를 지켜 줘서, 댕큐.</p>
            </div>
            <div>
              <p className="eyebrow eyebrow--moss">보여주기 모드</p>
              <h2 id="show-title" className="h-xl">말 대신<br />화면 한 장.</h2>
              <p className="show__text">첫 줄은 지금 해 줬으면 하는 행동, 둘째 줄은 걸음 수로 적은 거리예요. 마지막 줄은 언제나 고마움이에요. 거리를 지켜 준 사람에게 하는 인사, 그게 이름 ‘댕큐’의 뜻이에요.</p>
            </div>
          </div>
        </section>

        <section className="section principles on-paper" aria-labelledby="pr-title">
          <div className="wrap">
            <h2 id="pr-title" className="h-xl">서두르지 않겠다는 약속</h2>
            <ul className="principles__list">
              <li><b>사진보다 성향.</b> 외모로 고르지 않아요. 속도, 인사 방식, 거리로 맞춰요.</li>
              <li><b>첫 만남은 인사 없이.</b> 모든 나란히 산책은 멀리서 같은 방향으로 시작해요.</li>
              <li><b>멈춤도 성공.</b> 어느 단계에서 끝나도 기록이 남고, 다음번엔 그보다 한 단계 멀리서 이어져요.</li>
              <li><b>보호자 정보는 뒤로.</b> 개의 카드가 먼저예요. 연락처나 사람 사진은 필요하지 않아요.</li>
            </ul>
          </div>
        </section>

        <section className="section cta" aria-labelledby="cta-title">
          <div className="wrap cta__inner">
            <h2 id="cta-title" className="h-xl">우리 개의 거리부터<br />알려 주세요.</h2>
            <Link to="/app" className="btn btn-signal">댕큐 체험하기 <span aria-hidden="true">→</span></Link>
            <p className="cta__note">체험 모드예요. 입력한 내용은 이 브라우저에만 저장되고, 이웃과 응답은 시연용 데이터예요.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
