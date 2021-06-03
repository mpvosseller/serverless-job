import { SQSEvent } from 'aws-lambda'
import { ReceiveMessageResultAdapter } from './ReceiveMessageResultAdapter'
import { getSqsClient } from './SqsClient'
import { ReceiveMessageRequestOptions } from './SqsQueue'

export class Poller {
  static async poll(
    queueName?: string,
    options?: ReceiveMessageRequestOptions
  ): Promise<SQSEvent | undefined> {
    const client = getSqsClient()
    const queue = await client.getQueue(queueName)
    const result = await queue.receiveMessage(options)
    const event = ReceiveMessageResultAdapter.createSqsEvent(result, queue.getArn())
    return event
  }
}
