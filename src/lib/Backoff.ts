export class Backoff {
  static getExponentialBackoff(attempt: number): number {
    attempt = Math.floor(attempt)
    if (attempt < 1) {
      throw new Error(`invalid value for attempt: ${attempt}`)
    }

    // https://github.com/mperham/sidekiq/wiki/Error-Handling#automatic-job-retry
    const retryCount = attempt - 1
    return Math.pow(retryCount, 4) + 15 + 15 * (retryCount + 1)
  }
}
