/* eslint-disable @typescript-eslint/no-explicit-any */
import { Event } from './Event'

type EventBuilderOption =
  | 'valid'
  | 'falsy'
  | 'records-not-array'
  | 'records-length-zero'
  | 'receipt-handle-not-string'
  | 'body-not-string'
  | 'job-attribute-not-present'
  | 'job-attribute-wrong-value'

class EventBuilder {
  private option: EventBuilderOption

  constructor(option: EventBuilderOption) {
    this.option = option
  }

  build(): any {
    let event = this.validEvent()

    switch (this.option) {
      case 'falsy':
        event = false
        break
      case 'records-not-array':
        event.Records = 'notAnArray'
        break
      case 'records-length-zero':
        event.Records = []
        break
      case 'receipt-handle-not-string':
        event.Records[0].receiptHandle = 13
        break
      case 'body-not-string':
        event.Records[0].body = 13
        break
      case 'job-attribute-not-present':
        delete event.Records[0].messageAttributes['serverless-job']
        break
      case 'job-attribute-wrong-value':
        event.Records[0].messageAttributes['serverless-job'].stringValue = 13
        break
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return event
  }

  validEvent(): any {
    return {
      Records: [
        {
          messageAttributes: {
            'serverless-job': {
              stringValue: '1',
            },
          },
          receiptHandle: 'someReceiptHandle',
          body: 'someBody',
        },
      ],
    }
  }
}

describe('isJobEvent()', () => {
  test('return true when event is a valid job event', () => {
    const event = new EventBuilder('valid').build()
    expect(Event.isJobEvent(event)).toBe(true)
  })

  test('returns false when event is falsy', () => {
    const event = new EventBuilder('falsy').build()
    expect(Event.isJobEvent(event)).toBe(false)
  })

  test('returns false when Records is not an array', () => {
    const event = new EventBuilder('records-not-array').build()
    expect(Event.isJobEvent(event)).toBe(false)
  })

  test('returns false when length of Records array is zero', () => {
    const event = new EventBuilder('records-length-zero').build()
    expect(Event.isJobEvent(event)).toBe(false)
  })

  test('returns false when receiptHandle is not a string', () => {
    const event = new EventBuilder('receipt-handle-not-string').build()
    expect(Event.isJobEvent(event)).toBe(false)
  })

  test('returns false when body is not a string', () => {
    const event = new EventBuilder('body-not-string').build()
    expect(Event.isJobEvent(event)).toBe(false)
  })

  test('returns false when job attribute is not present', () => {
    const event = new EventBuilder('job-attribute-not-present').build()
    expect(Event.isJobEvent(event)).toBe(false)
  })

  test('returns false when job attribute has wrong value', () => {
    const event = new EventBuilder('job-attribute-wrong-value').build()
    expect(Event.isJobEvent(event)).toBe(false)
  })
})
