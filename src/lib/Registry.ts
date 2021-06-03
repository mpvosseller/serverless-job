import { BaseJob, JobClassConstructor } from './Job'

class Registry {
  private name2clazz: { [key: string]: JobClassConstructor | undefined } = {}

  register(name: string, clazz: JobClassConstructor): void {
    if (this.name2clazz[name]) {
      throw new Error(`a job class is already registered with name: ${name}`)
    }
    this.name2clazz[name] = clazz
  }

  getName(jobOrClass: BaseJob | JobClassConstructor): string {
    const jobClazz = jobOrClass instanceof BaseJob ? jobOrClass.constructor : jobOrClass
    for (const [name, clazz] of Object.entries(this.name2clazz)) {
      if (jobClazz === clazz) {
        return name
      }
    }
    throw new Error(`no job class is registered with class: ${jobClazz.name}`)
  }

  getClass(name: string): JobClassConstructor {
    const clazz = this.name2clazz[name]
    if (clazz) {
      return clazz
    }
    throw new Error(`no job class is registered with name: ${name}`)
  }

  reset(): void {
    this.name2clazz = {}
  }
}

const instance = new Registry()

export { instance as Registry }
