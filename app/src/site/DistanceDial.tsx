import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lanes } from '../components/Lanes'
import type { Greeting, Reaction } from '../lib/store'
import { GREETING_LABEL, reactionAt } from '../lib/store'
import { distanceWords, josa } from '../lib/korean'

const SAMPLES: { id: string; name: string; comfort: number; greeting: Greeting; line: string }[] = [
  { id: 'ppori', name: '뽀리', comfort: 8, greeting: 'slow', line: '냄새 먼저, 손은 나중에' },
  { id: 'mango', name: '망고', comfort: 15, greeting: 'pass', line: '인사 없이 지나가 주세요' },
  { id: 'kong', name: '콩이', comfort: 3, greeting: 'hello', line: '먼저 물어봐 주세요' },
]


/**
 * Signature interaction #1 — 거리 다이얼.
 * Visitor plays the approaching dog. The same distance means different things to different dogs.
 */
export function DistanceDial() {
  const [dogId, setDogId] = useState('ppori')
  const [distance, setDistance] = useState(20)
  const [touched, setTouched] = useState(false)
  const dog = SAMPLES.find((d) => d.id === dogId)!
  const state = reactionAt(distance, dog.comfort)
  const id = useId()
  const theirState: Reaction = state === 'react' ? 'alert' : 'calm'

  const message =
    state === 'calm'
      ? `${josa(dog.name, '은/는')} 편안해요. 이 거리라면 편하게 지나갈 수 있어요.`
      : state === 'alert'
        ? `${dog.name}의 귀가 섰어요. 여기서 더 다가오지 말아 주세요.`
        : `너무 가까워요. ${josa(dog.name, '은/는')} 지금 자리를 피하고 싶어요.`

  return (
    <div className="dial">
      <fieldset className="dial__dogs">
        <legend className="dial__legend">오늘 산책길에서 만난 개</legend>
        <div className="dial__tabs">
          {SAMPLES.map((d) => (
            <label key={d.id} className="dial__tab">
              <input type="radio" name={`${id}-dog`} value={d.id} checked={dogId === d.id} onChange={() => setDogId(d.id)} />
              <span><b>{d.name}</b><small>{GREETING_LABEL[d.greeting]}</small></span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={`dial__stage dial__stage--${state}`}>
        <Lanes distance={distance} me={{ name: dog.name, state }} them={{ name: '당신의 개', state: theirState }} walking theme="ink" height={400} />
        <div className="dial__legend-lanes" aria-hidden="true">
          <span><i className="dot dot--paper" />{dog.name}</span>
          <span><i className="dot dot--signal" />다가가는 당신의 개</span>
        </div>
      </div>

      <div className="dial__control">
        <label htmlFor={`${id}-range`} className="dial__label">
          {touched ? '거리를 조절해 보세요' : '슬라이더를 왼쪽으로 옮겨 다가가 보세요'}
        </label>
        <input
          id={`${id}-range`}
          className="range range--ink"
          type="range" min={1} max={20} step={1}
          value={distance}
          onChange={(e) => { setDistance(Number(e.target.value)); setTouched(true) }}
          aria-valuetext={`${distance}미터. ${message}`}
          style={{ ['--fill' as string]: `${((distance - 1) / 19) * 100}%` }}
        />
        <div className="dial__ends" aria-hidden="true"><span>가까이 1m</span><span>멀리 20m</span></div>
      </div>

      <p className={`dial__status dial__status--${state}`} aria-live="polite">
        <span className="dial__num num">{distance}m</span>
        <span>{message}</span>
      </p>
      <p className="dial__truth">
        {dog.name}의 편한 거리는 <b className="num">{dog.comfort}m</b>({distanceWords(dog.comfort)}). 같은 {distance}m라도 개마다 다르게 느껴요.
      </p>
      {touched && (
        <Link className="btn btn-signal dial__cta" to="/app/card/new">우리 개의 거리로 카드 만들기 <span aria-hidden="true">→</span></Link>
      )}
    </div>
  )
}
