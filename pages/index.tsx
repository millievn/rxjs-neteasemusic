import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GoEnd, GoStart, HamburgerButton, Pause, Play } from '@icon-park/react';
import { useEventCallback, useObservable } from 'rxjs-hooks';
import {
  debounceTime,
  defaultIfEmpty,
  distinctUntilKeyChanged,
  last,
  map,
  mergeMap,
  pluck,
  shareReplay,
  skipWhile,
  switchMap,
  take,
  tap,
  throttleTime,
  withLatestFrom,
} from 'rxjs/operators';
import { Observable, of, combineLatest } from 'rxjs';

import { List, AutoSizer } from 'react-virtualized';

import {
  playlistQ$,
  profileQ$,
  playlistDetailQ$,
  lyricQ$,
  songDetailQ$,
  SongM,
  PlaylistItem,
  PlaylistDetailM,
} from '@server';
import { LyricItem } from '@utils';

type TimeUpdateValue = {
  currentTime: number;
  duration: number;
  ended: boolean;
  volume: number;
};

type DatasetEvent = React.MouseEvent<HTMLDivElement> & {
  target: {
    dataset: Record<string, string | undefined>;
    parentElement: HTMLDivElement & {
      dataset: Record<string, string | undefined>;
    };
  };
};

export default function Page() {
  const user = useObservable(() => profileQ$().pipe(shareReplay(1)));

  const audioRef = useRef<HTMLAudioElement>();

  const { playlist, playlistDetail, songDetail, lyrics } = useObservable(
    () =>
      profileQ$().pipe(
        mergeMap((u) => playlistQ$(u?.profile?.userId)),
        shareReplay(1),
        pluck('playlist'),
        mergeMap((list) => {
          if (Array.isArray(list) && list?.[0].id) {
            return playlistDetailQ$(list?.[0].id).pipe(
              pluck('playlist'),
              shareReplay(1),
              map((d) => ({
                playlist: list,
                playlistDetail: d,
              }))
            );
          }

          return of({
            playlist: list,
            playlistDetail: {} as PlaylistItem & PlaylistDetailM,
          });
        }),
        mergeMap((prev) => {
          if (
            Array.isArray(prev?.playlistDetail?.tracks) &&
            prev?.playlistDetail?.tracks?.[0]?.id
          ) {
            const currentSongId = prev?.playlistDetail?.tracks?.[0]?.id;
            audioRef.current.src = `https://music.163.com/song/media/outer/url?id=${currentSongId}.mp3`;

            audioRef.current.addEventListener('load', () => {
              audioRef.current.play();
            });

            return combineLatest(
              lyricQ$(currentSongId).pipe(pluck('lyric'), shareReplay(1)),
              songDetailQ$([currentSongId]).pipe(
                mergeMap((i) => i),
                take(1)
              )
            ).pipe(
              map(([lr, sg]) => ({
                ...prev,
                lyrics: lr,
                songDetail: sg,
              }))
            );
          }

          return of({
            ...prev,
            lyrics: [] as LyricItem[],
            songDetail: {} as SongM,
          });
        })
      ),
    {
      playlist: [],
      playlistDetail: {} as PlaylistItem & PlaylistDetailM,
      lyrics: [],
      songDetail: {} as SongM,
    }
  );

  const ref = useRef<HTMLDivElement>();

  const [onTimeUpdate, activeOne] = useEventCallback(
    (e$) => {
      console.log(lyrics);
      return e$.pipe(
        throttleTime(1000),
        map((e: { target: TimeUpdateValue }) => ({
          currentTime: e.target.currentTime,
          duration: e.target.duration,
          ended: e.target.ended,
          volume: e.target.volume,
        })),
        tap(console.log),
        switchMap((t) =>
          of(lyrics).pipe(
            // skipWhile((l) => !l?.length),
            mergeMap((i) => i),
            map((i, idx) => ({ ...i, idx })),
            last((i) => i?.time < t?.currentTime),
            distinctUntilKeyChanged('idx'),
            tap(() => console.log(lyrics)),
            map((i, idx) => ({
              ...i,
              idx,
              ...t,
              percentage: Math.floor(
                (Number(t.currentTime) / Number(t.duration) || 0) * 100
              ),
            })),

            tap((val) => {
              ref.current.style.transform = `translateY(${Math.floor(
                192 - val.idx * 20
              )}px)`;
            })
          )
        )
      );
    },
    {
      time: 0,
      rawTime: '',
      content: '',
      idx: 0,
      currentTime: 0,
      duration: 0,
      ended: true,
      volume: 1,
      percentage: 0,
    },
    [lyrics, ref.current]
  );

  const [onMenuClick, menuVisible] = useEventCallback((e$, v$) => {
    return e$.pipe(
      debounceTime(500),
      withLatestFrom(v$),
      map(([_, v]) => !v),
      tap(console.log)
    );
  }, false);

  const [onSongListClick, currentSongId] = useEventCallback(
    (e$: Observable<React.MouseEvent<HTMLDivElement>>) => {
      return e$.pipe(
        map(
          (e: DatasetEvent) =>
            e.target?.dataset?.songid ??
            e.target?.parentElement?.dataset?.songid
        ),
        debounceTime(500),
        tap(console.log)
      );
    },
    songDetail?.id,
    [songDetail?.id]
  );

  return (
    <article className="flex h-screen bg-grey-A400">
      <main className="flex-1 grid place-items-center">
        <div className="flex gap-20 min-w-max">
          <div
            className={`h-96 w-96 shadow-md rounded-full border-8 border-grey-900 $playing?'animate-spin-30s':''}`}
          >
            <img
              src={songDetail?.al?.picUrl ?? 'https://via.placeholder.com/400'}
              alt="album"
              className="rounded-full"
            />
          </div>
          <div className="h-96 w-60 overflow-y-auto overflow-x-hidden">
            <div
              ref={ref}
              className="ease-in-out transition-transform duration-500 overflow-x-hidden"
            >
              {Array.isArray(lyrics) &&
                lyrics.map((lyric) => {
                  return (
                    <div
                      key={lyric?.rawTime}
                      className={`${
                        lyric?.rawTime === activeOne.rawTime
                          ? 'text-cyan-500 text-lg'
                          : 'text-sm text-grey-400'
                      } text-center`}
                    >
                      {lyric?.content}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </main>
      <aside className="flex flex-col items-center w-40 px-4 py-6 box-border bg-grey-800 z-0">
        <div className="flex flex-col items-center mb-20">
          <img
            src={
              user?.profile?.avatarUrl ??
              'https://via.placeholder.com/60x60?text=Visit+Blogging.com+Now'
            }
            alt=""
            className="w-12 h-12 rounded-full block hover:animate-spin"
          />
          <p className="mt-2 text-grey-200 text-xs">
            {user?.profile?.nickname ?? ''}
          </p>
        </div>

        <div className="w-full overflow-y-auto">
          <div className="flex items-center gap-1 w-full mb-2">
            <span className="flex-1 border-b border-cyan-500" />
            <span className="text-cyan-500 text-xs">我的歌单</span>
            <span className="flex-1 border-b border-cyan-500" />
          </div>
          <div className="w-full">
            {Array.isArray(playlist) &&
              playlist.map((item) => {
                return (
                  <div
                    className="w-full flex items-center gap-1 cursor-pointer"
                    key={item.id}
                  >
                    <span className="block w-1 h-1 rounded-full bg-cyan-700" />
                    <span className="h-6 text-xs text-grey-400 overflow-ellipsis break-all overflow-hidden leading-loose">
                      {item.name}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </aside>
      <footer className="fixed bottom-0 left-0 w-full py-2 px-8 bg-gray-900 shadow-2xl  bg-grey-900">
        <div className="flex items-center justify-between">
          <img
            src={
              'https://p2.music.126.net/-OTPMtpp1bgXKGZ7UvdMfw==/109951165448830413.jpg' ??
              'https://via.placeholder.com/60x60?text=Visit+Blogging.com+Now'
            }
            alt=""
            className="w-12 h-12 rounded-full block"
          />
          <div className="flex items-center gap-8">
            <GoStart
              theme="outline"
              size="24"
              className="text-grey-500 hover:text-cyan-500"
            />
            {activeOne.ended ? (
              <Play
                theme="outline"
                size="24"
                className="text-grey-300 hover:text-cyan-500"
              />
            ) : (
              <Pause
                theme="outline"
                size="24"
                className="text-grey-300 hover:text-cyan-500"
              />
            )}
            <GoEnd
              theme="outline"
              size="24"
              className="text-grey-500 hover:text-cyan-500"
            />
            <div className="h-1 w-60 rounded bg-grey-500">
              <div
                className="bg-cyan-500 rounded h-full transition-width duration-150 ease-linear"
                style={{
                  width: `${activeOne.percentage}%`,
                }}
              />
            </div>
          </div>
          <div className="relative">
            <HamburgerButton
              theme="outline"
              size="24"
              className="text-grey-300 hover:text-cyan-500"
              onClick={onMenuClick}
            />

            <div
              className={`absolute bottom-8 right-0 w-96 bg-grey-A400 text-grey-200 shadow-xl p-4 ${
                menuVisible ? 'visible' : 'invisible'
              }`}
            >
              <div>{playlistDetail?.name}</div>
              <div
                className="h-80 mt-4 text-sm text-grey-400"
                onClick={onSongListClick}
              >
                <AutoSizer className="h-full">
                  {({ width, height }) => (
                    <List
                      height={height}
                      width={width}
                      overscanRowCount={6}
                      rowCount={playlistDetail?.tracks?.length ?? 0}
                      rowHeight={60}
                      rowRenderer={({ index, key, style }) => {
                        return (playlistDetail?.tracks?.length ?? 0) > index ? (
                          <div
                            key={key}
                            style={style}
                            className="flex gap-4 items-center"
                            data-songid={playlistDetail?.tracks?.[index]?.id}
                          >
                            <img
                              src={`${
                                playlistDetail?.tracks?.[index]?.al?.picUrl ??
                                'https://via.placeholder.com/60x60'
                              }?param=40y40`}
                              className="w-10 h-10"
                            />
                            <span>{playlistDetail?.tracks?.[index]?.name}</span>
                          </div>
                        ) : (
                          <div />
                        );
                      }}
                    />
                  )}
                </AutoSizer>
              </div>
            </div>
          </div>
        </div>

        <audio ref={audioRef} onTimeUpdate={onTimeUpdate} autoPlay />
      </footer>
    </article>
  );
}
