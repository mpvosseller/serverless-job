import { SQS } from 'aws-sdk'
import { mocked } from 'ts-jest/utils'
import { SqsClient } from './SqsClient'
import { SqsQueue } from './SqsQueue'

const SQSMock = mocked(SQS, true)
const sqsSendMessageMock = SQSMock.prototype.sendMessage
const sqsDeleteMessageMock = SQSMock.prototype.deleteMessage
const sqsChangeMessageVisibilityMock = SQSMock.prototype.changeMessageVisibility
const sqsReceiveMessageMock = SQSMock.prototype.receiveMessage

beforeEach(() => {
  jest.resetAllMocks()
})

function setup({
  name = 'someName',
  url = 'someUrl',
  arn = 'someArn',
  maxReceiveCount = 3,
  receiveMessageResult,
}: {
  name?: string
  url?: string
  arn?: string
  maxReceiveCount?: number
  receiveMessageResult?: unknown
} = {}) {
  const client = new SqsClient()

  sqsSendMessageMock.mockReturnValue({
    promise: jest.fn(),
  } as any)

  sqsDeleteMessageMock.mockReturnValue({
    promise: jest.fn(),
  } as any)

  sqsChangeMessageVisibilityMock.mockReturnValue({
    promise: jest.fn(),
  } as any)

  sqsReceiveMessageMock.mockReturnValue({
    promise: jest.fn().mockResolvedValue(receiveMessageResult),
  } as any)

  const attributes = {
    RedrivePolicy: JSON.stringify({
      maxReceiveCount: `${maxReceiveCount}`,
    }),
    QueueArn: arn,
  } as SQS.QueueAttributeMap

  const queue = new SqsQueue({
    client,
    name,
    url,
    attributes,
  })
  return {
    queue,
  }
}

test('getUrl() returns the url', () => {
  const { queue } = setup({ url: 'myQueueUrl' })
  expect(queue.getUrl()).toBe('myQueueUrl')
})

test('getArn() returns the arn', () => {
  const { queue } = setup({ arn: 'myArn' })
  expect(queue.getArn()).toBe('myArn')
})

test('isFifo() returns true when name ends in .fifo', () => {
  const { queue } = setup({ name: 'myQueueName.fifo' })
  expect(queue.isFifo()).toBe(true)
})

test('isFifo() returns false when name does not end in .fifo', () => {
  const { queue } = setup({ name: 'myQueueName' })
  expect(queue.isFifo()).toBe(false)
})

test('getMaxReceiveCount() returns the maxReceiveCount of the redrive policy', () => {
  const { queue } = setup({ maxReceiveCount: 42 })
  expect(queue.getMaxReceiveCount()).toBe(42)
})

test('sendMessage() calls SQS.sendMessage() with expected arguments', async () => {
  const { queue } = setup({ url: 'myQueueUrl' })

  await queue.sendMessage({ MessageBody: 'myMessageBody', DelaySeconds: 42 })

  expect(sqsSendMessageMock).toBeCalledTimes(1)
  expect(sqsSendMessageMock).toBeCalledWith({
    QueueUrl: 'myQueueUrl',
    MessageBody: 'myMessageBody',
    DelaySeconds: 42,
  })
})

test('deleteMessage() calls SQS.deleteMessage() with expected arguments', async () => {
  const { queue } = setup({ url: 'myQueueUrl' })

  await queue.deleteMessage('myReceiptHandle')

  expect(sqsDeleteMessageMock).toBeCalledTimes(1)
  expect(sqsDeleteMessageMock).toBeCalledWith({
    QueueUrl: 'myQueueUrl',
    ReceiptHandle: 'myReceiptHandle',
  })
})

test('changeMessageVisibility() calls SQS.changeMessageVisibility() with expected arguments', async () => {
  const { queue } = setup({ url: 'myQueueUrl' })

  await queue.changeMessageVisibility({
    receiptHandle: 'myReceiptHandle',
    visibilityTimeout: 42,
  })

  expect(sqsChangeMessageVisibilityMock).toBeCalledTimes(1)
  expect(sqsChangeMessageVisibilityMock).toBeCalledWith({
    QueueUrl: 'myQueueUrl',
    ReceiptHandle: 'myReceiptHandle',
    VisibilityTimeout: 42,
  })
})

test('receiveMessage() calls SQS.receiveMessage() with expected arguments and returns the result', async () => {
  const { queue } = setup({ url: 'myQueueUrl', receiveMessageResult: 'myReceiveMessageResult' })

  const result = await queue.receiveMessage()

  expect(sqsReceiveMessageMock).toBeCalledTimes(1)
  expect(sqsReceiveMessageMock).toBeCalledWith({
    QueueUrl: 'myQueueUrl',
    AttributeNames: ['All'],
    MessageAttributeNames: ['All'],
    MaxNumberOfMessages: 1,
  })
  expect(result).toBe('myReceiveMessageResult')
})
