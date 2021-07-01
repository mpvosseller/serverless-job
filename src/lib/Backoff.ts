export class Backoff {
  // after attempt 1 we wait 30 seconds to start at T 30 30 seconds
  // after attempt 2 we wait 46 seconds to start at T 76 1.3 minutes
  // after attempt 3 we wait 76 seconds to start at T 152 2.5 minutes
  // after attempt 4 we wait 156 seconds to start at T 308 5.1 minutes
  // after attempt 5 we wait 346 seconds to start at T 654 10.9 minutes
  // after attempt 6 we wait 730 seconds to start at T 1384 23 minutes
  // after attempt 7 we wait 1416 seconds to start at T 2800 46.7 minutes
  // after attempt 8 we wait 2536 seconds to start at T 5336 1.5 hours
  // after attempt 9 we wait 4246 seconds to start at T 9582 2.7 hours
  // after attempt 10 we wait 6726 seconds to start at T 16308 4.5 hours
  // after attempt 11 we wait 10180 seconds to start at T 26488 7.4 hours
  // after attempt 12 we wait 14836 seconds to start at T 41324 11.5 hours
  // after attempt 13 we wait 20946 seconds to start at T 62270 17.3 hours
  // after attempt 14 we wait 28786 seconds to start at T 91056 25.3 hours
  //
  // default maxAttempts is 13 so it would be attempted ~11.5 hours after the initial attempt
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
