import { useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DogCard, Greeting, Pace, Size, Slot, Trigger } from '../lib/store'
import { GREETING_ASK, GREETING_LABEL, PACE_LABEL, SIZE_LABEL, SLOT_LABEL, TRIGGER_LABEL, getState, setState } from '../lib/store'
import { CardFace } from '../components/CardFace'
import { Lanes } from '../components/Lanes'
import { Confirm } from './ui'

type Draft = Omit<DogCard, 'updatedAt'>
const BLANK: Draft = { name: '', size: 'medium', pace: 'steady', greeting: 'slow', comfort: 8, triggers: [], slots: [], note: '' }
const STEPS = ['이름', '편한 거리', '인사와 걸음', '조심할 것'] as const

/** 거리 기준 도움말: owners rarely know a number, so we translate everyday cues into meters. */
const COMFORT_HINTS = [
  { max: 3, text: '다른 개가 옆을 스쳐 가도 괜찮아요.' },
  { max: 6, text: '길 건너편 정도면 편하게 지나가요.' },
  { max: 10, text: '같은 인도에서 마주치면 긴장해요. 차도 하나 정도 떨어져야 편해요.' },
  { max: 20, text: '멀리서 보이기만 해도 신경 써요. 공원 반대편 정도가 편해요.' },
]

