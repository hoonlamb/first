import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Check, ChevronLeft, ImagePlus, Minus, Plus, X } from 'lucide-react'
import type { DogCard, Greeting, Pace, Size, Slot, Trigger } from '../../lib/store'
import { GREETING_ASK, GREETING_LABEL, PACE_LABEL, SIZE_LABEL, SLOT_LABEL, TRIGGER_LABEL, getState, setState } from '../../lib/store'
import { distanceWords, josa, visibleLength } from '../../lib/korean'
import { awardBadge } from '../../lib/badges'
import { Sheet } from '../ui/kit'
import { asset } from '../ui/asset'
import './onboarding.css'

type Draft = Omit<DogCard, 'updatedAt'>
const BLANK: Draft = { name: '', size: 'medium', pace: 'steady', greeting: 'slow', comfort: 8, triggers: [], slots: [], note: '', age: 3 }

const STEPS = ['사진', '기본 정보', '편한 거리', '인사와 걸음', '조심할 것', '미리보기'] as const
const LAST_INPUT = STEPS.length - 2

const SAMPLE_PHOTOS = [
  'photos/dog-03-bori-terrier.jpg', 'photos/dog-01-corgi.jpg', 'photos/dog-02-chihuahua.jpg', 'photos/dog-04-poodle.jpg',
  'photos/dog-05-labrador.jpg', 'photos/dog-06-frenchie.jpg', 'photos/dog-07-pomeranian.jpg',
]
const BREEDS = ['믹스', '말티즈', '푸들', '포메라니안', '웰시코기', '진돗개', '시바견']

/** 거리 기준 도움말 (ported from CardBuilder): owners rarely know a number, so everyday cues → meters. */
const COMFORT_HINTS = [
  { max: 2, text: '다른 개가 옆을 스쳐 가도 괜찮아요.' },
  { max: 5, text: '좁은 골목 건너편 정도면 편하게 지나가요.' },
  { max: 8, text: '같은 인도에서 마주치면 긴장해요. 2차선 길 건너편 정도가 편해요.' },
  { max: 12, text: '4차선 길 건너편 정도는 떨어져야 편해요.' },
  { max: 16, text: '멀리서 보이기만 해도 신경 써요. 놀이터 반대편 정도가 편해요.' },
  { max: 20, text: '다른 개가 시야에 들어오면 긴장해요. 산책 시간을 피하는 게 편할 수 있어요.' },
]
const comfortHint = (m: number) => COMFORT_HINTS.find((h) => m <= h.max)!.text

const GREETING_EMOJI: Record<Greeting, string> = { hello: '👋', slow: '👃', pass: '🚶' }
const PACE_EMOJI: Record<Pace, string> = { slow: '🐢', steady: '🐕', brisk: '🐇' }
const TRIGGER_EMOJI: Record<Trigger, string> = { bike: '🚲', bigdog: '🐕‍🦺', smalldog: '🐩', kids: '🧒', touch: '✋', noise: '📢' }
const SLOT_EMOJI: Record<Slot, string> = { dawn: '🌅', morning: '☀️', evening: '🌇', night: '🌙' }

/** Read an image file, downscale to ≤900px on the long side, return a JPEG data URL. */
function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('type')); return }
    if (file.size > 20 * 1024 * 1024) { reject(new Error('size')); return }
    const fr = new FileReader()
    fr.onerror = () => reject(new Error('read'))
    fr.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode'))
      img.onload = () => {
        try {
          const scale = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight))
          const w = Math.max(1, Math.round(img.naturalWidth * scale))
          const h = Math.max(1, Math.round(img.naturalHeight * scale))
          const c = document.createElement('canvas')
          c.width = w; c.height = h
          const ctx = c.getContext('2d')
          if (!ctx) { reject(new Error('canvas')); return }
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, w, h)
          ctx.drawImage(img, 0, 0, w, h)
          resolve(c.toDataURL('image/jpeg', 0.84))
        } catch { reject(new Error('canvas')) }
      }
      img.src = String(fr.result)
    }
    fr.readAsDataURL(file)
  })
}

