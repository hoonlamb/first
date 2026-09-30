interface Props { tone?: 'paper' | 'ink'; size?: number; wordmark?: boolean; className?: string }

/**
 * 나란히 마크: two lanes walking the same way. Upper lane = our dog, lower (signal) lane = the other dog, starting later.
 * Clear space = height of one dot on all sides. Minimum mark width 20px.
 */
export function Mark({ tone = 'paper', size = 32 }: { tone?: 'paper' | 'ink'; size?: number }) {
  const a = tone === 'paper' ? '#F4F1EA' : '#15201A'
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 48 36" aria-hidden="true">
      <line x1="3" y1="9" x2="33" y2="9" stroke={a} strokeWidth="6" strokeLinecap="round" />
      <line x1="13" y1="27" x2="33" y2="27" stroke="#FF6A2B" strokeWidth="6" strokeLinecap="round" />
      <circle cx="42" cy="9" r="5" fill={a} />
      <circle cx="42" cy="27" r="5" fill="#FF6A2B" />
    </svg>
  )
}

export function Logo({ tone = 'paper', size = 28, wordmark = true, className }: Props) {
  return (
    <span className={`logo logo--${tone} ${className ?? ''}`} style={{ fontSize: size }}>
      <Mark tone={tone} size={size * 1.2} />
      {wordmark && <span className="logo__word">댕큐</span>}
    </span>
  )
}
