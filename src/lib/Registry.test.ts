import { BaseJob } from './Job'
import { Registry } from './Registry'

class Job1 extends BaseJob {
  perform = () => Promise.resolve()
}

class Job2 extends BaseJob {
  perform = () => Promise.resolve()
}

beforeEach(() => {
  Registry.reset()
})

test('getClass() returns the class registered with the given name', () => {
  Registry.register('name1', Job1)
  Registry.register('name2', Job2)
  expect(Registry.getClass('name1')).toBe(Job1)
  expect(Registry.getClass('name2')).toBe(Job2)
})

test('getClass() raises an exception when no job type is registered with the given name', () => {
  const f = () => {
    Registry.getClass('other-type')
  }
  expect(f).toThrowError('no job class is registered with name: other-type')
})

test('getName() returns the name registered for the given class', () => {
  Registry.register('name1', Job1)
  Registry.register('name2', Job2)
  expect(Registry.getName(Job1)).toBe('name1')
  expect(Registry.getName(Job2)).toBe('name2')
})

test('getName() returns the name registered for the class of the given instance', () => {
  Registry.register('name1', Job1)
  Registry.register('name2', Job2)
  expect(Registry.getName(new Job1())).toBe('name1')
  expect(Registry.getName(new Job2())).toBe('name2')
})

test('getName() raises an exception when the given job class is not registered', () => {
  const f = () => {
    Registry.getName(Job1)
  }
  expect(f).toThrowError('no job class is registered with class: Job1')
})

test('getName() raises an exception when the class of the given instance is not registered', () => {
  const job = new Job1()
  const f = () => {
    Registry.getName(job)
  }
  expect(f).toThrowError('no job class is registered with class: Job1')
})

test('registering the same name more than once raises an exception', () => {
  Registry.register('name1', Job1)
  const f = () => {
    Registry.register('name1', Job1)
  }
  expect(f).toThrowError('a job class is already registered with name: name1')
})
