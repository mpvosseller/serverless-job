import { SQSMessageAttributes, SQSRecord, SQSRecordAttributes } from 'aws-lambda'
import { SQS } from 'aws-sdk'
import { MessageAttributeValue } from 'aws-sdk/clients/sqs'

export class MessageRecord implements SQSRecord {
  private message: SQS.Message
  private arn: string

  constructor(message: SQS.Message, arn: string) {
    this.message = message
    this.arn = arn

    // convert each SQS.MessageAttributeValue (which uses PascalCase) to an SQSMessageAttribute (which uses camalCase)
    for (const name in this.messageAttributes) {
      const attribute = this.messageAttributes[name]
      const original = attribute as unknown as MessageAttributeValue
      attribute.stringValue = original.StringValue
      attribute.binaryValue = original.BinaryValue as string | undefined // XXX when BinaryValue is a Buffer,Uint8Array, or Blob does Lambda convert it to a string?
      attribute.dataType = original.DataType
    }
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
