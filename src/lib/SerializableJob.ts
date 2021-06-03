import { JobClassConstructor } from './Job'

export class SerializableJob {
  readonly clazz: JobClassConstructor
  readonly args: unknown[]

  constructor(clazz: JobClassConstructor, args: unknown[]) {
    this.clazz = clazz
    this.args = args
  }

  async perform(): Promise<unknown> {
    const job = new this.clazz()
    return job.perform(...this.args)
  }
}
