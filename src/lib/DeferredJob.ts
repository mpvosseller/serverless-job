import { Enqueuer } from './Enqueuer'
import { BaseJob } from './Job'
import { Options } from './Options'

export class DeferredJob<T extends BaseJob = BaseJob> {
  readonly clazz: new () => T
  readonly options: Options

  constructor(clazz: new () => T, options: Options = {}) {
    this.clazz = clazz
    this.options = options
  }

  async performLater(...args: Parameters<T['perform']>): Promise<void> {
    await Enqueuer.enqueue({ job: this, args })
  }
}
