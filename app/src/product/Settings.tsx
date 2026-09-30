import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resetDemo, setState, useStore } from '../lib/store'
import { NEIGHBORS } from '../lib/demo'
import { Confirm, PageHead } from './ui'

export function Settings() {
  const card = useStore((s) => s.card)
  const walks = useStore((s) => s.walks.length)
  const hidden = useStore((s) => s.hidden)
  const [ask, setAsk] = useState(false)
  const nav = useNavigate()
  return (
    <div className="stack">
      <PageHead kicker="설정" title="체험 모드 안내" />
      <ul className="facts">
        <li>입력한 카드와 기록은 <b>이 브라우저(localStorage)에만</b> 저장돼요. 서버로 보내지 않아요.</li>
        <li>이웃 개 6마리와 수락 응답은 <b>시연용 데이터</b>예요. 실제 사람에게 전달되지 않아요.</li>
        <li>위치 권한을 허용해도 좌표는 저장하지 않고 시연용 동네를 보여 줘요.</li>
        <li>이웃 숨기기는 이 브라우저에서만 작동해요. 신고, 보호자 인증, 결제, 실제 매칭은 운영 체계가 필요해서 이 체험에 없어요.</li>
      </ul>
      {hidden.length > 0 && (
        <section className="panel" aria-labelledby="hidden-title">
          <h2 id="hidden-title" className="panel__title">숨긴 이웃</h2>
          <ul className="hist">
            {hidden.map((id) => (
              <li key={id}><span>{NEIGHBORS.find((n) => n.id === id)?.name ?? id}</span><span /><button className="btn-quiet" onClick={() => setState((s) => ({ ...s, hidden: s.hidden.filter((x) => x !== id) }))}>다시 보기</button></li>
            ))}
          </ul>
        </section>
      )}
      <p className="panel__note">현재 저장된 데이터: 산책 카드 {card ? '1장' : '없음'} · 산책 기록 {walks}개</p>
      <button className="btn btn-ghost btn-block" onClick={() => setAsk(true)} disabled={!card && walks === 0}>체험 데이터 모두 지우기</button>
      <Link to="/" className="btn-quiet">댕큐 소개 사이트로</Link>
      <Confirm open={ask} title="체험 데이터를 모두 지울까요?" body="카드, 산책 기록, 사이 기록이 모두 사라지고 처음 화면으로 돌아가요." confirmLabel="모두 지우기" danger
        onCancel={() => setAsk(false)} onConfirm={() => { resetDemo(); setAsk(false); nav('/app') }} />
    </div>
  )
}
