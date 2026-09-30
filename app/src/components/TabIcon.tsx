/** Tab icons drawn from the brand's two-line vocabulary (lines + dots only). Shared by the product tab bar and the brand guide. */
export function TabIcon({ name, scale = 1 }: { name: string; scale?: number }) {
  const common = { width: 26 * scale, height: 20 * scale, viewBox: '0 0 26 20', 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const }
  if (name === '카드') return <svg {...common}><rect x="3" y="2" width="20" height="16" rx="4" /><line x1="7" y1="8" x2="14" y2="8" /><line x1="7" y1="13" x2="19" y2="13" /></svg>
  if (name === '산책') return <svg {...common}><line x1="2" y1="14" x2="18" y2="14" /><circle cx="22" cy="14" r="2" fill="currentColor" /><line x1="6" y1="6" x2="12" y2="6" strokeDasharray="1 4" /></svg>
  if (name === '나란히') return <svg {...common}><line x1="2" y1="6" x2="17" y2="6" /><line x1="7" y1="14" x2="17" y2="14" /><circle cx="22" cy="6" r="2" fill="currentColor" /><circle cx="22" cy="14" r="2" fill="currentColor" /></svg>
  return <svg {...common}><line x1="3" y1="4" x2="23" y2="4" /><line x1="3" y1="10" x2="16" y2="10" /><line x1="3" y1="16" x2="10" y2="16" /></svg>
}
