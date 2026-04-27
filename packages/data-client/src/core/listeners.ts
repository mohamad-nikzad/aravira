export type Unsubscribe = () => void

export function createListenerSet<T>() {
  const listeners = new Set<(value: T) => void>()

  return {
    subscribe(fn: (value: T) => void): Unsubscribe {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    notify(value: T) {
      for (const fn of listeners) fn(value)
    },
  }
}
