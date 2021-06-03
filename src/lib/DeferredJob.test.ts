/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-empty-function */
import { DeferredJob } from './DeferredJob'
import { Enqueuer } from './Enqueuer'
import { BaseJob } from './Job'

jest.mock('./Enqueuer')

class JobWithOneArg extends BaseJob {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async perform(str: string): Promise<void> {}
}

class JobWithZeroArgs extends BaseJob {
  async perform(): Promise<void> {}
}

beforeEach(() => {
  jest.resetAllMocks()
})

test('clazz property returns the clazz passed to the constructor', () => {
  const deferredJob = new DeferredJob(JobWithOneArg)
  expect(deferredJob.clazz).toBe(JobWithOneArg)
})

test('options property returns the options passed to the constructor', () => {
  const deferredJob = new DeferredJob(JobWithOneArg, {
    queueName: 'myQueueName',
    delaySeconds: 42,
    deduplicationId: 'myDeduplicationId',
    groupId: 'myGroupId',
  })
  expect(deferredJob.options).toStrictEqual({
    queueName: 'myQueueName',
    delaySeconds: 42,
    deduplicationId: 'myDeduplicationId',
    groupId: 'myGroupId',
  })
})

test('options property returns an empty object when no options are passed to the constructor', () => {
  const deferredJob = new DeferredJob(JobWithOneArg)
  expect(deferredJob.options).toStrictEqual({})
})

test('performLater() enqueues itself with its arguments', async () => {
  const deferredJob = new DeferredJob(JobWithOneArg)

  await deferredJob.performLater('myStringArg')

  expect(Enqueuer.enqueue).toBeCalledTimes(1)
  expect(Enqueuer.enqueue).toBeCalledWith({
    job: deferredJob,
    args: ['myStringArg'],
  })
})

test('performLater() enqueues itself with an empty args array when the job takes no arguments', async () => {
  const deferredJob = new DeferredJob(JobWithZeroArgs)

  await deferredJob.performLater()

  expect(Enqueuer.enqueue).toBeCalledTimes(1)
  expect(Enqueuer.enqueue).toBeCalledWith({
    job: deferredJob,
    args: [],
  })
})
