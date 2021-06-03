import { BaseJob } from './Job'
import { JobSerializer, JobSerializerError } from './JobSerializer'
import { Registry } from './Registry'
import { SerializableJob } from './SerializableJob'

class SomeJob extends BaseJob {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  async perform(str: string): Promise<void> {}
}

beforeEach(() => {
  Registry.reset()
})

function setup({ registerJob = true }: { registerJob?: boolean } = {}): void {
  if (registerJob) {
    Registry.register('SomeJob', SomeJob)
  }
}

describe('serialize()', () => {
  test('serializes job to expected format', () => {
    setup()
    const job = new SerializableJob(SomeJob, ['myStringArg'])

    const result = JobSerializer.serialize(job)

    const payload = JSON.parse(result)
    expect(payload).toStrictEqual({
      name: 'SomeJob',
      args: ['myStringArg'],
    })
  })

  test('throws SerializationError when job is not registered', () => {
    setup({ registerJob: false })
    const job = new SerializableJob(SomeJob, ['myStringArg'])

    const fn = () => JobSerializer.serialize(job)

    expect(fn).toThrowError(JobSerializerError)
  })
})

describe('deserialize()', () => {
  test('deserializes job from expected format', () => {
    setup()
    const payloadStr = JSON.stringify({
      name: 'SomeJob',
      args: ['myStringArg'],
    })

    const result = JobSerializer.deserialize(payloadStr)

    expect(result.clazz).toBe(SomeJob)
    expect(result.args).toStrictEqual(['myStringArg'])
  })

  test('throws SerializationError when job is not registered', () => {
    setup({ registerJob: false })
    const payloadStr = JSON.stringify({
      name: 'SomeJob',
      args: ['myStringArg'],
    })

    const fn = () => JobSerializer.deserialize(payloadStr)

    expect(fn).toThrowError(JobSerializerError)
  })

  test('throws SerializationError when name is not present', () => {
    setup()
    const payloadStr = JSON.stringify({
      nameZZZ: 'SomeJob',
      args: ['myStringArg'],
    })

    const fn = () => JobSerializer.deserialize(payloadStr)

    expect(fn).toThrowError(JobSerializerError)
  })

  test('uses empty array for args when args is not present', () => {
    setup()
    const payloadStr = JSON.stringify({
      name: 'SomeJob',
      argsZZZ: ['myStringArg'],
    })

    const result = JobSerializer.deserialize(payloadStr)

    expect(result.args).toStrictEqual([])
  })
})
