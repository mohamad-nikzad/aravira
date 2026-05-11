import * as React from 'react';

export type AsyncResource<T> = {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  reload: () => void;
};

/**
 * Minimal SWR-equivalent: fetch on mount + when key changes, expose
 * { data, error, loading, reload }. Aborts on unmount.
 */
export function useAsyncResource<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList = []
): AsyncResource<T> {
  const [data, setData] = React.useState<T | undefined>(undefined);
  const [error, setError] = React.useState<unknown>(null);
  const [loading, setLoading] = React.useState<boolean>(Boolean(key));
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    let cancelled = false;
    setLoading(true);
    fetcher(ac.signal)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled || ac.signal.aborted) return;
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick, ...deps]);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}
