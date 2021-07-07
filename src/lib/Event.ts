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
    // check messageAttributes
    if (
      record.messageAttributes?.[ServerlessJobAttributeName]?.stringValue ===
      ServerlessJobAttributeValue
    ) {
      return true
    }

    // some services may not support inclusion of messageAttributes (e.g. EventBridge doesn't support passing this field)
    // to support things like Scheduled Events we also we look for a top level messageAttributes field in the body
    try {
      const body = JSON.parse(record.body) as { messageAttributes?: Record<string, unknown> }
      if (body.messageAttributes?.[ServerlessJobAttributeName] === ServerlessJobAttributeValue) {
        return true
      }
    } catch (e: unknown) {
      // body is not json so ignore
    }

    return false
  }
}
