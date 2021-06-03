import { BaseJob, JobClassConstructor } from './Job'

test('can call static methods by type asserting a JobClassConstructor to typeof BaseJob', () => {
  class SomeJob extends BaseJob {
    perform = () => Promise.resolve()
  }
  const c: JobClassConstructor = SomeJob

  const maxAttempts = (c as unknown as typeof BaseJob).maxAttempts()

  expect(maxAttempts).toBe(13)
})

test('can call overriden static methods by type asserting a JobClassConstructor to typeof BaseJob', () => {
  class SomeJob extends BaseJob {
    static maxAttempts = () => 42
    perform = () => Promise.resolve()
  }
  const c: JobClassConstructor = SomeJob
  const instance = new c()

  const maxAttempts = (instance.constructor as typeof BaseJob).maxAttempts()

  expect(maxAttempts).toBe(42)
})

test('can call static BaseJob methods with an instance by type asserting the constructor', () => {
  class SomeJob extends BaseJob {
    perform = () => Promise.resolve()
  }
  const c: JobClassConstructor = SomeJob
  const instance = new c()

  const maxAttempts = (instance.constructor as typeof BaseJob).maxAttempts()

  expect(maxAttempts).toBe(13)
})

test('can call overridden static BaseJob methods with an instance by type asserting the constructor', () => {
  class SomeJob extends BaseJob {
    static maxAttempts = () => 42
    perform = () => Promise.resolve()
  }
  const c: JobClassConstructor = SomeJob
  const instance = new c()

  const maxAttempts = (instance.constructor as typeof BaseJob).maxAttempts()

  expect(maxAttempts).toBe(42)
})
