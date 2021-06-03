import { Backoff } from './Backoff'
import { DeferredJob } from './DeferredJob'
import { Options } from './Options'
import { Registry } from './Registry'
import { ServerlessJob } from './ServerlessJob'

// BaseJob subclass constructor
// This defines a zero argument constructor that returns a BaseJob instance
// It doesn't enforce it to be "typeof BaseJob" though which means we can't call static methods on it (e.g. "maxAttempts()")
// To call the static methods from a "JobClassConstructor" we must type assert the "JobClassConstructor" to "typeof BaseJob"
// To call the static methods from an instance we must type assert instance.constructor to "typeof BaseJob"
// https://github.com/microsoft/TypeScript/issues/3841
export type JobClassConstructor = {
  new (): BaseJob
}

export abstract class BaseJob {
  abstract perform(...args: unknown[]): Promise<unknown>

  static async performLater<T extends BaseJob>(
    this: new () => T,
    ...args: Parameters<T['perform']>
  ): Promise<void> {
    await new DeferredJob<T>(this).performLater(...args)
  }

  static async performNow<T extends BaseJob>(
    this: new () => T,
    ...args: Parameters<T['perform']>
  ): Promise<ReturnType<T['perform']>> {
    const job = new this()
    return job.perform(...args)
  }

  static set<T extends BaseJob>(this: new () => T, options: Options): DeferredJob<T> {
    return new DeferredJob<T>(this, options)
  }

  static maxAttempts(): number {
    return ServerlessJob.getConfig().maxAttempts || 13
  }

  static getBackoff(attempt: number): number {
    return Backoff.getExponentialBackoff(attempt)
  }
}

export function Job(name?: string): (c: JobClassConstructor) => void {
  return (clazz: JobClassConstructor): void => {
    Registry.register(name || clazz.name, clazz)
  }
}
