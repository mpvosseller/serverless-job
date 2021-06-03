import { Backoff } from './Backoff'

describe('getExponentialBackoff()', () => {
  test('1st backoff is 30 seconds', () => {
    expect(Backoff.getExponentialBackoff(1)).toBe(30)
  })

  test('12th backoff is 14836 seconds', () => {
    expect(Backoff.getExponentialBackoff(12)).toBe(14836)
  })

  test('cumulative wait time before the 13th attempt is 11h 28m 44s', () => {
    let seconds = 0
    for (let i = 1; i <= 12; i++) {
      seconds += Backoff.getExponentialBackoff(i)
    }
    const hours11 = 11 * 60 * 60
    const minutes28 = 28 * 60
    const seconds44 = 44
    expect(seconds).toBe(hours11 + minutes28 + seconds44)
  })

  test('when a floating point value is passed it uses the floor() of that value', () => {
    expect(Backoff.getExponentialBackoff(1.99999)).toBe(30)
  })

  test('passing zero throws an exception', () => {
    const fn = () => Backoff.getExponentialBackoff(0)
    expect(fn).toThrow('invalid value for attempt: 0')
  })

  test('passing a negative number throws an exception', () => {
    const fn = () => Backoff.getExponentialBackoff(-1)
    expect(fn).toThrow('invalid value for attempt: -1')
  })
})
