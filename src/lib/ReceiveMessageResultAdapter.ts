import { SQSEvent } from 'aws-lambda'
import { SQS } from 'aws-sdk'
import { MessageRecord } from './MessageRecord'

export class ReceiveMessageResultAdapter {
  static createSqsEvent(
    messageResult: SQS.ReceiveMessageResult,
    arn: string
  ): SQSEvent | undefined {
    const messages = messageResult.Messages
    if (!messages?.length) {
      return undefined
    }
    const records = messages.map((m) => new MessageRecord(m, arn))
    const event = {
      Records: records,
    }
    return event
  }
}
