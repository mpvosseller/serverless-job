import { SQSEvent, SQSRecord } from 'aws-lambda'
import { ServerlessJobAttributeName, ServerlessJobAttributeValue } from './MessageBuilder'

export class Event {
  static isJobEvent(event: unknown): boolean {
    return this.isSqsEvent(event) && this.hasJobRecord(event)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static isSqsEvent(e: any): e is SQSEvent {
    const event = e as Partial<SQSEvent> | undefined
    return !!(
      event &&
      Array.isArray(event.Records) &&
      event.Records.length > 0 &&
      typeof event.Records[0].receiptHandle === 'string' &&
      typeof event.Records[0].body === 'string'
    )
  }

  private static hasJobRecord(event: SQSEvent): boolean {
    return event.Records.some((record) => this.isJobRecord(record))
  }

  private static isJobRecord(record: SQSRecord): boolean {
    return (
      record.messageAttributes[ServerlessJobAttributeName]?.stringValue ===
      ServerlessJobAttributeValue
    )
  }
}
