export type OnlineStatusReader = () => boolean

export function defaultIsOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}
