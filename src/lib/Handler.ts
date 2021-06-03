import { SQSEvent } from 'aws-lambda'
import { DequeuedJob, DequeuedJobResult } from './DequeuedJob'

export class Handler {
  static async handleEvent(event: SQSEvent): Promise<void> {
    const jobs = event.Records.map((r) => new DequeuedJob(r))
    const results = await this.performAll(jobs)
    const firstResultWithError = results.find((r) => r.error)
    if (firstResultWithError?.error) {
      throw firstResultWithError.error
    }
  }

  private static async performAll(jobs: DequeuedJob[]): Promise<DequeuedJobResult[]> {
    const results = []
    for (const job of jobs) {
      results.push(await job.perform())
    }
    return results
  }
}
