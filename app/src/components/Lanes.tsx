import { Dog } from './Dog'
import type { Reaction } from '../lib/store'
import { useEffect, useState } from 'react'
import { useTween } from '../lib/motion'

interface DogSpec { name: string; state: Reaction }

interface Props {
  distance: number
  max?: number
  me: DogSpec
  them?: DogSpec | null
  walking?: boolean
  theme?: 'ink' | 'paper'
  height?: number
  showLabel?: boolean
  label?: string
}

/**
 * The brand's core graphic: two dogs on two parallel lanes (나란히).
 * The gap between the lanes IS the distance. Used in hero, 나란히 guide and records so the idea reads the same everywhere.
 */
export function Lanes({ distance, max = 20, me, them, walking = false, theme = 'ink', height = 420, showLabel = true, label }: Props) {
  const W = 1000
  const H = height
  const mid = H / 2 + 28
  const shown = useTween(distance)
  // Walking animation plays for a few seconds after each change, then rests (no endless motion, less battery).
  const key = `${distance}-${me.state}-${them?.state ?? ''}`
  const [restedKey, setRestedKey] = useState<string | null>(null)
  const moving = walking && restedKey !== key
  useEffect(() => {
    if (!walking) return
    const t = setTimeout(() => setRestedKey(key), 5000)
    return () => clearTimeout(t)
  }, [walking, key])
  const t = Math.min(Math.max(shown / max, 0), 1)
  const gap = 104 + t * (H - 236)
  const yMe = mid - gap / 2
  const yThem = mid + gap / 2
  const meColor = theme === 'ink' ? '#F4F1EA' : '#15201A'
  const meDetail = theme === 'ink' ? '#15201A' : '#F4F1EA'
  const dogX = 620
  const bracketX = 850

  return (
    <svg className={`lanes lanes--${theme} ${moving ? 'is-walking' : ''}`} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`${me.name}${them ? `와 ${them.name}` : ''} 사이의 거리 ${distance}미터`}>
      {/* lanes: walked part solid, ahead dashed */}
      <g className="lane" transform={`translate(0,${yMe})`}>
        <line x1="40" y1="0" x2={dogX - 70} y2="0" stroke={meColor} strokeWidth="6" strokeLinecap="round" />
        <line className="lane__ahead" x1={dogX + 80} y1="0" x2={W - 40} y2="0" stroke={meColor} strokeWidth="6" strokeLinecap="round" strokeDasharray="2 22" opacity=".55" />
        <g transform={`translate(${dogX},-40) scale(1.5)`}><Dog state={me.state} color={meColor} detail={meDetail} walking={moving} /></g>
      </g>
      {them && (
        <g className="lane" transform={`translate(0,${yThem})`}>
          <line x1="80" y1="0" x2={dogX - 90} y2="0" stroke="#FF6A2B" strokeWidth="6" strokeLinecap="round" />
          <line className="lane__ahead" x1={dogX + 60} y1="0" x2={W - 40} y2="0" stroke="#FF6A2B" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 22" opacity=".55" />
          <g transform={`translate(${dogX - 20},-40) scale(1.5)`}><Dog state={them.state} color="#FF6A2B" detail="#15201A" walking={moving} /></g>
        </g>
      )}
      {showLabel && them && (
        <g className="bracket" aria-hidden="true">
          <line x1={bracketX} x2={bracketX} y1={yMe + 12} y2={yThem - 12} stroke={theme === 'ink' ? '#9FD3B2' : '#1F6B45'} strokeWidth="2" className="bracket__line" />
          <line x1={bracketX - 10} x2={bracketX + 10} y1={yMe + 12} y2={yMe + 12} stroke={theme === 'ink' ? '#9FD3B2' : '#1F6B45'} strokeWidth="2" />
          <line x1={bracketX - 10} x2={bracketX + 10} y1={yThem - 12} y2={yThem - 12} stroke={theme === 'ink' ? '#9FD3B2' : '#1F6B45'} strokeWidth="2" />
          <text x={bracketX + 22} y={mid + 10} className="bracket__text" fill={theme === 'ink' ? '#9FD3B2' : '#1F6B45'}>{label ?? `${distance}m`}</text>
        </g>
      )}
    </svg>
  )
}
