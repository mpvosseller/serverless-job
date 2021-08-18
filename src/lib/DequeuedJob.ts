import { SQSRecord } from 'aws-lambda'
import { CloudWatchMetricLogger } from './CloudWatchMetricLogger'
import { BaseJob } from './Job'
import { JobRecord } from './JobRecord'
import { JobSerializer } from './JobSerializer'
import { getQueueClient, Queue } from './Queue'
import { SerializableJob } from './SerializableJob'
import { ServerlessJob } from './ServerlessJob'

export type DequeuedJobResult = {
  error?: unknown
}

export class DequeuedJob {
  private record: JobRecord

  constructor(sqsRecord: SQSRecord) {
    this.record = new JobRecord(sqsRecord)
  }

  async perform(): Promise<DequeuedJobResult> {
    let job: SerializableJob | undefined
    let error: unknown | undefined

    try {
      job = JobSerializer.deserialize(this.record.body)
      await this.performJob({ job, jobRecord: this.record })
      await this.deleteMessage()
    } catch (e: unknown) {
      console.error(JSON.stringify(e))
      const jobClass = (job?.clazz || BaseJob) as typeof BaseJob
      const maxAttempts = jobClass.maxAttempts()
      const nextVisibilityTimeout = jobClass.getBackoff(this.record.receiveCount)
      if (this.record.receiveCount >= maxAttempts) {
        if (ServerlessJob.getConfig().debug) {
          console.log('deleting job: maxAttempts reached')
        }
        await this.deleteMessage()
        CloudWatchMetricLogger.logEvent({
          name: 'retry_stopped',
          job,
          jobRecord: this.record,
          error: e as Error,
        })
      } else {
        if (ServerlessJob.getConfig().debug) {
          console.log(`retrying job in ${nextVisibilityTimeout} seconds`)
        }
        await this.updateMessageVisibility(nextVisibilityTimeout)
        error = e
        CloudWatchMetricLogger.logEvent({
          name: 'enqueue_retry',
          job,
          jobRecord: this.record,
          error: e as Error,
          nextVisibilityTimeout,
        })
      }
    }

    return {
      error,
    }
  }

  private async performJob({
    job,
    jobRecord,
  }: {
    job: SerializableJob
    jobRecord: JobRecord
  }): Promise<void> {
    CloudWatchMetricLogger.logEvent({
      name: 'perform_start',
      job,
      jobRecord,
    })
    const performStart = Date.now()
    let error: unknown = undefined
    try {
      await job.perform()
    } catch (e: unknown) {
      error = e
      throw e
    } finally {
      const performEnd = Date.now()
      const duration = performEnd - performStart
      CloudWatchMetricLogger.logEvent({
        name: 'perform',
        job,
        jobRecord,
        error: error as Error,
        duration,
      })
    }
  }

  private async deleteMessage(): Promise<void> {
    try {
      const queue = await this.getQueue()
      await queue.deleteMessage(this.record.receiptHandle)
    } catch (error: unknown) {
      console.warn('deleteMessage() failed:', error)
    }
  }

  private async updateMessageVisibility(nextVisibilityTimeout: number): Promise<void> {
    try {
      const queue = await this.getQueue()
      await queue.changeMessageVisibility({
        receiptHandle: this.record.receiptHandle,
        visibilityTimeout: nextVisibilityTimeout,
      })
    } catch (error: unknown) {
      console.warn('updateMessageVisibility() failed:', error)
    }
  }

  private async getQueue(): Promise<Queue> {
    return getQueueClient().getQueue(this.record.queueName)
  }
}
