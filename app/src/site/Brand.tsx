import { useState, type ReactNode } from 'react'
import { TabIcon } from '../components/TabIcon'
import { SiteHeader, SiteFooter } from './SiteChrome'
import { Logo, Mark } from '../components/Logo'
import { Dog } from '../components/Dog'
import { Lanes } from '../components/Lanes'
import { CardFace } from '../components/CardFace'
import { REACTION_LABEL, type Reaction } from '../lib/store'
import { prefersReducedMotion } from '../lib/motion'
import '../styles/brand.css'

/* Brand guide — /#/brand. Everything visual on this page is drawn live from the same components the product uses. */

const asset = (f: string) => `${import.meta.env.BASE_URL}brand/${f}`

const INK = '#15201A', PAPER = '#F4F1EA', SIGNAL = '#FF6A2B', MOSS = '#9FD3B2'

const TOC: [string, string][] = [
  ['positioning', '포지셔닝'], ['message', '메시지 구조'], ['voice', '보이스 & 톤'], ['logo', '로고'],
  ['color', '색'], ['type', '타이포그래피'], ['grid', '그리드 & 간격'], ['icons', '아이콘'],
  ['illust', '일러스트'], ['motion', '모션 & 소리'], ['gallery', '응용 사례'], ['records', '기록'],
]

function Head({ n, id, title, lede }: { n: number; id: string; title: string; lede: ReactNode }) {
  return (
    <header className="bd-head">
      <p className="bd-head__n num" aria-hidden="true">{String(n).padStart(2, '0')}</p>
      <div className="bd-head__text">
        <h2 id={`${id}-t`} className="h-xl" tabIndex={-1}>{title}</h2>
        <p className="bd-head__lede">{lede}</p>
      </div>
    </header>
  )
}

function Section({ id, tone = 'paper', children }: { id: string; tone?: 'paper' | 'paper2' | 'ink'; children: ReactNode }) {
  return (
    <section id={id} className={`bd-sec bd-sec--${tone} ${tone === 'ink' ? '' : 'on-paper'}`} aria-labelledby={`${id}-t`}>
      <div className="wrap">{children}</div>
    </section>
  )
}

/** Mark with explicit lane colours — for mono and misuse examples. Same geometry as <Mark>. */
function MarkSvg({ a, b, size = 64, children, label }: { a: string; b: string; size?: number; children?: ReactNode; label?: string }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 48 36" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {children ?? (
        <>
          <line x1="3" y1="9" x2="33" y2="9" stroke={a} strokeWidth="6" strokeLinecap="round" />
          <line x1="13" y1="27" x2="33" y2="27" stroke={b} strokeWidth="6" strokeLinecap="round" />
          <circle cx="42" cy="9" r="5" fill={a} />
          <circle cx="42" cy="27" r="5" fill={b} />
        </>
      )}
    </svg>
  )
}

function Tag({ kind, children }: { kind: 'fact' | 'press' | 'hypo'; children?: ReactNode }) {
  const label = kind === 'fact' ? '사실' : kind === 'press' ? '보도 인용' : '가설'
  return <span className={`bd-tag bd-tag--${kind === 'press' ? 'fact' : kind}`}>{label}{children && <> · {children}</>}</span>
}

