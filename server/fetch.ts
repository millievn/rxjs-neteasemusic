import { fromFetch } from 'rxjs/fetch';
import { retry, tap, timeout } from 'rxjs/operators';

interface QueryOptions {
  params?: Record<string, any>;
  config?: RequestInit;
  withCookie?: boolean;
  withTimestamp?: boolean;
  retryTime?: number;
  timeoutTime?: number;
}

export function query$<T>(url: string, opt?: QueryOptions) {
  const {
    params = {},
    config = {},
    withCookie = true,
    withTimestamp = false,
    retryTime = 1,
    timeoutTime = 1500,
  } = opt ?? {};

  let search = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  if (withCookie) {
    search += `&cookie=${encodeURIComponent(
      localStorage.getItem('cookie') || ''
    )}`;
  }
  if (withTimestamp) {
    search += `&timestamp=${new Date().valueOf()}`;
  }

  return fromFetch(`${process.env.NEXT_PUBLIC_API}${url}?${search}`, {
    selector: (res) => res.json(),
    ...config,
  }).pipe(
    tap((v) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`>>>>>>>>>>>>>>>>>>${url} Response >>>>>>>>>>>>>>>>>>`);
        console.log(v);
      }
    }),
    timeout(timeoutTime),
    retry<T>(retryTime)
  );
}
