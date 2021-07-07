import { SQSRecord } from 'aws-lambda'
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
      await job.perform()
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
        await this.deleteMessage() // retry_stopped
      } else {
        if (ServerlessJob.getConfig().debug) {
          console.log(`retrying job in ${nextVisibilityTimeout} seconds`)
        }
        await this.updateMessageVisibility(nextVisibilityTimeout) // enqueue_retry
        error = e
      }
    }

    return {
      error,
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
