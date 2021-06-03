import { SQSRecord } from 'aws-lambda'

export class JobRecord {
  private sqsRecord: SQSRecord

  constructor(sqsRecord: SQSRecord) {
    this.sqsRecord = sqsRecord
  }

  public get body(): string {
    return this.sqsRecord.body
  }

  public get messageId(): string {
    return this.sqsRecord.messageId
  }

  public get receiptHandle(): string {
    return this.sqsRecord.receiptHandle
  }

  public get queueName(): string {
    const arnParts = this.sqsRecord.eventSourceARN.split(':')
    return arnParts[arnParts.length - 1]
  }

  public get sentAt(): Date {
    return new Date(parseInt(this.sqsRecord.attributes.SentTimestamp))
  }

  public get receiveCount(): number {
    return parseInt(this.sqsRecord.attributes.ApproximateReceiveCount)
  }
}
