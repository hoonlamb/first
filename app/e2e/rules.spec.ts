import { expect, test } from '@playwright/test'
import { planFor, ladder } from '../src/lib/demo'
import { josa, strides } from '../src/lib/korean'

// QA F-04 done criteria, fixed as unit tests over every comfort combination.
test('나란히 rules hold for every comfort pair', () => {
  for (let a = 1; a <= 20; a++) {
    for (let b = 1; b <= 20; b++) {
      const me = { comfort: a, greeting: 'slow' as const }
      const n = { comfort: b, greeting: 'slow' as const }
      const first = planFor(me, n)
      const maxC = Math.max(a, b)
      expect(first.start).toBeGreaterThanOrEqual(maxC + 2)
      expect(Math.min(...first.steps)).toBeGreaterThanOrEqual(6)
      expect(Math.min(...first.steps)).toBeGreaterThanOrEqual(Math.round(maxC * 0.6))
      expect(first.canGreet).toBe(false) // never greet on a first meeting
      for (let k = 1; k < first.steps.length; k++) {
        expect(first.steps[k]).toBeLessThan(first.steps[k - 1])
        expect(first.steps[k]).toBeGreaterThanOrEqual(first.steps[k - 1] * 0.65 - 1e-9) // ≤35% per step
      }
      const last = Math.min(...first.steps)
      const second = planFor(me, n, [{ closest: last }])
      expect(second.start).toBeGreaterThan(last) // warm up farther than last time
      expect(first.needsPro).toBe(maxC >= 12)
    }
  }
})

test('ladder never goes below its floor', () => {
  expect(ladder(25, 12)).toEqual([25, 18, 12])
  expect(ladder(10, 6)).toEqual([10, 8, 6])
})

test('korean particles', () => {
  expect(josa('뽀리', '은/는')).toBe('뽀리는')
  expect(josa('솔', '은/는')).toBe('솔은')
  expect(josa('솔', '과/와')).toBe('솔과')
  expect(josa('보름', '이/가')).toBe('보름이')
  expect(josa('Max', '은/는')).toBe('Max(은)는')
  expect(strides(8)).toBe(10)
})