/** Personal-space bubble: the pink circle is how much room my dog needs; the other dog waits at its edge. */
function ComfortBubble({ distance, photo, name }: { distance: number; photo?: string; name: string }) {
  const clip = useId().replace(/:/g, '')
  const R = 40 + ((distance - 1) / 19) * 212
  const me = 58
  const other = Math.min(me + R + 4, 322)
  return (
    <svg viewBox="0 0 350 170" className="ob-bubble" aria-hidden="true">
      <defs>
        <clipPath id={`c${clip}`}><circle cx={me} cy="88" r="27" /></clipPath>
        <radialGradient id={`g${clip}`}>
          <stop offset="55%" stopColor="#FF4375" stopOpacity=".06" />
          <stop offset="100%" stopColor="#FF4375" stopOpacity=".2" />
        </radialGradient>
      </defs>
      <line x1="0" y1="88" x2="350" y2="88" stroke="#FFD3DE" strokeWidth="26" strokeLinecap="round" opacity=".45" />
      <line x1="10" y1="88" x2="340" y2="88" stroke="#fff" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
      <circle className="ob-bubble__zone" cx={me} cy="88" r={R} fill={`url(#g${clip})`} stroke="#FF4375" strokeWidth="2" strokeDasharray="5 6" />
      <circle cx={me} cy="88" r="31" fill="#fff" />
      {photo
        ? <image href={asset(photo)} x={me - 27} y="61" width="54" height="54" preserveAspectRatio="xMidYMid slice" clipPath={`url(#c${clip})`} />
        : <text x={me} y="98" fontSize="28" textAnchor="middle">🐶</text>}
      <rect className="ob-bubble__dim" x={me + 31} y="149" height="2" rx="1" fill="#D42A58" style={{ width: `${Math.max(0, other - 24 - me - 31)}px` }} />
      <line x1={me + 31} y1="143" x2={me + 31} y2="157" stroke="#D42A58" strokeWidth="2" strokeLinecap="round" />
      <g className="ob-bubble__other" style={{ transform: `translateX(${other}px)` }}>
        <circle cx="0" cy="88" r="22" fill="#fff" stroke="#EFEFF0" strokeWidth="2" />
        <text x="0" y="97" fontSize="22" textAnchor="middle">🐕</text>
        <line x1="-24" y1="143" x2="-24" y2="157" stroke="#D42A58" strokeWidth="2" strokeLinecap="round" />
      </g>
      <text x={me} y="40" fontSize="12" fontWeight="700" fill="#515151" textAnchor="middle">{name || '우리 개'}</text>
    </svg>
  )
}

function Confirm({ open, title, body, yes, no = '취소', danger, onYes, onNo }: { open: boolean; title: string; body: string; yes: string; no?: string; danger?: boolean; onYes: () => void; onNo: () => void }) {
  return (
    <Sheet open={open} onClose={onNo} title={title} center>
      <p className="hf-body">{body}</p>
      <div className="ob-confirm">
        <button className="hf-btn hf-btn--line" onClick={onNo}>{no}</button>
        <button className={`hf-btn ${danger ? 'hf-btn--danger' : 'hf-btn--primary'}`} onClick={onYes}>{yes}</button>
      </div>
    </Sheet>
  )
}

function Splash({ onStart }: { onStart: () => void }) {
  const btn = useRef<HTMLButtonElement>(null)
  return (
    <div className="ob-splash hf-fade-in">
      <div className="ob-splash__art">
        <span className="ob-splash__halo" aria-hidden="true" />
        <img src={asset('photos/mascot.png')} alt="" className="ob-splash__mascot" />
        {SAMPLE_PHOTOS.slice(1, 5).map((p, i) => <img key={p} src={asset(p)} alt="" className={`ob-splash__dog ob-splash__dog--${i}`} />)}
      </div>
      <div className="ob-splash__copy">
        <h1 className="ob-splash__logo">댕큐</h1>
        <p className="ob-splash__tag">가까워지는 데는<br />순서가 있어요</p>
        <p className="ob-splash__sub">우리 개가 편한 거리를 카드 한 장에 담고,<br />지나가는 사람과 이웃에게 보여 주세요.</p>
      </div>
      <div className="ob-splash__cta">
        <button ref={btn} className="hf-btn hf-btn--primary hf-btn--block ob-splash__btn" onClick={onStart}>우리 개 카드 만들기</button>
        <p className="ob-splash__note">체험 모드 · 입력은 이 브라우저에만 저장돼요</p>
      </div>
    </div>
  )
}

