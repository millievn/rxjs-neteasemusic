import { fromFetch } from 'rxjs/fetch';
import { catchError, retry, tap, timeout } from 'rxjs/operators';
import { empty, of } from 'rxjs';

import { localGetValue, __DEV__ } from '@utils';

interface QueryOptions<T = any> {
  params?: Record<string, any>;
  config?: RequestInit;
  withCookie?: boolean;
  withTimestamp?: boolean;
  retryTime?: number;
  timeoutTime?: number;
  debug?: boolean;
  skip?: boolean;
  defaultVal?: T;
}

export function query$<T>(url: string, opt?: QueryOptions<T>) {
  const {
    params = {},
    config = {},
    withCookie = true,
    withTimestamp = true,
    retryTime = 1,
    timeoutTime = 1500,
    debug = false,
    skip = false,
    defaultVal,
  } = opt ?? {};

  if (skip) {
    return empty();
  }

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
    retry<T>(retryTime),
    catchError(() => of(defaultVal))
  );
}