export function CardBuilder({ mode }: { mode: 'new' | 'edit' }) {
  const nav = useNavigate()
  const initial = mode === 'edit' && getState().card ? { ...getState().card! } : BLANK
  const [d, setD] = useState<Draft>(initial)
  const [step, setStep] = useState(0)
  const [nameError, setNameError] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const headRef = useRef<HTMLHeadingElement>(null)
  const id = useId()
  const dirty = JSON.stringify(d) !== JSON.stringify(initial)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const goto = (n: number) => { setStep(n); requestAnimationFrame(() => headRef.current?.focus()) }

  const next = () => {
    if (step === 0) {
      const name = d.name.trim()
      if (!name) { setNameError('이름을 적어 주세요. 카드 맨 위에 크게 보여요.'); nameRef.current?.focus(); return }
      if (name.length > 10) { setNameError('이름은 10자까지 쓸 수 있어요.'); nameRef.current?.focus(); return }
      set('name', name)
    }
    if (step < STEPS.length) goto(step + 1)
  }
  const save = () => {
    setState((s) => ({ ...s, card: { ...d, name: d.name.trim(), note: d.note.trim(), updatedAt: Date.now() } }))
    nav('/app', { replace: true })
  }
  const exit = () => (dirty ? setLeaving(true) : nav('/app'))

  const hint = COMFORT_HINTS.find((h) => d.comfort <= h.max)!
  const done = step === STEPS.length

  return (
    <div className="builder">
      <div className="builder__top">
        <button className="btn-quiet" onClick={exit}>{mode === 'edit' ? '취소' : '나가기'}</button>
        {!done && (
          <ol className="progress" aria-label={`${STEPS.length}단계 중 ${step + 1}단계`}>
            {STEPS.map((s, i) => <li key={s} className={i <= step ? 'is-on' : ''} aria-current={i === step ? 'step' : undefined}><span className="sr-only">{s}</span></li>)}
          </ol>
        )}
      </div>

      {step === 0 && (
        <section className="builder__step">
          <h1 ref={headRef} tabIndex={-1} className="builder__title">어떤 친구의<br />카드인가요?</h1>
          <div className="field">
            <label htmlFor={`${id}-name`}>이름</label>
            <input id={`${id}-name`} ref={nameRef} className="input" value={d.name} maxLength={12} autoComplete="off"
              aria-invalid={!!nameError} aria-describedby={nameError ? `${id}-name-err` : undefined}
              onChange={(e) => { set('name', e.target.value); setNameError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') next() }} placeholder="예: 뽀리" />
            {nameError && <p id={`${id}-name-err`} className="error">{nameError}</p>}
          </div>
          <fieldset className="field">
            <legend className="label">몸집</legend>
            <div className="choices">
              {(Object.keys(SIZE_LABEL) as Size[]).map((s) => (
                <label key={s} className="choice"><input type="radio" name={`${id}-size`} checked={d.size === s} onChange={() => set('size', s)} /><span>{SIZE_LABEL[s]}</span></label>
              ))}
            </div>
          </fieldset>
        </section>
      )}

      {step === 1 && (
        <section className="builder__step">
          <h1 ref={headRef} tabIndex={-1} className="builder__title">{d.name}는 다른 개가<br />얼마나 떨어져야 편한가요?</h1>
          <div className="comfort">
            <div className="comfort__stage" aria-hidden="true">
              <Lanes distance={d.comfort} me={{ name: d.name, state: 'calm' }} them={{ name: '다른 개', state: 'calm' }} theme="ink" height={300} walking />
            </div>
            <label htmlFor={`${id}-comfort`} className="sr-only">편한 거리(미터)</label>
            <input id={`${id}-comfort`} type="range" className="range range--paper" min={1} max={20} value={d.comfort}
              onChange={(e) => set('comfort', Number(e.target.value))} aria-valuetext={`${d.comfort}미터. ${hint.text}`}
              style={{ ['--fill' as string]: `${((d.comfort - 1) / 19) * 100}%` }} />
            <div className="comfort__ends" aria-hidden="true"><span>1m 가까이</span><span>20m 멀리</span></div>
            <p className="comfort__value" aria-live="polite"><span className="num">{d.comfort}m</span> {hint.text}</p>
          </div>
          <p className="fineprint">정확하지 않아도 괜찮아요. 산책 기록이 쌓이면 댕큐가 조정을 제안해요.</p>
        </section>
      )}

      {step === 2 && (
        <section className="builder__step">
          <h1 ref={headRef} tabIndex={-1} className="builder__title">누가 다가오면<br />어떻게 해 주면 좋을까요?</h1>
          <fieldset className="field">
            <legend className="label">인사 방식</legend>
            <div className="options">
              {(Object.keys(GREETING_LABEL) as Greeting[]).map((g) => (
                <label key={g} className="option">
                  <input type="radio" name={`${id}-greet`} checked={d.greeting === g} onChange={() => set('greeting', g)} />
                  <span><b>{GREETING_LABEL[g]}</b><small>“{GREETING_ASK[g].title}”</small></span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="field">
            <legend className="label">걷는 속도</legend>
            <div className="choices">
              {(Object.keys(PACE_LABEL) as Pace[]).map((p) => (
                <label key={p} className="choice"><input type="radio" name={`${id}-pace`} checked={d.pace === p} onChange={() => set('pace', p)} /><span>{PACE_LABEL[p]}</span></label>
              ))}
            </div>
          </fieldset>
        </section>
      )}

      {step === 3 && (
        <section className="builder__step">
          <h1 ref={headRef} tabIndex={-1} className="builder__title">조심해 줬으면<br />하는 게 있나요?</h1>
          <fieldset className="field">
            <legend className="label">여러 개 고를 수 있어요 <span className="hint">(없으면 넘어가요)</span></legend>
            <div className="choices">
              {(Object.keys(TRIGGER_LABEL) as Trigger[]).map((t) => (
                <label key={t} className="choice"><input type="checkbox" checked={d.triggers.includes(t)} onChange={() => set('triggers', toggle(d.triggers, t))} /><span>{TRIGGER_LABEL[t]}</span></label>
              ))}
            </div>
          </fieldset>
          <fieldset className="field">
            <legend className="label">주로 산책하는 때</legend>
            <div className="choices">
              {(Object.keys(SLOT_LABEL) as Slot[]).map((s) => (
                <label key={s} className="choice"><input type="checkbox" checked={d.slots.includes(s)} onChange={() => set('slots', toggle(d.slots, s))} /><span>{SLOT_LABEL[s]}</span></label>
              ))}
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor={`${id}-note`}>한마디 <span className="hint">(선택, 40자)</span></label>
            <input id={`${id}-note`} className="input" maxLength={40} value={d.note} onChange={(e) => set('note', e.target.value)} placeholder="예: 처음엔 옆보다 조금 뒤가 편해요" />
          </div>
        </section>
      )}

      {done && (
        <section className="builder__step builder__done">
          <h1 ref={headRef} tabIndex={-1} className="builder__title">{d.name}의 산책 카드예요.</h1>
          <CardFace card={d} />
          <p className="fineprint">누가 다가오면 홈의 ‘보여주기’를 눌러 이 카드를 크게 보여 주세요.</p>
        </section>
      )}

      <div className="builder__nav">
        {step > 0 && <button className="btn btn-ghost" onClick={() => goto(step - 1)}>이전</button>}
        {!done && <button className="btn btn-ink builder__next" onClick={next}>{step === STEPS.length - 1 ? '카드 미리보기' : '다음'}</button>}
        {done && <button className="btn btn-signal builder__next" onClick={save}>{mode === 'edit' ? '고친 내용 저장' : '카드 저장하기'}</button>}
      </div>

      <Confirm open={leaving} title="작성 중인 내용이 있어요" body={mode === 'edit' ? '고친 내용은 저장되지 않아요.' : '지금 나가면 입력한 내용이 사라져요.'}
        confirmLabel="나가기" cancelLabel="계속 쓰기" danger onCancel={() => setLeaving(false)} onConfirm={() => { setLeaving(false); nav('/app') }} />
    </div>
  )
}

