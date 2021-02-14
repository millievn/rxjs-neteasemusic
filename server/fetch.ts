import { fromFetch } from 'rxjs/fetch';
import { retry, tap, timeout } from 'rxjs/operators';

import { localGetValue, __DEV__ } from '@utils';

interface QueryOptions {
  params?: Record<string, any>;
  config?: RequestInit;
  withCookie?: boolean;
  withTimestamp?: boolean;
  retryTime?: number;
  timeoutTime?: number;
  debug?: boolean;
}

export function query$<T>(url: string, opt?: QueryOptions) {
  const {
    params = {},
    config = {},
    withCookie = true,
    withTimestamp = true,
    retryTime = 1,
    timeoutTime = 1500,
    debug = false,
  } = opt ?? {};

  let search = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  if (withCookie) {
    search += `&cookie=${encodeURIComponent(localGetValue('cookie'))}`;
  }
  if (withTimestamp) {
    search += `&timestamp=${new Date().valueOf()}`;
  }

  return fromFetch(`${process.env.NEXT_PUBLIC_API}${url}?${search}`, {
    selector: (res) => res.json(),
    ...config,
  }).pipe(
    tap((v) => {
      if (__DEV__ && debug) {
        console.log(`>>>>>>>>>>>>>>>>>>${url} Response >>>>>>>>>>>>>>>>>>`);
        console.log(v);
      }
    }),
    timeout(timeoutTime),
    retry<T>(retryTime)
  );
}
