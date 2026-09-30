/**
 * Korean particle after a name: 뽀리는 / 솔은, 뽀리가 / 솔이, 뽀리와 / 솔과, 뽀리를 / 솔을, 뽀리의.
 * Non-Hangul endings (Max, 🐶) use the neutral "(이)" style so the sentence never breaks.
 */
type Pair = '은/는' | '이/가' | '과/와' | '을/를' | '이/(없음)'

function lastHangul(word: string): { hangul: boolean; batchim: boolean } {
  const chars = Array.from(word.trim())
  const last = chars[chars.length - 1] ?? ''
  const code = last.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) return { hangul: true, batchim: (code - 0xac00) % 28 !== 0 }
  return { hangul: false, batchim: false }
}

export function josa(word: string, pair: Pair): string {
  const { hangul, batchim } = lastHangul(word)
  const [withB, withoutB] = pair.split('/')
  if (!hangul) {
    if (pair === '이/(없음)') return word
    return `${word}${pair === '은/는' ? '(은)는' : pair === '이/가' ? '(이)가' : pair === '과/와' ? '(과)와' : '(을)를'}`
  }
  if (pair === '이/(없음)') return batchim ? `${word}이` : word // 솔이는 / 뽀리는 (호칭형)
  return `${word}${batchim ? withB : withoutB}`
}

/** Count what people see as characters (emoji = 1). */
export function visibleLength(s: string) {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment: (s: string) => Iterable<unknown> } }).Segmenter
  if (Seg) return Array.from(new Seg('ko', { granularity: 'grapheme' }).segment(s)).length
  return Array.from(s).length
}

/**
 * Distance in everyday units first, meters second. Owners and passers-by can't judge "8m";
 * they can count steps. One big adult stride ≈ 0.8m (approximation, stated as "쯤").
 */
export function strides(m: number) {
  return Math.max(1, Math.round(m / 0.8))
}
export function distanceWords(m: number) {
  return `큰 걸음 ${strides(m)}번쯤`
}
