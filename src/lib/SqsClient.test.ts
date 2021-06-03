/* eslint-disable @typescript-eslint/no-explicit-any */
import { SQS } from 'aws-sdk'
import { mocked } from 'ts-jest/utils'
import { createSqsQueue } from './createSqsQueue'
import { ServerlessJob } from './ServerlessJob'
import { SqsClient } from './SqsClient'

jest.mock('./createSqsQueue')

const SqsMock = mocked(SQS)
const createSqsQueueMock = mocked(createSqsQueue)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getSqs()', () => {
  test('returns an instance of SQS initialized with config', () => {
    ServerlessJob.configure({
      sqs: {
        foo: 'bar',
      } as any,
    })
    const client = new SqsClient()

    const result = client.getSqs()

    expect(SqsMock).toBeCalledTimes(1)
    expect(SqsMock).toBeCalledWith({
      foo: 'bar',
    })
    expect(result).toBe(SqsMock.mock.instances[0])
  })
})

describe('getQueue()', () => {
  test('calls createQueue() with the given name and returns it', async () => {
    createSqsQueueMock
      .mockResolvedValueOnce('firstQueue' as any)
      .mockResolvedValue('otherQueue' as any)
    const client = new SqsClient()

    const result = await client.getQueue('myQueue')

    expect(createSqsQueueMock).toBeCalledTimes(1)
    expect(createSqsQueueMock).toBeCalledWith('myQueue')
    expect(result).toBe('firstQueue')
  })

  test('does not call createQueue() twice for the same name', async () => {
    createSqsQueueMock
      .mockResolvedValueOnce('firstQueue' as any)
      .mockResolvedValue('otherQueue' as any)
    const client = new SqsClient()

    const firstResult = await client.getQueue('myQueue')
    const secondResult = await client.getQueue('myQueue')

    expect(createSqsQueueMock).toBeCalledTimes(1)
    expect(createSqsQueueMock).toBeCalledWith('myQueue')
    expect(firstResult).toBe('firstQueue')
    expect(firstResult).toBe(secondResult)
  })

  test('calls createQueue() with the default queue name and returns it', async () => {
    createSqsQueueMock
      .mockResolvedValueOnce('firstQueue' as any)
      .mockResolvedValue('otherQueue' as any)
    ServerlessJob.configure({
      defaultQueueName: 'myDefaultQueueName',
    })
    const client = new SqsClient()

    const result = await client.getQueue()

    expect(createSqsQueueMock).toBeCalledTimes(1)
    expect(createSqsQueueMock).toBeCalledWith('myDefaultQueueName')
    expect(result).toBe('firstQueue')
  })

  test('throws exception when defaultQueueName is not configured', async () => {
    ServerlessJob.configure({
      defaultQueueNameZZZ: 'foo',
    } as any)
    const client = new SqsClient()

    const fn = client.getQueue()

    await expect(fn).rejects.toThrowError(/failed to find default queue name/)
  })
})
