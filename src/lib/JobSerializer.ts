import { Registry } from './Registry'
import { SerializableJob } from './SerializableJob'

interface Payload {
  name: string
  args?: unknown[] // allow deserialized payloads to omit args if empty
}

export class JobSerializerError extends Error {
  readonly reason: unknown

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  constructor(e: any) {
    const error = e as Partial<Error> | undefined
    super(error?.message)
    this.reason = error
  }
}

export class JobSerializer {
  static serialize(job: SerializableJob): string {
    try {
      const payload = this.payloadFromJob(job)
      return JSON.stringify(payload)
    } catch (e: unknown) {
      throw new JobSerializerError(e)
    }
  }

  static deserialize(str: string): SerializableJob {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = JSON.parse(str)
      return this.jobFromPayload(payload)
    } catch (e: unknown) {
      throw new JobSerializerError(e)
    }
  }

  private static payloadFromJob(job: SerializableJob): Payload {
    return {
      name: Registry.getName(job.clazz),
      args: job.args,
    }
  }

  private static jobFromPayload(payload: Payload): SerializableJob {
    const clazz = Registry.getClass(payload.name)
    const args = payload.args || [] // use [] when args are not present
    return new SerializableJob(clazz, args)
  }
}
