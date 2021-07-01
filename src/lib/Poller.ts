import { SQSEvent } from 'aws-lambda'
import { getQueueClient, ReceiveMessageRequestOptions } from './Queue'
import { ReceiveMessageResultAdapter } from './ReceiveMessageResultAdapter'
import { ServerlessJob } from './ServerlessJob'

export class Poller {
  private running = false
  private purgeOnStart: boolean
  private queueName: string
  private handler: ((event: SQSEvent) => Promise<unknown>) | undefined
  private options: ReceiveMessageRequestOptions | undefined

  constructor({
    handler,
    queueName,
    options,
    purgeOnStart = false,
    autoStart = true,
  }: {
    handler?: (event: SQSEvent) => Promise<unknown>
    queueName?: string
    options?: ReceiveMessageRequestOptions
    purgeOnStart?: boolean
    autoStart?: boolean
  } = {}) {
    this.queueName = queueName || ServerlessJob.getDefaultQueueName()
    this.handler = handler
    this.options = {
      WaitTimeSeconds: 20,
      ...options,
    }
    this.purgeOnStart = purgeOnStart
    if (autoStart) {
      this.start()
    }
  }

  start(): void {
    if (!this.running) {
      this.running = true
      void this.run()
    }
  }

  stop(): void {
    this.running = false
  }

  private async run(): Promise<void> {
    if (this.purgeOnStart) {
      console.log(`purging queue ${this.queueName}`)
      await Poller.purge(this.queueName)
    }

    console.log(`polling queue ${this.queueName}`)
    while (this.running) {
      const event = await Poller.poll(this.queueName, this.options)
      if (event) {
        try {
          if (this.handler) {
            await this.handler(event)
          } else {
            await ServerlessJob.handleEvent(event)
          }
        } catch (e: unknown) {
          console.error(JSON.stringify(event))
          console.error(e)
        }
      }
    }
  }

  private static async poll(
    queueName?: string,
    options?: ReceiveMessageRequestOptions
  ): Promise<SQSEvent | undefined> {
    const client = getQueueClient()
    const queue = await client.getQueue(queueName)
    const result = await queue.receiveMessage(options)
    const event = ReceiveMessageResultAdapter.createSqsEvent(result, queue.getArn())
    return event
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private static async purge(queueName?: string): Promise<{}> {
    const client = getQueueClient()
    const queue = await client.getQueue(queueName)
    return queue.purgeQueue()
  }
}
