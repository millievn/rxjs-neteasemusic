import { first, map, mergeMap, pluck, tap } from 'rxjs/operators';
import { iif, interval, throwError } from 'rxjs';

import { query$ } from './fetch';

export type QrcodeQM = {
  qrurl?: string;
  qrimg?: string;
  unikey?: string;
};

export const qrcodeQ$ = () =>
  query$(`/login/qr/key`, {
    withCookie: false,
  })
    .pipe(pluck('data', 'unikey'))
    .pipe(
      mergeMap((unikey: any) =>
        iif(
          () => typeof unikey === 'string',
          query$(`/login/qr/create?key=${unikey}&qrimg=true`, {
            withCookie: false,
          }).pipe(
            pluck('data'),
            map<
              {
                qrurl?: string;
                qrimg?: string;
              },
              QrcodeQM
            >((v) => ({ ...v, unikey }))
          ),
          throwError('unikey is not avaiable')
        )
      )
    );

export const loginM$ = (unikey: any) =>
  iif(
    () => typeof unikey === 'string',
    interval(1000).pipe(
      mergeMap(() =>
        query$<{
          code?: number;
          cookie?: string;
        }>(`/login/qr/check`, {
          params: {
            key: unikey,
          },
        }).pipe(
          map((res) => ({
            code: res?.code,
            cookie: res?.cookie,
          }))
        )
      ),
      first((res) => res.code === 803),
      tap((res) => {
        localStorage.setItem('cookie', res.cookie);
      })
    )
  );