/* ------------------------------------------------------------------ 01 */
function Positioning() {
  return (
    <Section id="positioning">
      <Head n={1} id="positioning" title="포지셔닝" lede="댕큐는 만남을 약속하지 않아요. 거리를 약속해요." />
      <div className="bd-statement">
        <p className="bd-statement__k">브랜드 핵심 문장</p>
        <p className="bd-statement__s">가까워지는 데는<br />순서가 있어요.</p>
        <svg className="bd-statement__lanes" viewBox="0 0 600 60" aria-hidden="true">
          <line x1="4" y1="12" x2="540" y2="12" stroke={PAPER} strokeWidth="6" strokeLinecap="round" />
          <path d="M60 52 L200 52 C225 52 225 38 250 38 L360 38 C380 38 380 28 400 28 L540 28" fill="none" stroke={SIGNAL} strokeWidth="6" strokeLinecap="round" />
          <circle cx="570" cy="12" r="8" fill={PAPER} /><circle cx="570" cy="28" r="8" fill={SIGNAL} />
        </svg>
      </div>
      <div className="bd-cols3">
        <article className="bd-block">
          <h3>포지셔닝 문장</h3>
          <p>산책길에서 낯선 사람이나 개가 다가오는 순간이 불안한 보호자에게, 댕큐는 <b>우리 개의 편한 거리를 말로 보여 주고</b>, 그 거리를 지키며 <b>한 걸음씩 가까워지게</b> 돕는 산책 도구예요.</p>
          <p className="bd-note"><Tag kind="hypo" /> 누구의 어떤 순간: 모르는 사람·개가 다가오는 3초, 보호자가 “얘가 좀…”을 설명하지 못하는 순간. 사용자 인터뷰 전이에요.</p>
        </article>
        <article className="bd-block">
          <h3>이름의 뜻</h3>
          <p className="bd-name" aria-label="댕댕이의 댕, 땡큐의 큐"><span>댕</span><small>댕댕이</small><span className="bd-name__plus" aria-hidden="true">+</span><span>큐</span><small>땡큐</small></p>
          <p><b>거리를 지켜 줘서, 댕큐.</b> 서비스가 받는 인사가 아니라, 우리 개가 거리를 지켜 준 사람에게 건네는 고마움이에요. 그래서 모든 산책 카드의 마지막 줄은 고마움이에요.</p>
          <p className="bd-note">영문 표기는 <b>DANGQ</b> 하나만 써요. 상표 가용성은 아직 조사하지 않았어요.</p>
        </article>
        <article className="bd-block">
          <h3>우리는 / 우리가 아닌 것</h3>
          <table className="bd-isnot">
            <thead><tr><th scope="col">댕큐는</th><th scope="col">댕큐는 하지 않아요</th></tr></thead>
            <tbody>
              <tr><td>거리를 약속해요</td><td>만남을 약속하지 않아요</td></tr>
              <tr><td>성향으로 맞춰요</td><td>사진·외모로 고르지 않아요</td></tr>
              <tr><td>개의 속도를 따라요</td><td>진도를 재촉하지 않아요</td></tr>
              <tr><td>기록을 남겨요</td><td>점수·순위를 매기지 않아요</td></tr>
            </tbody>
          </table>
        </article>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------------ 02 */
const PILLARS = [
  {
    n: '01', name: '산책 카드', verb: '거리를 말해요', line: '우리 개의 편한 거리, 인사 방식, 조심할 것을 한 장에. 다가오는 사람에게 설명 대신 보여 줘요.',
    proofs: [
      { k: 'press' as const, src: 'S05', t: '반려견 가구 89.4%가 산책 중 낯선 사람의 행동으로 불편을 겪었고, ‘허락 없이 만지기’가 39.2%예요.' },
      { k: 'fact' as const, src: 'S26', t: '노란 리본(2012~, 40여 개국)처럼 표식으로 거리를 알리려는 시도는 이미 있어요.' },
      { k: 'hypo' as const, src: '', t: '‘다가오지 마세요’보다 ‘이렇게 다가와 주세요’가 더 잘 지켜진다. 카드만으로 혼자서도 쓸 이유가 된다(확인 기준: 카드 완성률 50%).' },
    ],
  },
  {
    n: '02', name: '나란히 첫 산책', verb: '거리를 지켜요', line: '첫 만남은 마주 보는 인사가 아니라 멀리서 같은 방향으로 걷기부터. 15m에서 시작해 한 단계씩.',
    proofs: [
      { k: 'fact' as const, src: 'S25', t: '훈련사 칼럼: 개끼리 인사가 당연하다는 건 오해이고, 인사하지 않고 지나가기도 예절이에요.' },
      { k: 'press' as const, src: 'S20', t: '반려견 유치원 이용 이유의 71.0%가 사회화, 월평균 25만4,800원. 보호자는 이미 사회화에 돈을 써요.' },
      { k: 'hypo' as const, src: '', t: '거리를 단계로 나누면 첫 만남의 긴장이 줄어든다. 사용자 검증 전이에요.' },
    ],
  },
  {
    n: '03', name: '사이 기록', verb: '거리를 기억해요', line: '얼마나 가까이서 편안했는지 쌓여요. 다음 나란히 산책은 지난번 편안했던 거리에서 시작해요.',
    proofs: [
      { k: 'press' as const, src: 'S03', t: '반려견 가구 59.3%가 주 4일 이상 밖에 나가요. 기록할 순간이 거의 매일 있어요.' },
      { k: 'press' as const, src: 'S71·S72', t: '산책은 이웃을 알게 할 가능성을 높이지만(OR 3.10), 다른 연구에선 효과가 약했어요. 그래서 만남보다 거리를 약속해요.' },
      { k: 'hypo' as const, src: '', t: '“다음엔 8m부터”처럼 이어지는 기록이 다시 올 이유가 된다(확인 기준: 2주 뒤 기록 유지 20%).' },
    ],
  },
]

function Message() {
  return (
    <Section id="message" tone="paper2">
      <Head n={2} id="message" title="메시지 구조" lede="약속 하나, 기둥 셋, 근거는 출처가 있는 사실과 아직 검증 전인 가설로 나눠서 적어요." />
      <div className="bd-promise">
        <p className="bd-promise__k">핵심 약속</p>
        <p className="bd-promise__s">우리 개의 거리를 먼저 알리고, 그 거리를 지키며 가까워져요.</p>
        <p className="bd-promise__sub">한 줄 요약: 거리를 말하고, 지키고, 기억해요.</p>
      </div>
      <ol className="bd-pillars">
        {PILLARS.map((p) => (
          <li key={p.n} className="bd-pillar">
            <p className="bd-pillar__n num">{p.n}</p>
            <h3>{p.name}</h3>
            <p className="bd-pillar__verb">{p.verb}</p>
            <p className="bd-pillar__line">{p.line}</p>
            <ul className="bd-proofs" aria-label={`${p.name} 근거`}>
              {p.proofs.map((pr) => (
                <li key={pr.t}><Tag kind={pr.k}>{pr.src || undefined}</Tag><span>{pr.t}</span></li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="bd-legend"><Tag kind="fact" /> <Tag kind="press" /> 출처 번호(S)는 <code>outputs/01_research/sources.md</code>를 따라요. ‘보도 인용’은 원문 대조 전이에요. <Tag kind="hypo" /> 검증 전이라 약속하는 문장으로 쓰지 않아요.</p>
    </Section>
  )
}

/* ------------------------------------------------------------------ 03 */
const VOICE = [
  { t: '개가 주어예요', b: '보호자나 지나가는 사람을 평가하지 않아요. 개의 상태를 말해요.', ex: '뽀리는 8m부터 편안해요.' },
  { t: '부탁하되 탓하지 않아요', b: '금지보다 방법을 알려 줘요. 읽는 사람이 무엇을 하면 되는지 남겨요.', ex: '만지기 전에 물어봐 주세요.' },
  { t: '서두르지 않아요', b: '만남이나 진도를 재촉하지 않아요. 멈춤도 성공이에요.', ex: '오늘은 걷기만 해도 충분해요.' },
  { t: '숫자는 정확하게, 말은 짧게', b: '거리는 m 단위로, 한 문장에 한 가지만. 사실과 가설을 섞지 않아요.', ex: '지난번엔 4m에서 편안했어요.' },
]
const DODONT = [
  { s: '이웃 제안', no: '우리 친구 할래? 지금 바로 만나 보세요!', yes: '두부와 15m에서 나란히 걸어 볼까요?' },
  { s: '근처 알림', no: '근처에 산책 친구 3명! 놓치지 마세요', yes: '같은 시간에 걷는 이웃이 있어요. 준비되면 요청해 주세요.' },
  { s: '중간에 멈췄을 때', no: '산책을 완료하지 못했어요.', yes: '여기서 멈춘 것도 성공이에요. 다음엔 8m부터 시작해요.' },
  { s: '예민한 개 설명', no: '공격성이 있는 개예요. 주의!', yes: '자전거를 만나면 긴장해요. 조금 떨어져 지나가 주세요.' },
  { s: '낯선 사람에게', no: '만지지 마세요!', yes: '냄새 먼저, 손은 나중에.' },
  { s: '권한·오류', no: '위치 권한 오류가 발생했습니다.', yes: '위치를 쓰지 않아도 괜찮아요. 동네 이름만 골라 주세요.' },
]

function Voice() {
  return (
    <Section id="voice">
      <Head n={3} id="voice" title="보이스 & 톤" lede="차분한 이웃의 목소리. 존댓말 ‘-요’로 끝내고, 느낌표와 이모지는 쓰지 않아요." />
      <ol className="bd-voice">
        {VOICE.map((v, i) => (
          <li key={v.t}>
            <span className="bd-voice__n num" aria-hidden="true">{i + 1}</span>
            <h3>{v.t}</h3>
            <p>{v.b}</p>
            <p className="bd-voice__ex">“{v.ex}”</p>
          </li>
        ))}
      </ol>
      <h3 className="bd-sub">이렇게 써요 / 쓰지 않아요</h3>
      <div className="bd-dd" role="table" aria-label="문장 예시: 쓰지 않는 문장과 쓰는 문장">
        <div className="bd-dd__row bd-dd__row--head" role="row">
          <span role="columnheader">상황</span><span role="columnheader">쓰지 않아요</span><span role="columnheader">이렇게 써요</span>
        </div>
        {DODONT.map((d) => (
          <div className="bd-dd__row" role="row" key={d.s}>
            <span role="rowheader" className="bd-dd__s">{d.s}</span>
            <span role="cell" className="bd-dd__no"><b className="bd-dd__lab">✕ 쓰지 않아요</b><s>{d.no}</s></span>
            <span role="cell" className="bd-dd__yes"><b className="bd-dd__lab">○ 이렇게 써요</b>{d.yes}</span>
          </div>
        ))}
      </div>
      <div className="bd-words">
        <div><h3 className="bd-sub">자주 쓰는 말</h3><p className="bd-chips">{['나란히', '거리', '편한 거리', '천천히', '순서', '한 걸음씩', '멈춤도 성공', '댕큐'].map((w) => <span key={w} className="bd-chip">{w}</span>)}</p></div>
        <div><h3 className="bd-sub">피하는 말</h3><p className="bd-chips">{['매칭', '친구 찾기', '궁합', '공격적', '문제견', '실패', '지금 바로', '놓치지 마세요'].map((w) => <span key={w} className="bd-chip bd-chip--no">{w}</span>)}</p></div>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------------ 04 */
function Construction() {
  const k = 10, ox = 120, oy = 90
  const X = (u: number) => ox + u * k, Y = (u: number) => oy + u * k
  const dim = MOSS
  return (
    <svg className="bd-construct" viewBox="-24 0 784 550" role="img" aria-label="마크 구성도: 48×36 단위 격자 위에 두 선과 두 점. 선 굵기 6, 아래 선은 점 하나(10단위)만큼 늦게 출발, 두 선 간격 18.">
      <g stroke="#3A4740" strokeWidth="1">
        {Array.from({ length: 17 }, (_, i) => <line key={`v${i}`} x1={X(i * 3)} x2={X(i * 3)} y1={Y(0)} y2={Y(36)} />)}
        {Array.from({ length: 13 }, (_, i) => <line key={`h${i}`} x1={X(0)} x2={X(48)} y1={Y(i * 3)} y2={Y(i * 3)} />)}
      </g>
      <line x1={X(3)} y1={Y(9)} x2={X(33)} y2={Y(9)} stroke={PAPER} strokeWidth={6 * k} strokeLinecap="round" />
      <line x1={X(13)} y1={Y(27)} x2={X(33)} y2={Y(27)} stroke={SIGNAL} strokeWidth={6 * k} strokeLinecap="round" />
      <circle cx={X(42)} cy={Y(9)} r={5 * k} fill={PAPER} />
      <circle cx={X(42)} cy={Y(27)} r={5 * k} fill={SIGNAL} />
      <g stroke={dim} strokeWidth="2" fill="none">
        <line x1={X(3)} x2={X(13)} y1={Y(36) + 30} y2={Y(36) + 30} /><line x1={X(3)} x2={X(3)} y1={Y(36) + 22} y2={Y(36) + 38} /><line x1={X(13)} x2={X(13)} y1={Y(36) + 22} y2={Y(36) + 38} />
        <line x1={X(48) + 30} x2={X(48) + 30} y1={Y(9)} y2={Y(27)} /><line x1={X(48) + 22} x2={X(48) + 38} y1={Y(9)} y2={Y(9)} /><line x1={X(48) + 22} x2={X(48) + 38} y1={Y(27)} y2={Y(27)} />
        <line x1={X(0) - 30} x2={X(0) - 30} y1={Y(6)} y2={Y(12)} /><line x1={X(0) - 38} x2={X(0) - 22} y1={Y(6)} y2={Y(6)} /><line x1={X(0) - 38} x2={X(0) - 22} y1={Y(12)} y2={Y(12)} />
      </g>
      <g fill={dim} className="bd-construct__t">
        <text x={X(3)} y={Y(36) + 66}>늦은 출발 10 = 점 하나</text>
        <text x={X(48) + 44} y={Y(18) + 6}>간격 18</text>
        <text x={X(0) - 44} y={Y(9) + 6} textAnchor="end">굵기 6</text>
        <text x={X(37)} y={Y(0) - 16}>점 지름 10 = 개</text>
      </g>
    </svg>
  )
}

const MISUSE: { t: string; bg: string; svg: ReactNode }[] = [
  { t: '두 선을 교차시키지 않아요. 만남은 교차가 아니라 수렴이에요.', bg: PAPER, svg: <><line x1="3" y1="9" x2="33" y2="27" stroke={INK} strokeWidth="6" strokeLinecap="round" /><line x1="13" y1="27" x2="33" y2="9" stroke={SIGNAL} strokeWidth="6" strokeLinecap="round" /><circle cx="42" cy="27" r="5" fill={INK} /><circle cx="42" cy="9" r="5" fill={SIGNAL} /></> },
  { t: '아래(상대) 선이 먼저 출발하지 않아요.', bg: PAPER, svg: <><line x1="13" y1="9" x2="33" y2="9" stroke={INK} strokeWidth="6" strokeLinecap="round" /><line x1="3" y1="27" x2="33" y2="27" stroke={SIGNAL} strokeWidth="6" strokeLinecap="round" /><circle cx="42" cy="9" r="5" fill={INK} /><circle cx="42" cy="27" r="5" fill={SIGNAL} /></> },
  { t: '점을 하트·발바닥으로 바꾸지 않아요. 점이 곧 개예요.', bg: PAPER, svg: <><line x1="3" y1="9" x2="33" y2="9" stroke={INK} strokeWidth="6" strokeLinecap="round" /><line x1="13" y1="27" x2="33" y2="27" stroke={SIGNAL} strokeWidth="6" strokeLinecap="round" /><path d="M42 14 C36 10 37 4 42 7 C47 4 48 10 42 14 Z" fill={INK} /><path d="M42 32 C36 28 37 22 42 25 C47 22 48 28 42 32 Z" fill={SIGNAL} /></> },
  { t: '시그널 바탕에 시그널 선을 두지 않아요. 잉크 한 색으로 바꿔요.', bg: SIGNAL, svg: <><line x1="3" y1="9" x2="33" y2="9" stroke={INK} strokeWidth="6" strokeLinecap="round" /><line x1="13" y1="27" x2="33" y2="27" stroke={SIGNAL} strokeWidth="6" strokeLinecap="round" /><circle cx="42" cy="9" r="5" fill={INK} /><circle cx="42" cy="27" r="5" fill={SIGNAL} /></> },
  { t: '늘이거나 기울이지 않아요.', bg: PAPER, svg: <g transform="translate(6 4) skewX(-18) scale(1.12 .8)"><line x1="3" y1="9" x2="33" y2="9" stroke={INK} strokeWidth="6" strokeLinecap="round" /><line x1="13" y1="27" x2="33" y2="27" stroke={SIGNAL} strokeWidth="6" strokeLinecap="round" /><circle cx="42" cy="9" r="5" fill={INK} /><circle cx="42" cy="27" r="5" fill={SIGNAL} /></g> },
  { t: '선의 역할 색을 바꾸지 않아요. 아래 선은 늘 시그널이에요.', bg: PAPER, svg: <><line x1="3" y1="9" x2="33" y2="9" stroke={SIGNAL} strokeWidth="6" strokeLinecap="round" /><line x1="13" y1="27" x2="33" y2="27" stroke="#1F6B45" strokeWidth="6" strokeLinecap="round" /><circle cx="42" cy="9" r="5" fill={SIGNAL} /><circle cx="42" cy="27" r="5" fill="#1F6B45" /></> },
]

function LogoSection() {
  return (
    <Section id="logo" tone="ink">
      <Head n={4} id="logo" title="로고" lede="나란히 마크: 같은 방향으로 걷는 두 선. 서비스의 관점이 곧 로고예요." />
      <div className="bd-logo-hero">
        <Construction />
        <ul className="bd-meaning">
          <li><b>위 선 = 우리 개의 길.</b> 바탕에 따라 페이퍼 또는 잉크.</li>
          <li><b>아래 시그널 선 = 상대 개.</b> 점 하나만큼 늦게 출발해요. 먼저 다가가지 않고 기다린다는 뜻이에요.</li>
          <li><b>두 점 = 두 마리 개.</b> 같은 세로선 위에 나란히 서요.</li>
          <li><b>선은 끝까지 만나지 않아요.</b> 가까워질 뿐 부딪히지 않아요.</li>
          <li><b>워드마크</b>는 Pretendard Black, 자간 -0.05em. 파일에서는 윤곽선으로 바꿔 써요.</li>
        </ul>
      </div>

      <div className="bd-cols2">
        <figure className="bd-fig">
          <div className="bd-clear" aria-hidden="true"><span className="bd-clear__box"><Logo tone="paper" size={44} /></span></div>
          <figcaption><b>여백</b>: 사방으로 점 지름 하나(마크 너비의 10/48) 이상 비워요. 로고 파일에는 이 여백이 들어 있어요.</figcaption>
        </figure>
        <figure className="bd-fig">
          <div className="bd-min" aria-hidden="true">
            <span><Mark tone="paper" size={20} /><small className="num">20px</small></span>
            <span><Mark tone="paper" size={32} /><small className="num">32px</small></span>
            <span><Logo tone="paper" size={16} /><small className="num">글자 16px</small></span>
          </div>
          <figcaption><b>최소 크기</b>: 마크 너비 20px, 가로 로고는 글자 크기 16px(너비 약 56px)부터. 이보다 작으면 마크만 써요.</figcaption>
        </figure>
      </div>

      <h3 className="bd-sub">바탕별 색 조합</h3>
      <ul className="bd-variants">
        <li className="bd-variant" style={{ background: INK, color: PAPER, boxShadow: 'inset 0 0 0 1.5px #3A4740' }}><Logo tone="paper" size={36} /><span>잉크 바탕 · 기본</span></li>
        <li className="bd-variant" style={{ background: PAPER, color: INK }}><Logo tone="ink" size={36} /><span>페이퍼 바탕</span></li>
        <li className="bd-variant" style={{ background: SIGNAL, color: INK }}><span className="logo logo--ink" style={{ fontSize: 36 }}><MarkSvg a={INK} b={INK} size={43} /><span>댕큐</span></span><span>시그널 바탕 · 잉크 단색</span></li>
        <li className="bd-variant" style={{ background: '#E8E3D7', color: INK }}><span className="logo logo--ink" style={{ fontSize: 36 }}><MarkSvg a={INK} b={INK} size={43} /><span>댕큐</span></span><span>1도 인쇄 · 잉크 단색</span></li>
      </ul>

      <h3 className="bd-sub">하지 않아요</h3>
      <ul className="bd-misuse">
        {MISUSE.map((m) => (
          <li key={m.t}>
            <div className="bd-misuse__art" style={{ background: m.bg }}><svg viewBox="-2 -4 54 44" width="120" height="98" aria-hidden="true">{m.svg}</svg></div>
            <p><b className="bd-no">✕ 하지 않아요</b> {m.t}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ------------------------------------------------------------------ 05 */
const SWATCH_CORE = [
  { n: 'ink', hex: '#15201A', role: '길', d: '브랜드 순간의 바탕, 페이퍼 위 본문 글자', fg: PAPER },
  { n: 'paper', hex: '#F4F1EA', role: '낮', d: '제품 기본 바탕', fg: INK },
  { n: 'signal', hex: '#FF6A2B', role: '상대·주의', d: '면 채움 또는 잉크 위 글자. 위에는 잉크 글자만', fg: INK },
  { n: 'moss', hex: '#9FD3B2', role: '편안·가까워짐', d: '잉크 위에서만 글자로', fg: INK },
]
const SWATCH_SUPPORT = [
  { n: 'signal-ink', hex: '#B83A0A', d: '페이퍼 위 시그널 글자', fg: PAPER },
  { n: 'moss-ink', hex: '#1F6B45', d: '페이퍼 위 모스 글자 · 상태 편안', fg: PAPER },
  { n: 'muted', hex: '#58625C', d: '페이퍼 위 보조 글자', fg: PAPER },
  { n: 'muted-on-ink', hex: '#A9B3AD', d: '잉크 위 보조 글자', fg: INK },
  { n: 'ink-2', hex: '#24302A', d: '잉크 위 올린 면', fg: PAPER },
  { n: 'ink-3', hex: '#3A4740', d: '잉크 위 선 전용', fg: PAPER },
  { n: 'paper-2', hex: '#E8E3D7', d: '페이퍼 위 가라앉은 면', fg: INK },
  { n: 'paper-3', hex: '#D6CFBF', d: '페이퍼 위 선 전용', fg: INK },
]
const CONTRAST: { fg: string; bg: string; f: string; b: string; r: number; v: 'ok' | 'edge' | 'no' }[] = [
  { fg: 'paper', bg: 'ink', f: PAPER, b: INK, r: 14.85, v: 'ok' },
  { fg: 'signal', bg: 'ink', f: SIGNAL, b: INK, r: 5.86, v: 'ok' },
  { fg: 'moss', bg: 'ink', f: MOSS, b: INK, r: 9.92, v: 'ok' },
  { fg: 'muted-on-ink', bg: 'ink', f: '#A9B3AD', b: INK, r: 7.77, v: 'ok' },
  { fg: 'signal', bg: 'ink-2', f: SIGNAL, b: '#24302A', r: 4.80, v: 'ok' },
  { fg: 'ink', bg: 'signal', f: INK, b: SIGNAL, r: 5.86, v: 'ok' },
  { fg: 'ink', bg: 'paper', f: INK, b: PAPER, r: 14.85, v: 'ok' },
  { fg: 'signal-ink', bg: 'paper', f: '#B83A0A', b: PAPER, r: 5.10, v: 'ok' },
  { fg: 'moss-ink', bg: 'paper', f: '#1F6B45', b: PAPER, r: 5.73, v: 'ok' },
  { fg: 'muted', bg: 'paper', f: '#58625C', b: PAPER, r: 5.61, v: 'ok' },
  { fg: 'state-alert', bg: 'paper', f: '#8A5A00', b: PAPER, r: 5.25, v: 'ok' },
  { fg: 'state-react', bg: 'paper', f: '#B3261E', b: PAPER, r: 5.79, v: 'ok' },
  { fg: 'signal-ink', bg: 'paper-2', f: '#B83A0A', b: '#E8E3D7', r: 4.49, v: 'edge' },
  { fg: 'white', bg: 'signal', f: '#FFFFFF', b: SIGNAL, r: 2.86, v: 'no' },
  { fg: 'signal', bg: 'paper', f: SIGNAL, b: PAPER, r: 2.53, v: 'no' },
  { fg: 'moss', bg: 'paper', f: MOSS, b: PAPER, r: 1.50, v: 'no' },
]
const VERDICT = { ok: 'AA 통과', edge: '본문 미달 · 큰 글자만', no: '글자 금지' }

function ColorSection() {
  return (
    <Section id="color">
      <Head n={5} id="color" title="색" lede="색은 장식이 아니라 역할이에요. 강한 색원은 한 화면에 하나, 시그널뿐이에요." />
      <ul className="bd-core">
        {SWATCH_CORE.map((s) => (
          <li key={s.n} className="bd-core__sw" style={{ background: s.hex, color: s.fg }}>
            <span className="bd-core__role">{s.role}</span>
            <span className="bd-core__meta"><b>{s.n}</b><span className="num">{s.hex}</span></span>
            <span className="bd-core__d">{s.d}</span>
          </li>
        ))}
      </ul>
      <div className="bd-ratio" role="img" aria-label="브랜드 순간의 색 비율 가이드: 잉크 55, 페이퍼 30, 시그널 10, 모스 5">
        <span style={{ flex: 55, background: INK }} /><span style={{ flex: 30, background: PAPER, boxShadow: 'inset 0 0 0 1.5px #D6CFBF' }} /><span style={{ flex: 10, background: SIGNAL }} /><span style={{ flex: 5, background: MOSS }} />
      </div>
      <p className="bd-note">브랜드 순간(포스터·키 비주얼)의 비율 가이드 <span className="num">55 : 30 : 10 : 5</span>. 제품 화면은 페이퍼가 주인공이고 시그널은 한 곳에만 써요.</p>

      <ul className="bd-support">
        {SWATCH_SUPPORT.map((s) => (
          <li key={s.n}><span className="bd-support__chip" style={{ background: s.hex, color: s.fg }}>Aa</span><span><b>{s.n}</b> <span className="num bd-hex">{s.hex}</span><br />{s.d}</span></li>
        ))}
      </ul>

      <h3 className="bd-sub">상태 색 — 늘 글자 라벨과 함께</h3>
      <ul className="bd-states">
        {([['calm', '#1F6B45'], ['alert', '#8A5A00'], ['react', '#B3261E']] as [Reaction, string][]).map(([k, c]) => (
          <li key={k} style={{ borderColor: c }}><span className="bd-states__dot" style={{ background: c }} aria-hidden="true" /><b style={{ color: c }}>{REACTION_LABEL[k]}</b><span className="num bd-hex">{c}</span></li>
        ))}
      </ul>

      <h3 className="bd-sub">대비 (WCAG 2.x, 직접 계산)</h3>
      <div className="bd-table-wrap" tabIndex={0} role="region" aria-label="대비 표, 좌우로 스크롤할 수 있어요">
        <table className="bd-contrast">
          <thead><tr><th scope="col">예시</th><th scope="col">글자 / 바탕</th><th scope="col">대비</th><th scope="col">판정</th></tr></thead>
          <tbody>
            {CONTRAST.map((c) => (
              <tr key={c.fg + c.bg}>
                <td><span className="bd-contrast__ex" style={{ background: c.b, color: c.f }}>가 8m</span></td>
                <td><code>{c.fg}</code> / <code>{c.bg}</code></td>
                <td className="num"><b>{c.r.toFixed(2)}</b>:1</td>
                <td><span className={`bd-verdict bd-verdict--${c.v}`}>{VERDICT[c.v]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="bd-rules">
        <li><b>시그널 위에는 잉크 글자만.</b> 흰 글자(2.86:1)와 페이퍼 글자(2.53:1)는 쓰지 않아요.</li>
        <li><b>페이퍼 위 강조 글자</b>는 signal-ink, moss-ink로 바꿔요. 원래 시그널·모스는 면과 선에만 써요.</li>
        <li><b>상태 색은 혼자 뜻을 전하지 않아요.</b> ‘편안했어요’ 같은 글자 라벨을 늘 붙여요.</li>
        <li><b>ink-3, paper-3</b>은 선 전용이에요. 글자에 쓰지 않아요.</li>
      </ul>
    </Section>
  )
}

/* ------------------------------------------------------------------ 06 */
const SCALE = [
  { k: 'display', v: 'clamp(56–168px)', w: 880, t: '-0.055em', s: '15m', cls: 'bd-ts--display' },
  { k: 'h1', v: 'clamp(34–64px)', w: 800, t: '-0.045em', s: '가까워지는 데는 순서가 있어요.', cls: 'bd-ts--h1' },
  { k: 'h2', v: 'clamp(26–40px)', w: 800, t: '-0.03em', s: '거리를 말하고, 지키고, 기억해요.', cls: 'bd-ts--h2' },
  { k: 'h3', v: '21px', w: 800, t: '-0.03em', s: '나란히 첫 산책', cls: 'bd-ts--h3' },
  { k: 'body', v: '17px / 1.6', w: 400, t: '0', s: '마주 보지 않고 같은 쪽으로 걸어요. 서로를 알아채기만 해도 충분해요.', cls: 'bd-ts--body' },
  { k: 'small', v: '14px', w: 600, t: '0', s: '체험 모드예요. 입력한 내용은 이 브라우저에만 저장돼요.', cls: 'bd-ts--small' },
  { k: 'eyebrow', v: '14px', w: 800, t: '+0.04em', s: '동네 산책을 위한 거리 약속', cls: 'bd-ts--eyebrow' },
]

function TypeSection() {
  return (
    <Section id="type" tone="paper2">
      <Head n={6} id="type" title="타이포그래피" lede="한 가지 서체, Pretendard Variable. 숫자가 주인공이라 거리는 늘 가장 큰 글자예요." />
      <div className="bd-typehero">
        <p className="bd-typehero__name">Pretendard Variable</p>
        <ul className="bd-weights">
          {[400, 600, 700, 800, 880].map((w) => <li key={w} style={{ fontWeight: w }}><span>나란히</span><small className="num">{w}</small></li>)}
        </ul>
        <p className="bd-note">SIL Open Font License 1.1 · npm <code>pretendard</code> 패키지로 번들, 동적 서브셋으로 필요한 글자만 불러와요.</p>
      </div>
      <div className="bd-table-wrap" tabIndex={0} role="region" aria-label="글자 크기 체계 표, 좌우로 스크롤할 수 있어요">
        <table className="bd-scale">
          <thead><tr><th scope="col">토큰</th><th scope="col">크기</th><th scope="col">굵기</th><th scope="col">자간</th><th scope="col">예시</th></tr></thead>
          <tbody>
            {SCALE.map((s) => (
              <tr key={s.k}><th scope="row"><code>{s.k}</code></th><td className="num">{s.v}</td><td className="num">{s.w}</td><td className="num">{s.t}</td><td><span className={`bd-ts ${s.cls}`}>{s.s}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bd-cols2 bd-nums">
        <figure className="bd-fig bd-fig--paper">
          <div className="bd-numcols">
            <div><p className="bd-numcols__h">tabular-nums · 써요</p><p className="bd-numcol bd-numcol--tab">11m<br />18m<br />14m<br />10m</p></div>
            <div><p className="bd-numcols__h">기본 숫자 · 거리엔 안 써요</p><p className="bd-numcol bd-numcol--prop">11m<br />18m<br />14m<br />10m</p></div>
          </div>
          <figcaption>거리·날짜·퍼센트는 <code>font-variant-numeric: tabular-nums</code>. 숫자가 바뀌어도 자리가 흔들리지 않아요.</figcaption>
        </figure>
        <ul className="bd-rules bd-rules--tight">
          <li><b>자간</b>: 제목 -0.03em, 큰 숫자·디스플레이 -0.045 ~ -0.055em, 본문 0, 눈썹 글자 +0.04em.</li>
          <li><b>줄 간격</b>: 디스플레이 1.02, 제목 1.12–1.15, 본문 1.6.</li>
          <li><b>줄바꿈</b>: <code>word-break: keep-all</code>. 단어 중간에서 끊지 않아요.</li>
          <li><b>단위</b>: 숫자와 붙여 써요. <span className="num">8m</span> (○) · 8 m (✕) · 8미터(읽기 전용 라벨에서만).</li>
          <li><b>굵기</b>: 본문 강조 600–700, 버튼 700, 제목 800, 숫자·디스플레이 850–880.</li>
        </ul>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------------ 07 */
const SPACE = [['s1', 4], ['s2', 8], ['s3', 12], ['s4', 16], ['s5', 24], ['s6', 32], ['s7', 48], ['s8', 64], ['s9', 96], ['s10', 144]] as const

function GridSection() {
  return (
    <Section id="grid">
      <Head n={7} id="grid" title="그리드 & 간격" lede="4pt 체계. 모든 간격은 4의 배수이고, 섹션 사이는 넉넉하게 144px까지 벌려요." />
      <div className="bd-cols2">
        <ul className="bd-space" aria-label="간격 토큰">
          {SPACE.map(([k, v]) => (
            <li key={k}><code>--{k}</code><span className="bd-space__bar" style={{ width: v }} aria-hidden="true" /><span className="num">{v}px</span></li>
          ))}
        </ul>
        <div className="bd-gridinfo">
          <div className="bd-12" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => <span key={i} />)}
            <b style={{ gridColumn: 'span 4' }}>4</b><b style={{ gridColumn: 'span 8' }}>8 · 히어로</b>
            <b style={{ gridColumn: 'span 5' }}>5</b><b style={{ gridColumn: 'span 7' }}>7 · 기능 설명</b>
            <b style={{ gridColumn: 'span 6' }}>6</b><b style={{ gridColumn: 'span 6' }}>6 · 원칙 목록</b>
          </div>
          <dl className="bd-dl">
            <div><dt>최대 너비</dt><dd className="num">1200px</dd></div>
            <div><dt>좌우 여백</dt><dd className="num">clamp(16px, 4vw, 48px)</dd></div>
            <div><dt>열</dt><dd>12열, 넓은 화면 4/8 · 5/7 · 6/6, 860px 아래로는 1열</dd></div>
            <div><dt>터치 영역</dt><dd className="num">48px (최소 44px)</dd></div>
          </dl>
          <ul className="bd-radii" aria-label="모서리 반경">
            {[['r-s', 8], ['r-m', 14], ['r-l', 24], ['r-pill', 999]].map(([k, v]) => (
              <li key={k}><span style={{ borderRadius: Number(v) }} aria-hidden="true" /><code>{k}</code> <span className="num">{v === 999 ? 'pill' : `${v}px`}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------------ 08 */
const ICONS = [
  { n: '카드', d: '카드 한 장 안의 두 줄: 카드에 적힌 거리와 부탁.' },
  { n: '산책', d: '한 선과 점 하나: 혼자 걷는 길, 앞은 점선.' },
  { n: '나란히', d: '마크 그대로: 늦게 출발한 두 번째 선.' },
  { n: '사이', d: '점점 짧아지는 세 선: 좁혀진 거리.' },
]

function IconSection() {
  return (
    <Section id="icons" tone="paper2">
      <Head n={8} id="icons" title="아이콘" lede="아이콘도 두 선의 어휘로 그려요. 선과 점, 둘뿐이에요." />
      <ul className="bd-icons">
        {ICONS.map((i) => (
          <li key={i.n}>
            <span className="bd-icons__big"><TabIcon name={i.n} scale={3} /></span>
            <b>{i.n}</b>
            <p>{i.d}</p>
          </li>
        ))}
      </ul>
      <div className="bd-cols2">
        <div className="bd-tabbar" aria-hidden="true">
          {ICONS.map((i, k) => <span key={i.n} className={k === 2 ? 'is-on' : ''}><TabIcon name={i.n} /><small>{i.n}</small></span>)}
        </div>
        <ul className="bd-rules bd-rules--tight">
          <li><b>격자</b> 26×20, 선 굵기 2.4, 둥근 끝.</li>
          <li><b>채움 없음.</b> 점(개)만 채워요.</li>
          <li><b>색</b>은 <code>currentColor</code>. 선택된 탭은 글자 라벨과 굵기로도 구분해요.</li>
          <li><b>발바닥·뼈다귀·하트 아이콘은 쓰지 않아요.</b></li>
        </ul>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------------ 09 */
const POSTURE: { s: Reaction; t: string; d: string }[] = [
  { s: 'calm', t: '편안', d: '귀는 내려오고 꼬리는 수평. 머리는 제자리.' },
  { s: 'alert', t: '긴장', d: '귀가 서고 꼬리가 올라가요. 머리가 들려요.' },
  { s: 'react', t: '반응', d: '귀가 뒤로 젖혀지고 꼬리가 말려 들어가요. 몸이 뒤로 빠지고 낮아져요.' },
]

function IllustSection() {
  return (
    <Section id="illust" tone="ink">
      <Head n={9} id="illust" title="일러스트" lede="기하 도형으로 그린 개. 감정은 얼굴이 아니라 자세로 말해요." />
      <div className="bd-dogs">
        {POSTURE.map((p) => (
          <figure key={p.s} className="bd-dogs__item">
            <svg viewBox="-70 -62 150 100" role="img" aria-label={`${p.t} 자세의 개`}>
              <line x1="-66" y1="28" x2="76" y2="28" stroke="#3A4740" strokeWidth="3" strokeLinecap="round" />
              <g transform="translate(0 2)"><Dog state={p.s} color={p.s === 'calm' ? PAPER : SIGNAL} detail={INK} /></g>
            </svg>
            <figcaption><b>{p.t}</b> <span className="bd-dogs__lab">라벨: {REACTION_LABEL[p.s]}</span><br />{p.d}</figcaption>
          </figure>
        ))}
      </div>
      <div className="bd-cols2">
        <ul className="bd-rules bd-rules--ink">
          <li><b>구성</b>: 몸통 캡슐 62×26, 머리 원 r14, 주둥이, 다리 네 개의 선. 움직이는 건 귀·꼬리·머리 높이뿐이에요.</li>
          <li><b>색</b>: 우리 개는 페이퍼(잉크 바탕)나 잉크(페이퍼 바탕), 상대 개는 늘 시그널.</li>
          <li><b>견종을 특정하지 않아요.</b> 어떤 개든 자기 개로 볼 수 있게.</li>
        </ul>
        <ul className="bd-rules bd-rules--ink">
          <li><b>얼굴 표정 없음</b>: 눈썹·입 모양으로 감정을 과장하지 않아요.</li>
          <li><b>발바닥 무늬 없음</b>, <b>사진·실사 없음</b>, 스톡·AI 생성 이미지 없음.</li>
          <li><b>상태는 늘 글자와 함께</b>: 자세만으로 판단하게 두지 않아요.</li>
        </ul>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------------ 10 */
const STEPS = [15, 8, 4, 2]

function Curve({ c, label }: { c: [number, number, number, number]; label: string }) {
  const [x1, y1, x2, y2] = c
  return (
    <svg viewBox="-6 -6 112 112" className="bd-curve" role="img" aria-label={`이징 곡선 ${label}`}>
      <rect x="0" y="0" width="100" height="100" fill="none" stroke="currentColor" strokeOpacity=".2" />
      <path d={`M0 100 C ${x1 * 100} ${100 - y1 * 100}, ${x2 * 100} ${100 - y2 * 100}, 100 0`} fill="none" stroke={SIGNAL} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function MotionSection() {
  const [i, setI] = useState(0)
  const d = STEPS[i]
  return (
    <Section id="motion">
      <Head n={10} id="motion" title="모션 & 소리" lede="움직임은 세 가지 원칙만 따라요. 소리는 쓰지 않아요." />
      <ol className="bd-mprin">
        <li><span className="num">01</span><h3>나란히</h3><p>함께 움직이는 요소는 같은 시간, 같은 이징으로. 한쪽만 튀어나오지 않아요.</p></li>
        <li><span className="num">02</span><h3>순서</h3><p>단계 전환은 한 번에 한 단계씩 <code>--ease-step</code>으로. 건너뛰지 않아요.</p></li>
        <li><span className="num">03</span><h3>되돌릴 수 있음</h3><p>가까워지는 움직임은 멀어지는 방향으로도 같은 속도로 되돌아가요. 뒤로 가는 것도 순서의 일부예요.</p></li>
      </ol>
      <div className="bd-mdemo">
        <div className="bd-mdemo__stage"><Lanes distance={d} me={{ name: '뽀리', state: 'calm' }} them={{ name: '두부', state: 'calm' }} theme="paper" height={300} walking /></div>
        <div className="bd-mdemo__ctl">
          <p className="bd-mdemo__num num" aria-live="polite"><span className="sr-only">지금 거리 </span>{d}m</p>
          <div className="bd-mdemo__btns">
            <button type="button" className="btn btn-ink" onClick={() => setI((v) => Math.min(v + 1, STEPS.length - 1))} disabled={i === STEPS.length - 1}>한 단계 가까이</button>
            <button type="button" className="btn btn-ghost" onClick={() => setI((v) => Math.max(v - 1, 0))} disabled={i === 0}>한 단계 멀리</button>
          </div>
          <p className="bd-note">직접 눌러 보세요. 선 간격과 숫자가 <span className="num">420ms</span> 동안 함께 움직여요. ‘동작 줄이기’ 설정에서는 즉시 바뀌고 다리도 멈춰요.</p>
        </div>
      </div>
      <div className="bd-cols2">
        <div className="bd-table-wrap">
          <table className="bd-scale bd-scale--fit">
            <thead><tr><th scope="col">토큰</th><th scope="col">값</th><th scope="col">쓰는 곳</th></tr></thead>
            <tbody>
              <tr><th scope="row"><code>--t-fast</code></th><td className="num">160ms</td><td>버튼·칩 피드백</td></tr>
              <tr><th scope="row"><code>--t-base</code></th><td className="num">260ms</td><td>자세 변화, 상태 테두리</td></tr>
              <tr><th scope="row"><code>--t-slow</code></th><td className="num">520ms</td><td>화면 등장, 결과 표시</td></tr>
              <tr><th scope="row"><code>useTween</code></th><td className="num">420ms</td><td>거리 숫자·선 간격</td></tr>
            </tbody>
          </table>
        </div>
        <div className="bd-curves">
          <figure><Curve c={[0.2, 0.7, 0.2, 1]} label="ease" /><figcaption><code>--ease</code><br /><span className="num">cubic-bezier(.2,.7,.2,1)</span><br />나란히 · 등장</figcaption></figure>
          <figure><Curve c={[0.65, 0, 0.35, 1]} label="ease-step" /><figcaption><code>--ease-step</code><br /><span className="num">cubic-bezier(.65,0,.35,1)</span><br />순서 · 단계 전환</figcaption></figure>
        </div>
      </div>
      <div className="bd-cols2 bd-mfoot">
        <div>
          <h3 className="bd-sub">동작 줄이기 (prefers-reduced-motion)</h3>
          <ul className="bd-rules bd-rules--tight">
            <li>모든 duration 토큰이 <span className="num">0ms</span>이 돼요.</li>
            <li>걷는 다리·점선 흐름 같은 반복 애니메이션은 멈춰요.</li>
            <li>숫자는 세지 않고 바로 바뀌어요. 정보는 하나도 줄지 않아요.</li>
          </ul>
        </div>
        <div className="bd-sound">
          <p className="bd-sound__k">소리</p>
          <p className="bd-sound__v">사용하지 않음</p>
          <p>댕큐는 밖에서, 다른 사람과 개가 가까이 있을 때 쓰는 도구예요. 알림음이 우리 개나 지나가는 개를 놀라게 해서는 안 돼요. 알림은 화면의 글자와 색(라벨 포함)으로만 전해요.</p>
        </div>
      </div>
    </Section>
  )
}

/* ------------------------------------------------------------------ 11 */
type Shot = { f: string; w: number; h: number; t: string; how: 'code' | 'mock'; alt: string; wide?: boolean }
const SHOTS: Shot[] = [
  { f: 'kv-1920x1080.png', w: 1920, h: 1080, wide: true, how: 'code', t: '키 비주얼 · 1920×1080', alt: '잉크 바탕에 “가까워지는 데는 순서가 있어요.” 제목. 시그널 선이 15m, 8m, 4m, 2m 네 계단으로 페이퍼 선에 가까워지고, 끝에서 두 마리 개가 나란히 걸어요.' },
  { f: 'kv-1080x1350.png', w: 1080, h: 1350, how: 'code', t: '키 비주얼 · 1080×1350', alt: '세로형 키 비주얼. 계단처럼 좁혀지는 두 선 아래에 15m, 8m, 4m 숫자가 크게 놓이고 끝에 2m에서 나란히 걷는 두 개.' },
  { f: 'poster-a-ratio.png', w: 1240, h: 1754, how: 'code', t: '동네 게시판 포스터 · A 비율', alt: '페이퍼 바탕 포스터. “만지기 전에 물어봐 주세요.” 제목, 잉크 개와 멀리서 다가와 나란히 멈추는 시그널 선, 세 가지 부탁, 하단 시그널 띠에 “거리를 지켜 줘서, 댕큐.”' },
  { f: 'tag-bandana-mockup.png', w: 1600, h: 1200, how: 'mock', t: '반다나 · 리드줄 태그', alt: '시그널 반다나에 “인사 없이 지나가 주세요”, 모스·페이퍼·시그널 세 가지 리드줄 태그에 인사 방식 문장과 편한 거리 적는 칸.' },
  { f: 'insta-1-problem.png', w: 1080, h: 1350, how: 'code', t: '인스타그램 1/3 · 문제', alt: '89.4% 큰 숫자와 설명, 겁먹은 자세의 개를 향해 대각선으로 곧장 다가오는 시그널 선. “문제는 친구가 없어서가 아니라, 서로의 거리를 몰라서 생겨요.”' },
  { f: 'insta-2-idea.png', w: 1080, h: 1350, how: 'code', t: '인스타그램 2/3 · 아이디어', alt: '“마주 보지 말고, 나란히 걸어요.” 제목 아래 마크 모양의 두 선이 15m, 8m, 4m, 2m 순서로 점점 가까워지는 네 줄.' },
  { f: 'insta-3-product.png', w: 1080, h: 1350, how: 'code', t: '인스타그램 3/3 · 제품', alt: '시그널 바탕에 “말 대신 화면 한 장.” 제목과 뽀리의 산책 카드: 편한 거리 8m, 냄새 먼저 손은 나중에.' },
  { f: 'og-1200x630.png', w: 1200, h: 630, how: 'code', t: '공유 이미지(OG) · 1200×630', alt: '잉크 바탕에 로고, “가까워지는 데는 순서가 있어요.” 제목, 계단형 두 선과 나란히 걷는 두 개.' },
  { f: 'app-icon-1024.png', w: 1024, h: 1024, how: 'code', t: '앱 아이콘 · 1024', alt: '잉크 바탕 가운데에 페이퍼 선과 시그널 선, 두 점으로 된 나란히 마크.' },
]
const SAMPLE_CARD = {
  name: '뽀리', size: 'medium' as const, pace: 'slow' as const, greeting: 'slow' as const, comfort: 8,
  triggers: ['bike' as const, 'kids' as const], slots: ['evening' as const], note: '',
}

function Gallery() {
  return (
    <Section id="gallery" tone="ink">
      <Head n={11} id="gallery" title="응용 사례" lede="같은 기호, 같은 색, 같은 문장. 모든 이미지는 코드로 그리고 브라우저로 렌더링했어요." />
      <ul className="bd-gallery">
        {SHOTS.map((s) => (
          <li key={s.f} className={`bd-shot ${s.wide ? 'bd-shot--wide' : ''}`}>
            <figure>
              <a href={asset(s.f)} className="bd-shot__img" target="_blank" rel="noreferrer">
                <img src={asset(s.f)} width={s.w} height={s.h} alt={s.alt} loading="lazy" decoding="async" />
                <span className="sr-only">(원본 크기로 새 창에서 열기)</span>
              </a>
              <figcaption>
                <b>{s.t}</b>
                <span className={`bd-how bd-how--${s.how}`}>{s.how === 'code' ? '코드로 렌더링' : '컨셉 목업 · 코드로 그림'}</span>
              </figcaption>
            </figure>
          </li>
        ))}
        <li className="bd-shot">
          <figure>
            <div className="bd-shot__live"><CardFace card={SAMPLE_CARD} /></div>
            <figcaption><b>산책 카드 · 제품 화면 요소</b><span className="bd-how bd-how--live">실제 제품 컴포넌트(CardFace) 실시간 렌더링</span></figcaption>
          </figure>
        </li>
      </ul>
      <p className="bd-note bd-note--ink">렌더링 소스: <code>outputs/04_brand/render/build.mjs</code> → <code>outputs/04_brand/assets/</code>. 포스터·태그는 실제 캠페인이나 판매 제품이 아니에요.</p>
    </Section>
  )
}

/* ------------------------------------------------------------------ 12 */
const DOWNLOADS = [
  ['mark.svg', '마크 · 밝은 바탕'], ['mark-paper.svg', '마크 · 어두운 바탕'],
  ['logo-horizontal-ink.svg', '가로 로고 · 밝은 바탕'], ['logo-horizontal-paper.svg', '가로 로고 · 어두운 바탕'],
  ['app-icon-1024.png', '앱 아이콘 1024'], ['og-1200x630.png', 'OG 이미지'], ['kv-1920x1080.png', '키 비주얼 가로'], ['kv-1080x1350.png', '키 비주얼 세로'],
]

function Records() {
  return (
    <Section id="records">
      <Head n={12} id="records" title="기록" lede="어디서 왔는지 말할 수 없는 것은 쓰지 않아요." />
      <div className="bd-table-wrap" tabIndex={0} role="region" aria-label="자산 출처와 라이선스 표">
        <table className="bd-scale bd-records">
          <thead><tr><th scope="col">항목</th><th scope="col">출처</th><th scope="col">라이선스 · 상태</th></tr></thead>
          <tbody>
            <tr><th scope="row">서체</th><td>Pretendard Variable 1.3.9 (npm <code>pretendard</code>), 워드마크 윤곽선은 Pretendard Black</td><td>SIL OFL 1.1 — 번들·윤곽선 변환 허용</td></tr>
            <tr><th scope="row">로고·아이콘·개·선</th><td>코드로 직접 그림 (<code>components/Logo·Dog·Lanes</code>, <code>render/build.mjs</code>)</td><td>프로젝트 자체 제작</td></tr>
            <tr><th scope="row">키 비주얼·응용물</th><td>SVG + HTML → Chromium(Playwright) 렌더링</td><td>프로젝트 자체 제작</td></tr>
            <tr><th scope="row">사진</th><td>사용하지 않음</td><td>실존 인물·개 사진 없음</td></tr>
            <tr><th scope="row">기존 작업 캡처</th><td>케이스 스터디의 기존 팀 작업 메뉴 구조(Figma)</td><td>팀 공동 저작물 · 출처 미상 마스코트는 가림</td></tr>
            <tr><th scope="row">스톡 · AI 생성 이미지</th><td>사용하지 않음</td><td>—</td></tr>
            <tr><th scope="row">통계</th><td><code>outputs/01_research/sources.md</code> (S03·S05·S20·S25·S26·S71·S72)</td><td>보도 인용 수치는 원문 대조 전</td></tr>
            <tr><th scope="row">이름·상표</th><td>댕큐 / DANGQ</td><td>상표 가용성 미조사</td></tr>
            <tr><th scope="row">제휴·후기</th><td>없음</td><td>가짜 후기·파트너를 만들지 않아요</td></tr>
          </tbody>
        </table>
      </div>
      <h3 className="bd-sub">내려받기</h3>
      <ul className="bd-downloads">
        {DOWNLOADS.map(([f, t]) => <li key={f}><a href={asset(f)} download>{t}<span className="num">{f}</span></a></li>)}
      </ul>
      <p className="bd-note">토큰 원본: <code>app/src/styles/tokens.css</code> · 인계용: <code>outputs/04_brand/tokens.json</code>, <code>brand-guide.md</code> · 버전 1.0 (2026년 9월)</p>
    </Section>
  )
}

/* ------------------------------------------------------------------ page */
export default function Brand() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="bd">
        <section className="bd-hero" aria-labelledby="bd-title">
          <div className="wrap bd-hero__grid">
            <div>
              <p className="eyebrow eyebrow--moss">DANGQ 브랜드 가이드 · v1.0 · 2026년 9월</p>
              <h1 id="bd-title" className="bd-hero__title">두 선이<br />나란히 걷는<br />브랜드.</h1>
              <p className="bd-hero__lede">댕큐가 말하는 법, 그리는 법, 움직이는 법을 정해요. 로고부터 아이콘, 개, 모션까지 모든 것은 <b>같은 방향으로 걷는 두 선</b> 하나에서 나와요.</p>
            </div>
            <div className="bd-hero__mark" aria-hidden="true"><MarkSvg a={PAPER} b={SIGNAL} size={420} /></div>
          </div>
          <nav className="wrap bd-toc" aria-label="브랜드 가이드 목차">
            <ol>
              {TOC.map(([id, t], k) => (
                <li key={id}><a href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }); document.getElementById(`${id}-t`)?.focus({ preventScroll: true }) }}><span className="num">{String(k + 1).padStart(2, '0')}</span>{t}</a></li>
              ))}
            </ol>
          </nav>
        </section>
        <Positioning />
        <Message />
        <Voice />
        <LogoSection />
        <ColorSection />
        <TypeSection />
        <GridSection />
        <IconSection />
        <IllustSection />
        <MotionSection />
        <Gallery />
        <Records />
      </main>
      <SiteFooter />
    </>
  )
}
