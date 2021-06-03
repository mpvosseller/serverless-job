import { SQS } from 'aws-sdk'
import { createSqsQueue } from './createSqsQueue'
import { ServerlessJob } from './ServerlessJob'
import { SqsQueue } from './SqsQueue'

export class SqsClient {
  private sqs: SQS
  private queues: Record<string, SqsQueue | undefined>

  constructor() {
    this.sqs = new SQS(ServerlessJob.getConfig().sqs)
    this.queues = {}
  }

  getSqs(): SQS {
    return this.sqs
  }

  async getQueue(name?: string): Promise<SqsQueue> {
    name = name || this.getDefaultQueueName()
    let queue = this.queues[name]
    if (!queue) {
      queue = await createSqsQueue(name)
      this.queues[name] = queue
    }
    return queue
  }

  private getDefaultQueueName(): string {
    const name = ServerlessJob.getConfig().defaultQueueName
    if (!name) {
      throw new Error('failed to find default queue name')
    }
    return name
  }
}

let instance: SqsClient | undefined

export function getSqsClient(): SqsClient {
  if (!instance) {
    instance = new SqsClient()
  }
  return instance
}