function Chip({ on, onChange, children, type = 'checkbox', name }: { on: boolean; onChange: () => void; children: ReactNode; type?: 'checkbox' | 'radio'; name?: string }) {
  return (
    <label className={`ob-chip ${on ? 'is-on' : ''}`}>
      <input type={type} name={name} checked={on} onChange={onChange} className="ob-vh" />
      {children}
      {on && type === 'checkbox' && <Check size={15} strokeWidth={3} aria-hidden="true" />}
    </label>
  )
}

export function Onboarding({ edit = false }: { edit?: boolean }) {
  const nav = useNavigate()
  const [initial] = useState<Draft>(() => {
    const c = getState().card
    if (edit && c) { const { updatedAt: _u, ...rest } = c; void _u; return rest }
    return BLANK
  })
  const [existing] = useState(() => (edit ? null : getState().card))
  const [d, setD] = useState<Draft>(initial)
  const [step, setStep] = useState<number>(edit || existing ? 0 : -1)
  const [nameError, setNameError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [replaceAsk, setReplaceAsk] = useState(false)
  const headRef = useRef<HTMLHeadingElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const dirty = JSON.stringify(d) !== JSON.stringify(initial)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  useEffect(() => {
    document.getElementById('hf-scroll')?.scrollTo(0, 0)
    if (step >= 0) requestAnimationFrame(() => headRef.current?.focus({ preventScroll: true }))
  }, [step])

  const goto = (n: number) => setStep(n)
  const next = () => {
    if (step === 1) {
      const name = d.name.trim()
      if (!name) { setNameError('이름을 적어 주세요. 카드 맨 위에 크게 보여요.'); nameRef.current?.focus(); return }
      if (visibleLength(name) > 10) { setNameError('이름은 10글자까지 쓸 수 있어요.'); nameRef.current?.focus(); return }
      set('name', name)
    }
    if (step < STEPS.length - 1) goto(step + 1)
  }
  const leave = () => {
    if (edit) {
      const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
      if (idx > 0) nav(-1)
      else nav('/app/me')
    } else nav('/app')
  }
  const back = () => {
    if (step > 0) { goto(step - 1); return }
    if (!edit && !existing) { goto(-1); return } // new user: back to the welcome screen, draft kept
    if (dirty) setLeaving(true)
    else leave()
  }
  const save = () => {
    if (existing && !replaceAsk) { setReplaceAsk(true); return }
    setReplaceAsk(false)
    const breed = d.breed?.trim()
    setState((s) => ({
      ...s,
      card: { ...d, name: d.name.trim(), note: d.note.trim(), breed: breed || undefined, updatedAt: Date.now() },
      // a different dog: walks, relationships and requests don't carry over
      ...(existing ? {
        walks: [], activeWalk: null, bonds: {}, requests: {}, activeTogether: null,
        threads: {}, meets: {}, reviews: [], seen: {}, badges: s.badges.filter((b) => b === 'card' || b === 'place'),
      } : {}),
    }))
    awardBadge('card')
    nav('/app', { replace: true })
  }
  const onFile = async (f: File | undefined) => {
    if (!f) return
    setPhotoError(null); setBusy(true)
    try {
      set('photo', await readPhoto(f))
    } catch (e) {
      const why = (e as Error).message
      setPhotoError(why === 'type' ? '사진 파일만 올릴 수 있어요. JPG나 PNG를 골라 주세요.'
        : why === 'size' ? '사진이 너무 커요(20MB 넘음). 다른 사진을 골라 주세요.'
          : '이 사진은 열 수 없어요. 다른 사진을 고르거나 아래 예시 사진을 써 주세요.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (step === -1) return <Splash onStart={() => goto(0)} />

  const uploaded = !!d.photo?.startsWith('data:')
  const ask = GREETING_ASK[d.greeting]
  const isPreview = step === STEPS.length - 1
  const dogName = d.name.trim()

  return (
    <div className="ob">
      <header className="ob-top">
        <button className="hf-iconbtn" onClick={back} aria-label={step === 0 ? (edit ? '수정 그만두기' : '나가기') : '이전 단계'}>
          {step === 0 && (edit || existing) ? <X size={24} strokeWidth={2} /> : <ChevronLeft size={26} strokeWidth={2} />}
        </button>
        <div className="ob-progress" role="progressbar" aria-label="카드 만들기 진행" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-valuetext={`${STEPS.length}단계 중 ${step + 1}단계, ${STEPS[step]}`}>
          <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <span className="ob-count num" aria-hidden="true">{step + 1}<i>/{STEPS.length}</i></span>
      </header>

      <div className="ob-body" key={step}>
        <p className="ob-kicker">{edit ? '카드 수정' : '산책 카드 만들기'} · {STEPS[step]}</p>

        {step === 0 && (<>
          <h1 ref={headRef} tabIndex={-1} className="ob-title">{edit ? <>카드 사진을<br />바꿔 볼까요?</> : <>카드에 쓸<br />사진을 골라 주세요</>}</h1>
          {existing && (
            <p className="ob-notice" role="status">이미 <b>{existing.name}</b>의 카드가 있어요. 새로 만들면 지금 카드를 바꾸게 돼요. <Link to="/app/card/edit">지금 카드 고치기</Link></p>
          )}
          <div className="ob-photo-hero">
            <div className={`ob-photo-hero__frame ${d.photo ? '' : 'is-empty'}`}>
              {d.photo ? <img src={asset(d.photo)} alt="고른 사진 미리보기" /> : <span aria-hidden="true">🐶</span>}
            </div>
            <input ref={fileRef} id={`${id}-file`} type="file" accept="image/*" className="ob-vh" onChange={(e) => void onFile(e.target.files?.[0])} />
            <label htmlFor={`${id}-file`} className={`hf-btn hf-btn--soft ob-upload ${uploaded ? 'is-on' : ''}`} aria-busy={busy}>
              {busy ? '사진 줄이는 중…' : uploaded ? <><Camera size={18} /> 다른 사진 올리기</> : <><ImagePlus size={18} /> 내 사진 올리기</>}
            </label>
            {photoError && <p className="ob-error" role="alert">{photoError}</p>}
          </div>
          <fieldset className="ob-field">
            <legend className="ob-label">또는 예시 사진에서 고르기</legend>
            <div className="ob-thumbs">
              {SAMPLE_PHOTOS.map((p, i) => (
                <label key={p} className={`ob-thumb ${d.photo === p ? 'is-on' : ''}`}>
                  <input type="radio" name={`${id}-photo`} className="ob-vh" checked={d.photo === p} onChange={() => { set('photo', p); setPhotoError(null) }} />
                  <img src={asset(p)} alt={`예시 사진 ${i + 1}`} />
                  {d.photo === p && <span className="ob-thumb__check" aria-hidden="true"><Check size={14} strokeWidth={3.2} /></span>}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="ob-fine">사진은 서버로 보내지 않아요. 900px로 줄여 이 브라우저에만 저장해요.</p>
        </>)}

        {step === 1 && (<>
          <h1 ref={headRef} tabIndex={-1} className="ob-title">어떤 친구의<br />카드인가요?</h1>
          <div className="ob-field">
            <label className="ob-label" htmlFor={`${id}-name`}>이름 <span className="ob-req">필수</span></label>
            <div className="ob-inputwrap">
              <input id={`${id}-name`} ref={nameRef} className={`ob-input ${nameError ? 'is-bad' : ''}`} value={d.name} maxLength={40} autoComplete="off"
                aria-invalid={!!nameError} aria-describedby={`${id}-name-help`}
                onChange={(e) => { set('name', e.target.value); setNameError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') next() }} placeholder="예: 뽀리" />
              <span className={`ob-counter num ${visibleLength(d.name.trim()) > 10 ? 'is-bad' : ''}`} aria-hidden="true">{visibleLength(d.name.trim())}/10</span>
            </div>
            <p id={`${id}-name-help`} className={nameError ? 'ob-error' : 'ob-help'}>{nameError ?? '카드 맨 위에 크게 보여요. 10글자까지 쓸 수 있어요.'}</p>
          </div>
          <fieldset className="ob-field">
            <legend className="ob-label">성별</legend>
            <div className="ob-seg">
              {([['m', '♂', '남아'], ['f', '♀', '여아']] as const).map(([v, sym, t]) => (
                <label key={v} className={`ob-seg__item ${d.sex === v ? 'is-on' : ''}`}>
                  <input type="radio" name={`${id}-sex`} className="ob-vh" checked={d.sex === v} onChange={() => set('sex', v)} />
                  <span className={`ob-sex ob-sex--${v}`} aria-hidden="true">{sym}</span>{t}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="ob-row2">
            <div className="ob-field">
              <span className="ob-label" id={`${id}-age-l`}>나이</span>
              <div className="ob-stepper" role="group" aria-labelledby={`${id}-age-l`}>
                <button type="button" aria-label="한 살 적게" disabled={(d.age ?? 0) <= 0} onClick={() => set('age', Math.max(0, (d.age ?? 0) - 1))}><Minus size={18} strokeWidth={2.4} /></button>
                <output className="num" aria-live="polite">{(d.age ?? 0) === 0 ? '1살 미만' : `${d.age}살`}</output>
                <button type="button" aria-label="한 살 많게" disabled={(d.age ?? 0) >= 25} onClick={() => set('age', Math.min(25, (d.age ?? 0) + 1))}><Plus size={18} strokeWidth={2.4} /></button>
              </div>
            </div>
            <fieldset className="ob-field">
              <legend className="ob-label">몸집</legend>
              <div className="ob-seg ob-seg--sm">
                {(Object.keys(SIZE_LABEL) as Size[]).map((s) => (
                  <label key={s} className={`ob-seg__item ${d.size === s ? 'is-on' : ''}`}>
                    <input type="radio" name={`${id}-size`} className="ob-vh" checked={d.size === s} onChange={() => set('size', s)} />{SIZE_LABEL[s]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="ob-field">
            <label className="ob-label" htmlFor={`${id}-breed`}>견종 <span className="ob-opt">선택</span></label>
            <input id={`${id}-breed`} className="ob-input" value={d.breed ?? ''} maxLength={20} autoComplete="off" placeholder="예: 믹스, 푸들" onChange={(e) => set('breed', e.target.value)} />
            <div className="ob-quick" aria-label="자주 쓰는 견종">
              {BREEDS.map((b) => (
                <button key={b} type="button" className={`hf-chip hf-chip--sm ${d.breed === b ? 'hf-chip--on' : ''}`} aria-pressed={d.breed === b} onClick={() => set('breed', b)}>{b}</button>
              ))}
            </div>
          </div>
        </>)}

        {step === 2 && (<>
          <h1 ref={headRef} tabIndex={-1} className="ob-title">{josa(dogName, '은/는')} 다른 개가<br />얼마나 떨어져야 편한가요?</h1>
          <div className="ob-comfort">
            <ComfortBubble distance={d.comfort} photo={d.photo} name={dogName} />
            <div className="ob-comfort__read" aria-live="polite">
              <b className="num">{d.comfort}<small>m</small></b>
              <span>{distanceWords(d.comfort)}</span>
            </div>
            <label htmlFor={`${id}-comfort`} className="sr-only">편한 거리(미터)</label>
            <input id={`${id}-comfort`} type="range" className="ob-range" min={1} max={20} value={d.comfort}
              onChange={(e) => set('comfort', Number(e.target.value))} aria-valuetext={`${d.comfort}미터, ${distanceWords(d.comfort)}. ${comfortHint(d.comfort)}`}
              style={{ ['--fill' as string]: `${((d.comfort - 1) / 19) * 100}%` }} />
            <div className="ob-comfort__ends" aria-hidden="true"><span>1m 가까이</span><span>20m 멀리</span></div>
          </div>
          <p className="ob-hint"><span aria-hidden="true">💡</span>{comfortHint(d.comfort)}</p>
          <p className="ob-fine">정확하지 않아도 괜찮아요. 산책 기록이 쌓이면 댕큐가 조정을 제안해요.</p>
        </>)}

        {step === 3 && (<>
          <h1 ref={headRef} tabIndex={-1} className="ob-title">누가 다가오면<br />어떻게 해 주면 좋을까요?</h1>
          <fieldset className="ob-field">
            <legend className="ob-label">인사 방식</legend>
            <div className="ob-options">
              {(Object.keys(GREETING_LABEL) as Greeting[]).map((g) => (
                <label key={g} className={`ob-option ${d.greeting === g ? 'is-on' : ''}`}>
                  <input type="radio" name={`${id}-greet`} className="ob-vh" checked={d.greeting === g} onChange={() => set('greeting', g)} />
                  <span className="ob-option__emoji" aria-hidden="true">{GREETING_EMOJI[g]}</span>
                  <span className="ob-option__text"><b>{GREETING_LABEL[g]}</b><small>“{GREETING_ASK[g].title}”</small></span>
                  <span className="ob-option__radio" aria-hidden="true">{d.greeting === g && <Check size={14} strokeWidth={3.2} />}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="ob-field">
            <legend className="ob-label">걷는 속도</legend>
            <div className="ob-seg">
              {(Object.keys(PACE_LABEL) as Pace[]).map((p) => (
                <label key={p} className={`ob-seg__item ob-seg__item--tall ${d.pace === p ? 'is-on' : ''}`}>
                  <input type="radio" name={`${id}-pace`} className="ob-vh" checked={d.pace === p} onChange={() => set('pace', p)} />
                  <span className="ob-seg__emoji" aria-hidden="true">{PACE_EMOJI[p]}</span>{PACE_LABEL[p]}
                </label>
              ))}
            </div>
          </fieldset>
        </>)}

        {step === 4 && (<>
          <h1 ref={headRef} tabIndex={-1} className="ob-title">조심해 줬으면<br />하는 게 있나요?</h1>
          <fieldset className="ob-field">
            <legend className="ob-label">놀라는 것 <span className="ob-opt">여러 개 · 없으면 넘어가요</span></legend>
            <div className="ob-chips">
              {(Object.keys(TRIGGER_LABEL) as Trigger[]).map((t) => (
                <Chip key={t} on={d.triggers.includes(t)} onChange={() => set('triggers', toggle(d.triggers, t))}>
                  <span className="ob-chip__e" aria-hidden="true">{TRIGGER_EMOJI[t]}</span>{TRIGGER_LABEL[t]}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="ob-field">
            <legend className="ob-label">주로 산책하는 때 <span className="ob-opt">이웃 추천에 써요</span></legend>
            <div className="ob-chips">
              {(Object.keys(SLOT_LABEL) as Slot[]).map((s) => (
                <Chip key={s} on={d.slots.includes(s)} onChange={() => set('slots', toggle(d.slots, s))}>
                  <span className="ob-chip__e" aria-hidden="true">{SLOT_EMOJI[s]}</span>{SLOT_LABEL[s]}
                </Chip>
              ))}
            </div>
          </fieldset>
          <div className="ob-field">
            <label className="ob-label" htmlFor={`${id}-note`}>한마디 <span className="ob-opt">선택</span></label>
            <div className="ob-inputwrap">
              <input id={`${id}-note`} className="ob-input" maxLength={40} value={d.note} onChange={(e) => set('note', e.target.value)} placeholder="예: 처음엔 옆보다 조금 뒤가 편해요" />
              <span className="ob-counter num" aria-hidden="true">{d.note.length}/40</span>
            </div>
          </div>
        </>)}

        {isPreview && (<>
          <h1 ref={headRef} tabIndex={-1} className="ob-title">{edit ? <>고친 카드를<br />확인해 주세요</> : <>{dogName}의 산책 카드가<br />완성됐어요</>}</h1>
          <article className="ob-card" aria-label={`${dogName}의 산책 카드 미리보기`}>
            <div className="ob-card__photo">
              {d.photo ? <img src={asset(d.photo)} alt="" /> : <span className="ob-card__nophoto" aria-hidden="true">🐶</span>}
              <span className="ob-card__badge">산책 카드</span>
              <div className="ob-card__over">
                <p className="ob-card__name">{dogName}{d.sex && <small>{d.sex === 'm' ? '♂' : '♀'}</small>}<small className="num">{(d.age ?? 0) === 0 ? '1살 미만' : `${d.age}살`}</small></p>
                <p className="ob-card__breed">{[d.breed?.trim(), SIZE_LABEL[d.size]].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            <div className="ob-card__body">
              <p className="ob-card__ask"><span aria-hidden="true">{GREETING_EMOJI[d.greeting]}</span> “{ask.title}”</p>
              <p className="ob-card__askbody">{ask.body}</p>
              <div className="ob-card__dist">
                <div><span className="hf-meta">다른 개와 편한 거리</span><b className="num">{d.comfort}m</b></div>
                <span className="ob-card__steps">{distanceWords(d.comfort)}</span>
              </div>
              <div className="ob-card__chips">
                <span className="hf-chip hf-chip--sm hf-chip--soft">{PACE_EMOJI[d.pace]} {PACE_LABEL[d.pace]}</span>
                {d.triggers.map((t) => <span key={t} className="hf-chip hf-chip--sm">{TRIGGER_EMOJI[t]} {TRIGGER_LABEL[t]}</span>)}
                {d.slots.map((s) => <span key={s} className="hf-chip hf-chip--sm hf-chip--grey">{SLOT_EMOJI[s]} {SLOT_LABEL[s]}</span>)}
              </div>
              {d.note.trim() && <p className="ob-card__note">💬 {d.note.trim()}</p>}
            </div>
          </article>
          <p className="ob-fine ob-fine--c">누가 다가오면 홈의 ‘보여주기’를 눌러 이 카드를 크게 보여 주세요.</p>
        </>)}
      </div>

      <div className="hf-bottom-cta ob-cta">
        {!isPreview && (
          <button className="hf-btn hf-btn--primary hf-btn--block" onClick={next} disabled={busy}>
            {step === 0 && !d.photo ? '사진 없이 다음' : step === LAST_INPUT ? '카드 미리보기' : '다음'}
          </button>
        )}
        {isPreview && <button className="hf-btn hf-btn--primary hf-btn--block" onClick={save}>{edit ? '고친 내용 저장하기' : '카드 저장하기'}</button>}
      </div>

      <Confirm open={replaceAsk} title={`${existing?.name ?? ''} 카드를 새 카드로 바꿀까요?`}
        body="새 카드를 저장하면 지금 카드와 산책·사이 기록, 보낸 요청, 채팅과 약속, 산책으로 받은 배지가 모두 지워져요. 같은 개의 정보를 바꾸려면 취소하고 ‘지금 카드 고치기’를 써 주세요."
        yes="새 카드로 바꾸기" danger onNo={() => setReplaceAsk(false)} onYes={save} />
      <Confirm open={leaving} title="작성 중인 내용이 있어요" body={edit ? '고친 내용은 저장되지 않아요.' : '지금 나가면 입력한 내용이 사라져요.'}
        yes="나가기" no="계속 쓰기" danger onNo={() => setLeaving(false)} onYes={() => { setLeaving(false); leave() }} />
    </div>
  )
}
