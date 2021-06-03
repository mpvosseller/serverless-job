import { SQSRecord } from 'aws-lambda'
import { JobRecord } from './JobRecord'

function createSqsRecord({
  body = 'someBody',
  messageId = 'someMessageId',
  receiptHandle = 'someReceiptHandle',
  eventSourceARN = 'arn:aws:sqs:us-east-1:123456789012:someQueue',
  sentTimestamp = '1234567890123',
  approximateReceiveCount = '42',
}: {
  body?: string
  messageId?: string
  receiptHandle?: string
  eventSourceARN?: string
  sentTimestamp?: string
  approximateReceiveCount?: string
} = {}): SQSRecord {
  return {
    body,
    messageId,
    receiptHandle,
    eventSourceARN,
    attributes: {
      SentTimestamp: sentTimestamp,
      ApproximateReceiveCount: approximateReceiveCount,
    },
  } as SQSRecord
}

test('body() returns the correct value', () => {
  const jobRecord = new JobRecord(createSqsRecord({ body: 'myBody' }))
  expect(jobRecord.body).toBe('myBody')
})

test('messageId() returns the correct value', () => {
  const jobRecord = new JobRecord(createSqsRecord({ messageId: 'myMessageId' }))
  expect(jobRecord.messageId).toBe('myMessageId')
})

test('receiptHandle() returns the correct value', () => {
  const jobRecord = new JobRecord(createSqsRecord({ receiptHandle: 'myReceiptHandle' }))
  expect(jobRecord.receiptHandle).toBe('myReceiptHandle')
})

test('queueName() returns the correct queue name', () => {
  const jobRecord = new JobRecord(
    createSqsRecord({ eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:my-queue' })
  )
  expect(jobRecord.queueName).toBe('my-queue')
})

test('sentAt() returns the correct date', () => {
  const jobRecord = new JobRecord(createSqsRecord({ sentTimestamp: '9876543210987' }))
  expect(jobRecord.sentAt.getTime()).toBe(9876543210987)
})

test('receiveCount() returns the correct count', () => {
  const jobRecord = new JobRecord(createSqsRecord({ approximateReceiveCount: '42' }))
  expect(jobRecord.receiveCount).toBe(42)
})
