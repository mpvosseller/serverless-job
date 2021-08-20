import { SQS } from 'aws-sdk'
import AWSXRay from 'aws-xray-sdk'
import { createSqsQueue } from './createSqsQueue'
import { QueueClient } from './Queue'
import { ServerlessJob } from './ServerlessJob'
import { SqsQueue } from './SqsQueue'

export class SqsClient implements QueueClient {
  private sqs: SQS
  private queues: Record<string, SqsQueue | undefined>

  constructor() {
    let sqsClient = new SQS(ServerlessJob.getConfig().sqs)
    if (ServerlessJob.getConfig().xRayTracing) {
      sqsClient = AWSXRay.captureAWSClient(sqsClient)
    }
    this.sqs = sqsClient
    this.queues = {}
  }

  getSqs(): SQS {
    return this.sqs
  }

  async getQueue(name?: string): Promise<SqsQueue> {
    name = name || ServerlessJob.getDefaultQueueName()
    let queue = this.queues[name]
    if (!queue) {
      queue = await createSqsQueue({ client: this, name })
      this.queues[name] = queue
    }
    return queue
  }
}
