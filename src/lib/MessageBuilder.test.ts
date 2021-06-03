import { DeferredJob } from './DeferredJob'
import { BaseJob } from './Job'
import { JobSerializerError } from './JobSerializer'
import { MessageBuilder } from './MessageBuilder'
import { Options } from './Options'
import { Registry } from './Registry'

class SomeJob extends BaseJob {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async perform(): Promise<void> {}
}

beforeEach(() => {
  Registry.reset()
})

function setup({
  registerJob = true,
  options = {},
  job = new DeferredJob(SomeJob, options),
  args = ['someStringArg'],
}: { registerJob?: boolean; options?: Options; job?: DeferredJob; args?: unknown[] } = {}) {
  if (registerJob) {
    Registry.register('SomeJob', SomeJob)
  }
  return {
    job,
    args,
  }
}

test('throws a JobSerializerError when the job class is not registered', () => {
  const { job, args } = setup({ registerJob: false })
  const messageBuilder = new MessageBuilder({
    job,
    args,
  })
  const fn = () => messageBuilder.build()
  expect(fn).toThrowError(JobSerializerError)
})

describe('MessageBody', () => {
  test('is the serialized string of the job', () => {
    const { job, args } = setup({ args: ['myOneArg'] })
    const messageBuilder = new MessageBuilder({
      job,
      args,
    })
    const result = messageBuilder.build()
    expect(result.MessageBody).toStrictEqual('{"name":"SomeJob","args":["myOneArg"]}')
  })
})

describe('MessageAttributes', () => {
  test('has the serverless-job attribute', () => {
    const { job, args } = setup()
    const messageBuilder = new MessageBuilder({
      job,
      args,
    })

    const result = messageBuilder.build()

    expect(result.MessageAttributes?.['serverless-job']?.StringValue).toStrictEqual('1')
  })
})

describe('DelaySeconds', () => {
  test('is undefined by default', () => {
    const { job, args } = setup()
    const messageBuilder = new MessageBuilder({
      job,
      args,
    })

    const result = messageBuilder.build()

    expect(result.DelaySeconds).toBeUndefined()
  })

  test('is undefined when options.delaySeconds is negative', () => {
    const { job, args } = setup({
      options: {
        delaySeconds: -1,
      },
    })
    const messageBuilder = new MessageBuilder({
      job,
      args,
    })

    const result = messageBuilder.build()

    expect(result.DelaySeconds).toBeUndefined()
  })
  test('is undefined when options.delaySeconds is 0', () => {
    const { job, args } = setup({
      options: {
        delaySeconds: 0,
      },
    })
    const messageBuilder = new MessageBuilder({
      job,
      args,
    })

    const result = messageBuilder.build()

    expect(result.DelaySeconds).toBeUndefined()
  })

  test('is set to options.delaySeconds when it is 1 or higher', () => {
    const { job, args } = setup({
      options: {
        delaySeconds: 1,
      },
    })
    const messageBuilder = new MessageBuilder({
      job,
      args,
    })

    const result = messageBuilder.build()

    expect(result.DelaySeconds).toBe(1)
  })

  test('is set to options.delaySeconds when it is 900 or lower', () => {
    const { job, args } = setup({
      options: {
        delaySeconds: 900,
      },
    })
    const messageBuilder = new MessageBuilder({
      job,
      args,
    })

    const result = messageBuilder.build()

    expect(result.DelaySeconds).toBe(900)
  })

  test('is set to 900 when options.delaySeconds is greater than 900', () => {
    const { job, args } = setup({
      options: {
        delaySeconds: 901,
      },
    })
    const messageBuilder = new MessageBuilder({
      job,
      args,
    })

    const result = messageBuilder.build()

    expect(result.DelaySeconds).toBe(900)
  })

  test('is undefined with FIFO queues', () => {
    const { job, args } = setup({
      options: {
        delaySeconds: 1,
      },
    })
    const messageBuilder = new MessageBuilder({
      job,
      args,
      isFifo: true,
    })

    const result = messageBuilder.build()

    expect(result.DelaySeconds).toBeUndefined()
  })
})

describe('MessageGroupId', () => {
  test('is undefined by default', () => {
    const { job, args } = setup()
    const messageBuilder = new MessageBuilder({
      job,
      args,
      isFifo: true,
    })

    const result = messageBuilder.build()

    expect(result.MessageGroupId).toBeUndefined()
  })

  test('is options.groupId when provided', () => {
    const { job, args } = setup({
      options: {
        groupId: 'myGroupId',
      },
    })
    const messageBuilder = new MessageBuilder({
      job,
      args,
      isFifo: true,
    })

    const result = messageBuilder.build()

    expect(result.MessageGroupId).toBe('myGroupId')
  })

  test('is undefined for standard (non-FIFO) queues', () => {
    const { job, args } = setup({
      options: {
        groupId: 'myGroupId',
      },
    })
    const messageBuilder = new MessageBuilder({
      job,
      args,
      isFifo: false, // standard-queue
    })

    const result = messageBuilder.build()

    expect(result.MessageGroupId).toBeUndefined()
  })
})

describe('MessageDeduplicationId', () => {
  test('is undefined by default', () => {
    const { job, args } = setup()
    const messageBuilder = new MessageBuilder({
      job,
      args,
      isFifo: true,
    })

    const result = messageBuilder.build()

    expect(result.MessageDeduplicationId).toBeUndefined()
  })

  test('is options.deduplicationId when provided', () => {
    const { job, args } = setup({
      options: {
        deduplicationId: 'myDeduplicationId',
      },
    })
    const messageBuilder = new MessageBuilder({
      job,
      args,
      isFifo: true,
    })

    const result = messageBuilder.build()

    expect(result.MessageDeduplicationId).toBe('myDeduplicationId')
  })

  test('is undefined for standard (non-FIFO) queues', () => {
    const { job, args } = setup({
      options: {
        deduplicationId: 'myDeduplicationId',
      },
    })
    const messageBuilder = new MessageBuilder({
      job,
      args,
      isFifo: false, // standard-queue
    })

    const result = messageBuilder.build()

    expect(result.MessageDeduplicationId).toBeUndefined()
  })
})
