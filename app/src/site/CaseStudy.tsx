import { Link } from 'react-router-dom'
import { SiteFooter, SiteHeader } from './SiteChrome'
import { Lanes } from '../components/Lanes'
import '../styles/case.css'

const DIRECTIONS = [
  { k: 'A', name: '산책 친구 매칭', problem: '같이 걸을 친구가 없다', solo: '없음', repeat: '찾으면 끝', verdict: '탈락', why: '혼자 쓸 때 가치가 없고, 반려견 소셜·산책 플랫폼의 실패 선례가 많음' },
  { k: 'B', name: '산책 성향 카드 + 기록', problem: '우리 개의 경계를 남이 모른다', solo: '있음', repeat: '매 산책 기록', verdict: '코어', why: '이미 있는 산책 습관 위에 올라가고, 한 명만 써도 가치가 생김' },
  { k: 'C', name: '조용한 길·시간 지도', problem: '반응성 견은 걸을 곳·때가 없다', solo: '있음', repeat: '경로 선택', verdict: '탈락', why: '실제 지도 데이터 없이는 설득이 어려움. 시간대 필드로만 흡수' },
  { k: 'D', name: '나란히 첫 산책', problem: '첫 만남이 사고로 번진다', solo: '없음', repeat: '회차형', verdict: '결합', why: '훈련사의 병행 산책 기법. 사회화에 이미 돈을 쓰는 행동이 있음' },
  { k: 'E', name: '산책 데이터 건강·보험', problem: '이상 징후를 늦게 안다', solo: '약함', repeat: '누적', verdict: '탈락', why: '의료·보험 역량을 가장해야 하고 기존 강자가 많음' },
]

