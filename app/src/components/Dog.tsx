import type { Reaction } from '../lib/store'

interface Props {
  state: Reaction
  color: string
  detail: string // eye / nose color
  walking?: boolean
}

/* Posture paths per state (dog faces right, body centred at 0,0). Emotion lives in ear, tail and head height — not a face. */
const EAR: Record<Reaction, string> = {
  calm: 'M22 -29 C 16 -27, 13 -18, 16 -9 C 21 -13, 25 -21, 27 -29 Z',
  alert: 'M21 -28 C 19 -38, 21 -45, 25 -48 C 30 -42, 31 -35, 30 -28 Z',
  react: 'M21 -27 C 13 -30, 5 -28, 0 -24 C 8 -21, 15 -21, 23 -22 Z',
}
const TAIL: Record<Reaction, string> = {
  calm: 'M-30 -6 C -40 -9, -46 -13, -52 -12',
  alert: 'M-30 -8 C -37 -16, -39 -28, -35 -38',
  react: 'M-30 2 C -35 9, -30 17, -21 16',
}

export function Dog({ state, color, detail, walking = false }: Props) {
  return (
    <g className={`dog dog--${state} ${walking ? 'is-walking' : ''}`}>
      <g className="dog__whole">
        <g className="dog__legs" stroke={color} strokeWidth="6" strokeLinecap="round">
          <line className="leg leg-a" x1="-20" y1="6" x2="-22" y2="26" />
          <line className="leg leg-b" x1="-10" y1="6" x2="-10" y2="26" />
          <line className="leg leg-b" x1="10" y1="6" x2="10" y2="26" />
          <line className="leg leg-a" x1="20" y1="6" x2="22" y2="26" />
        </g>
        <path className="dog__tail" d={TAIL[state]} stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />
        <rect x="-32" y="-14" width="62" height="26" rx="13" fill={color} />
        <g className="dog__head">
          <circle cx="30" cy="-18" r="14" fill={color} />
          <rect x="36" y="-21" width="14" height="10" rx="5" fill={color} />
          <circle cx="49" cy="-17" r="2.6" fill={detail} />
          <circle cx="34" cy="-23" r="2.4" fill={detail} />
          <path className="dog__ear" d={EAR[state]} fill={color} stroke={detail} strokeWidth="2" strokeLinejoin="round" />
        </g>
      </g>
    </g>
  )
}
