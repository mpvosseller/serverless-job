/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SQS } from 'aws-sdk'
import { mocked } from 'ts-jest/utils'
import { createSqsQueue } from './createSqsQueue'
import { getSqsClient } from './SqsClient'

jest.mock('./SqsClient')
const getSqsClientMock = mocked(getSqsClient)
const SQSMock = mocked(SQS, true)
const sqsGetQueueUrlMock = SQSMock.prototype.getQueueUrl
const sqsGetQueueAttributes = SQSMock.prototype.getQueueAttributes

beforeEach(() => {
  jest.resetAllMocks()
})

function setup({
  getQueueUrlResult,
  getQueueAttributesResult,
}: {
  getQueueUrlResult?: unknown
  getQueueAttributesResult?: unknown
} = {}) {
  getSqsClientMock.mockReturnValue({
    getSqs: () => new SQS(),
  } as any)

  sqsGetQueueUrlMock.mockReturnValue({
    promise:
      getQueueUrlResult instanceof Error
        ? jest.fn().mockRejectedValue(getQueueUrlResult)
        : jest.fn().mockResolvedValue(getQueueUrlResult),
  } as any)

  sqsGetQueueAttributes.mockReturnValue({
    promise:
      getQueueAttributesResult instanceof Error
        ? jest.fn().mockRejectedValue(getQueueAttributesResult)
        : jest.fn().mockResolvedValue(getQueueAttributesResult),
  } as any)
}

test('createQueue() fetches the queue URL and queue attributes and returns a new queue with them', async () => {
  setup({
    getQueueUrlResult: {
      QueueUrl: 'myQueueUrl',
    },
    getQueueAttributesResult: {
      Attributes: {
        RedrivePolicy: '{"foo":"bar"}',
      },
    },
  })

  const result = await createSqsQueue('myQueueName')

  expect(sqsGetQueueUrlMock).toBeCalledTimes(1)
  expect(sqsGetQueueUrlMock).toBeCalledWith({
    QueueName: 'myQueueName',
  })
  expect(sqsGetQueueAttributes).toBeCalledTimes(1)
  expect(sqsGetQueueAttributes).toBeCalledWith({
    QueueUrl: 'myQueueUrl',
    AttributeNames: ['All'],
  })
  expect(result.getName()).toBe('myQueueName')
  expect(result.getUrl()).toBe('myQueueUrl')
  expect(result.getAttributes()).toStrictEqual({
    RedrivePolicy: '{"foo":"bar"}',
  })
})

test('createQueue() rethrows when getQueueUrl() throws', async () => {
  setup({
    getQueueUrlResult: new Error('myError'),
  })

  const result = createSqsQueue('myQueueName')

  await expect(result).rejects.toThrowError('myError')
})

test('createQueue() rethrows when getQueueAttributes() throws', async () => {
  setup({
    getQueueUrlResult: {
      QueueUrl: 'myQueueUrl',
    },
    getQueueAttributesResult: new Error('myError'),
  })

  const result = createSqsQueue('myQueueName')

  await expect(result).rejects.toThrowError('myError')
})

test('createQueue() throws when getQueueUrl() result does not have a QueueUrl property', async () => {
  setup({
    getQueueUrlResult: {
      QueueUrlZZZ: {},
    },
  })

  const result = createSqsQueue('myQueueName')

  await expect(result).rejects.toThrowError('failed to get queue url')
})

test('createQueue() throws when getQueueAttributes() result does not have an Attributes property', async () => {
  setup({
    getQueueUrlResult: {
      QueueUrl: 'myQueueUrl',
    },
    getQueueAttributesResult: {
      AttributesZZZ: {},
    },
  })

  const result = createSqsQueue('myQueueName')

  await expect(result).rejects.toThrowError('failed to get queue attributes')
})
