import { SQSMessageAttributes, SQSRecord, SQSRecordAttributes } from 'aws-lambda'
import { SQS } from 'aws-sdk'

export class MessageRecord implements SQSRecord {
  private message: SQS.Message
  private arn: string

  constructor(message: SQS.Message, arn: string) {
    this.message = message
    this.arn = arn
  }

  get messageId(): string {
    return this.message.MessageId as string
  }

  get receiptHandle(): string {
    return this.message.ReceiptHandle as string
  }

  get body(): string {
    return this.message.Body as string
  }

  get attributes(): SQSRecordAttributes {
    return this.message.Attributes as unknown as SQSRecordAttributes
  }

  get messageAttributes(): SQSMessageAttributes {
    return this.message.MessageAttributes as unknown as SQSMessageAttributes
  }

  get md5OfBody(): string {
    return this.message.MD5OfBody as string
  }

  get eventSource(): string {
    return 'aws:sqs'
  }

  get eventSourceARN(): string {
    return this.arn
  }

  get awsRegion(): string {
    // arn:aws:sqs:us-east-1:ACCOUNT_NUMBER:QUEUE_NAME
    const components = this.arn.split(':')
    return components[3]
  }
}