export default function CaseStudy() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="case on-paper">
        <header className="case__hero">
          <div className="wrap">
            <p className="eyebrow eyebrow--moss">케이스 스터디 · 댕큐 리프로젝트</p>
            <h1 className="case__title">만남을 약속하던 앱을,<br />거리를 약속하는 서비스로.</h1>
            <dl className="case__meta">
              <div><dt>출발점</dt><dd>2인 팀 프로젝트 ‘댕큐’. 반려견 스와이프 매칭, 보호자 프로필 유료 잠금, 채팅, 약속, 후기</dd></div>
              <div><dt>이번 범위</dt><dd>개인 확장. 조사, 전략, 브랜드, 제품 설계, 구현, 검수. AI 에이전트와 협업해 병렬로 진행</dd></div>
              <div><dt>결과물</dt><dd>브랜드 사이트, 작동하는 체험 모드 제품, 브랜드 가이드, 키비주얼, 출시 영상</dd></div>
              <div><dt>검증 수준</dt><dd>E2E 테스트, 독립 검수 2라운드, 접근성·성능 측정(Chromium). <b>실제 사용자 인터뷰는 아직 하지 않았어요.</b></dd></div>
            </dl>
            <figure className="case__film">
              <video controls playsInline preload="none" poster="./media/poster.jpg" width="1920" height="1080">
                <source src="./media/dangq-launch-1080p.mp4" type="video/mp4" />
              </video>
              <figcaption>출시 영상 28초. 체험 모드 화면을 실제로 조작하며 녹화했어요. 소리는 없어요.</figcaption>
            </figure>
          </div>
        </header>

        <section className="case__sec">
          <div className="wrap case__two">
            <div>
              <p className="case__no num">01</p>
              <h2 className="h-l">기존 댕큐에서 시작했어요</h2>
              <p>기존 작업의 핵심 흐름은 ‘강아지 사진 스와이프 → 보호자 프로필 잠금 해제(댕큐패스) → 채팅 → 약속 → 후기’였어요. 원본 Figma를 읽기 전용으로 감사해 남길 것과 바꿀 것을 나눴어요.</p>
              <ul className="case__list">
                <li><b>남긴 것.</b> 개가 먼저, 보호자는 나중이라는 순서. 채팅에서 약속, 약속에서 후기로 이어지는 연결. 보호자·견 성향 태그.</li>
                <li><b>바꾼 것.</b> 외모로 고르는 스와이프, 연애 요소가 섞인 유료 잠금. 흰 글자와 #FF4375의 대비가 3.33:1로 본문 기준(4.5:1)에 못 미친 점. 빈 화면·오류·로딩 상태가 없던 점.</li>
              </ul>
            </div>
            <figure className="case__before case__before--one">
              <img src="./case/before-ia.jpg" alt="기존 댕큐 메뉴 구조 슬라이드. 메인, 큐레이션, 커뮤니티, 댕댕인증소, 마이페이지 다섯 탭" loading="lazy" width="1200" height="675" />
              <figcaption>기존 팀 작업의 메뉴 구조(Figma ‘1217’ 페이지). 앱 화면 캡처는 출처를 모르는 개 사진이 들어 있어 싣지 않았고, 출처 미상의 3D 마스코트도 가렸어요.</figcaption>
            </figure>
          </div>
        </section>

        <section className="case__sec case__sec--ink">
          <div className="wrap">
            <p className="case__no num">02</p>
            <h2 className="h-l">처음 가설을 스스로 반박했어요</h2>
            <p className="case__lead">출발 가설은 “우리 개에게 맞는 동네 산책 친구를 만나는 서비스”였어요. 자료를 모을수록 약점이 분명해졌어요.</p>
            <div className="case__evidence">
              <article><p className="num case__big">89.4%</p><p>산책 중 비반려인의 행동으로 불편을 겪은 반려견 가구. 1위는 놀라게 하거나 겁주는 행동(48.7%), 2위는 허락 없이 만지기(39.2%)예요.<span className="case__src">KB금융지주 경영연구소 「2025 한국 반려동물 보고서」 보도 인용 · 원문 대조 전</span></p></article>
              <article><p className="num case__big">71.0%</p><p>반려견 유치원 이용 이유 중 ‘사회화 훈련’. 월평균 이용료는 25만 4,800원이에요. 사회화에는 이미 돈을 쓰고 있어요.<span className="case__src">한국소비자원·서울시 실태조사 보도(2025) · 원문 대조 전</span></p></article>
              <article><p className="num case__big">OR 3.10</p><p>개와 산책하면 이웃을 알게 될 가능성이 높아진다는 연구가 있지만, 다른 연구에서는 효과가 약했어요. 만남을 약속하기엔 근거가 얇아요. 반려견 커뮤니티 Dogster는 2019년에 문을 닫았고, 반대로 돌봄 마켓 Rover는 크게 성장했어요. 사람들이 돈을 쓰는 곳은 ‘만남’보다 ‘돌봄과 안전’ 쪽이에요.<span className="case__src">Wood 2015 외 · 각 사 공지와 보도 · 원문 대조 전</span></p></article>
            </div>
            <p className="case__turn">다가오는 사람은 어떻게 다가가면 되는지, 마주 오는 개의 보호자는 얼마나 떨어져야 하는지 몰라요. 문제는 친구가 없어서가 아니라 <b>서로의 거리를 몰라서</b> 생긴다고 판단했어요.</p>
            <p className="case__note">수치는 보도를 거쳐 인용했어요. 공개 전에 원문과 대조해야 해요. 전체 출처와 확인 날짜는 저장소의 outputs/01_research/sources.md에 있어요.</p>
          </div>
        </section>

        <section className="case__sec">
          <div className="wrap">
            <p className="case__no num">03</p>
            <h2 className="h-l">다섯 방향을 비교해 둘을 골랐어요</h2>
            <div className="case__tablewrap" tabIndex={0} role="region" aria-label="전략 방향 비교표 (가로 스크롤)">
              <table className="case__table">
                <thead><tr><th scope="col">방향</th><th scope="col">해결하는 문제</th><th scope="col">혼자 써도 가치</th><th scope="col">다시 오는 이유</th><th scope="col">결정</th><th scope="col">이유</th></tr></thead>
                <tbody>
                  {DIRECTIONS.map((d) => (
                    <tr key={d.k} className={d.verdict !== '탈락' ? 'is-picked' : ''}>
                      <th scope="row"><span className="num">{d.k}</span> {d.name}</th><td>{d.problem}</td><td>{d.solo}</td><td>{d.repeat}</td><td><b>{d.verdict}</b></td><td>{d.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="case__lead">B를 중심에 두고, D를 첫 만남의 형식으로 붙였어요. 매칭(A)은 목적이 아니라 동네에 카드가 충분히 쌓였을 때 여는 부가 기능이에요.</p>
          </div>
        </section>

        <section className="case__sec">
          <div className="wrap case__two">
            <div>
              <p className="case__no num">04</p>
              <h2 className="h-l">핵심 아이디어: 병행 산책</h2>
              <p>여러 반려견 훈련 자료가 개를 처음 소개할 때 권하는 방법이 있어요. 두 개를 멀리 떨어뜨려 같은 방향으로 걷게 하고, 둘 다 편할 때만 거리를 좁히는 ‘병행 산책(parallel walk)’이에요. 댕큐는 이 방법을 따라 하기 쉬운 단계로 나누고, 안전 규칙을 코드로 고정했어요.</p>
              <ul className="case__list">
                <li>시작은 둘 중 더 먼 쪽의 편한 거리보다 2m 이상 멀리서.</li>
                <li>첫 만남은 6m 또는 편한 거리의 60%보다 가까이 가지 않고, 인사하지 않아요. 6m는 AKC 시민견 테스트에서 다른 개와 마주치는 항목의 거리(약 20ft)를 참고했어요.</li>
                <li>한 단계에 35%보다 많이 좁히지 않아요. 긴장하면 물러나기가 기본 선택지예요.</li>
                <li>다음 산책은 지난번 편안했던 거리보다 한 단계 멀리서 몸을 풀고 시작해요.</li>
                <li>둘 중 한 친구라도 12m 이상 필요하면 보호자끼리가 아니라 훈련사 동행으로만 열어요(준비 중).</li>
              </ul>
              <p className="case__src">참고: Sniffspot·Journey Dog Training·MLAR의 병행 산책 안내(S79–S81), AKC CGC 테스트 항목(S74). 수치 기준은 이 자료를 참고한 설계 가정이에요. 행동 전문가 검토 전이에요.</p>
            </div>
            <div className="case__lanes" aria-hidden="true">
              {[15, 8, 4].map((d) => <Lanes key={d} distance={d} me={{ name: 'A', state: 'calm' }} them={{ name: 'B', state: 'calm' }} theme="paper" height={200} />)}
            </div>
          </div>
        </section>

        <section className="case__sec case__sec--ink">
          <div className="wrap">
            <p className="case__no num">05</p>
            <h2 className="h-l">브랜드: 세 방향 중 ‘나란히 두 선’</h2>
            <figure className="case__fig">
              <img src="./case/art-directions.jpg" alt="세 가지 아트 디렉션 비교. 관찰 노트, 나란히 두 선, 말랑 캐릭터" loading="lazy" width="1400" height="612" />
              <figcaption>같은 메시지와 같은 폰트로 세 방향을 빠르게 시각화했어요. 관찰 노트는 기억에 덜 남았고, 말랑 캐릭터는 다시 ‘만남’ 메시지로 끌려갔어요.</figcaption>
            </figure>
            <ul className="case__grid3">
              <li><b>두 선이 곧 서비스.</b> 로고, 탭 아이콘, 히어로, 가이드 화면이 모두 같은 기호에서 나와요.</li>
              <li><b>숫자가 주인공.</b> 사진 대신 거리(m)를 가장 크게 써요.</li>
              <li><b>감정은 자세로.</b> 얼굴이나 발바닥 무늬 없이 귀, 꼬리, 머리 높이로 개의 상태를 보여 줘요.</li>
            </ul>
            <p className="case__lead">이름 ‘댕큐’는 유지했어요. ‘고마워’가 ‘거리를 지켜 줘서 고마워’라는 새 뜻을 얻었기 때문이에요. 영문 표기는 DANGQ로 통일했어요. 상표 사용 가능성은 아직 조사하지 않았어요.</p>
            <Link to="/brand" className="btn btn-signal">브랜드 가이드 보기</Link>
          </div>
        </section>

        <section className="case__sec">
          <div className="wrap">
            <p className="case__no num">06</p>
            <h2 className="h-l">기억에 남기려고 만든 다섯 장면</h2>
            <ol className="case__scenes">
              <li><b>거리 다이얼</b> <span>(사이트 첫 화면)</span> 방문자가 다가가는 개가 되어 슬라이더를 움직여요. 같은 7m라도 뽀리는 귀가 서고 콩이는 편안해요. 키보드 화살표와 터치 모두 작동하고, 모션 감소 설정에서는 움직임 없이 상태만 바뀌어요.</li>
              <li><b>카드 만들기</b> <span>(제품)</span> 편한 거리를 고르면 두 선의 간격이 바뀌고, 숫자 대신 “길 건너편 정도” 같은 생활 언어로 알려 줘요.</li>
              <li><b>나란히 첫 산책</b> <span>(제품)</span> 단계, 타이머, 확인 질문으로 이어져요. ‘긴장했어요’를 누르면 물러나기가 기본 선택지로 나와요.</li>
              <li><b>보여주기</b> <span>(제품)</span> 모르는 사람에게 화면을 보여 주는 순간을 위한 모드예요. 큰 글씨, 햇빛 아래서도 읽히는 밝은 배경, 화면 꺼짐 방지, Esc로 닫기를 지원하고 마지막 줄은 늘 “거리를 지켜 줘서, 댕큐.”예요.</li>
              <li><b>사이 기록</b> <span>(제품)</span> 관계를 줄어드는 거리의 선으로 보여 주고, 다음 산책의 시작점이 돼요.</li>
            </ol>
            <Link to="/app" className="btn btn-ink">체험 모드로 직접 써 보기</Link>
          </div>
        </section>

        <section className="case__sec case__sec--soft">
          <div className="wrap case__two">
            <div>
              <p className="case__no num">07</p>
              <h2 className="h-l">만든 것과 아직 아닌 것</h2>
              <ul className="case__list">
                <li><b>작동하는 것.</b> 카드 만들기·수정, 보여주기, 산책과 마주침 기록, 기록에 따른 카드 조정 제안, 위치 권한 허용·거부·무응답 처리, 이웃 목록 필터와 빈 결과, 요청·중복 방지·취소, 단계형 나란히 산책(멈춤·물러나기·중단), 사이 기록, 새로고침 후 데이터 유지, 데이터 초기화.</li>
                <li><b>시연인 것.</b> 이웃 6마리와 자동 수락 응답. 화면에 ‘체험 모드’로 표시해요. 실제로 전송되는 것은 없어요.</li>
                <li><b>아직 없는 것.</b> 사용자 인터뷰, 실제 매칭 서버, 신고·차단 운영, 훈련사 제휴와 자격 확인, 결제, 위치정보·개인정보 법률 검토, 상표 조사.</li>
              </ul>
            </div>
            <div>
              <h3 className="case__h3">이 결과가 나오면 전략을 바꿔요</h3>
              <ul className="case__list">
                <li>인터뷰에서 다수가 ‘친구 찾기’를 원하고 안전 걱정이 낮다 → 매칭 비중을 높여요.</li>
                <li>카드 완성률이 낮거나 2주 뒤 기록이 끊긴다 → 장소·시간 정보 중심으로 옮겨요.</li>
                <li>훈련사가 유료 소그룹 나란히 산책에 참여한다 → 그걸 수익의 중심으로 삼아요.</li>
                <li>같은 동네·시간대에 맞는 개가 부족하다 → 매칭을 빼고 카드와 기록만 남겨요.</li>
              </ul>
              <p className="case__note">기준 수치(완성률 50%, 2주 유지율 20%)는 판단용 제안이에요. 측정된 데이터가 아니에요.</p>
            </div>
          </div>
        </section>

        <section className="case__sec">
          <div className="wrap">
            <p className="case__no num">08</p>
            <h2 className="h-l">검수</h2>
            <p className="case__lead">제작에 참여하지 않은 검수 에이전트가 1차에서 51건(중대 1, 주요 19, 경미 31)을 찾았어요. 가장 큰 문제는 나란히 단계가 개의 편한 거리를 무시하고 2m까지 좁히던 규칙이었어요. 규칙 자체를 다시 설계하고 단위 테스트로 고정했어요. 수정 결과와 2차 재확인, 확인하지 못한 환경은 저장소의 outputs/05_qa/에 남겼어요.</p>
            <ul className="case__list">
              <li><b>반박 검토에서 바꾼 것.</b> 산책길의 3초에 휴대폰을 꺼내기 어렵다는 지적에 리드줄 태그 인쇄를 더했어요. 보호자와 행인이 ‘8m’를 가늠하지 못한다는 지적에 모든 거리를 걸음 수와 함께 적었어요. 반응하는 순간에는 한 번만 누르면 기록되게 바꿨어요.</li>
              <li><b>아직 남은 것.</b> 실제 보호자 인터뷰, 행동 전문가 검토, Safari·Firefox·실기기 확인, 상표 조사.</li>
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
