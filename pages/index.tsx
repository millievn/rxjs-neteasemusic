import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GoEnd, GoStart, HamburgerButton, Pause, Play } from '@icon-park/react';
import {
  distinct,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  last,
  map,
  mergeMap,
  pluck,
  switchMap,
  take,
  takeLast,
  tap,
} from 'rxjs/operators';
import { of, combineLatest, BehaviorSubject, Subject } from 'rxjs';

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
  AccountAndProfileM,
} from '@server';
import { LyricItem, useToogle } from '@utils';

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

/**
 * to update current playlist
 */
const playlistCtr$ = new BehaviorSubject<string | number>(0);

/**
 *  to update current song
 */
const songCtr$ = new BehaviorSubject<string | number>(0);

/**
 * profile and playlist info
 * and autoplay first playlist
 */

const profileAndPlaylist$ = profileQ$().pipe(
  filter((u) => !!u?.profile?.userId),
  distinct((u) => u?.profile?.userId),
  mergeMap((u) =>
    combineLatest(of(u), playlistQ$(u?.profile?.userId).pipe(pluck('playlist')))
  ),
  map(([user, playlist]) => ({
    user,
    playlist,
  })),

  tap(({ playlist }) => {
    if (Array.isArray(playlist) && playlist.length && playlist[0].id) {
      playlistCtr$.next(playlist[0].id);
    }
  })
);

/**
 * update current playlist
 * and autoplay first song
 */
const currentListDetail$ = playlistCtr$.pipe(
  filter((id) => !!id),
  distinctUntilChanged(),
  switchMap((id) => playlistDetailQ$(id).pipe(pluck('playlist'))),
  tap((ld) => {
    if (Array.isArray(ld?.tracks) && ld?.tracks?.[0]?.id) {
      songCtr$.next(ld?.tracks?.[0]?.id);
    }
  })
);

/**
 * update current song and its lyric
 */
const currentSongDetail$ = songCtr$.pipe(
  filter((id) => !!id),
  distinctUntilChanged(),
  switchMap((id) =>
    combineLatest(
      songDetailQ$([id]).pipe(
        mergeMap((i) => i),
        take(1)
      ),
      lyricQ$(id).pipe(pluck('lyric')),
      of(id)
    )
  ),
  map(([detail, lyric, songid]) => ({
    detail,
    lyric,
    songid,
  }))
);

/**
 * control player
 */
const playerCtr$ = new Subject<{ target: TimeUpdateValue }>();

/**
 * player info
 */
const player$ = combineLatest(
  currentSongDetail$.pipe(
    pluck('lyric'),
    mergeMap((i) => i),
    map((i, idx) => ({ ...i, idx })),
    takeLast(1),
    distinctUntilKeyChanged('idx')
  ),
  playerCtr$
).pipe(
  switchMap(([lys, sg]) =>
    of(lys).pipe(
      last((ly) => ly?.time < sg.target.currentTime),
      map((ly) => {
        return {
          ...ly,
          currentTime: sg.target.currentTime,
          duration: sg.target.duration,
          ended: sg.target.ended,
          volume: sg.target.volume,
          percentage: Math.floor(
            (Number(sg.target.currentTime) / Number(sg.target.duration) || 0) *
              100
          ),
        };
      })
    )
  )
);

export default function Page() {
  const audioRef = useRef<
    HTMLAudioElement & {
      attached?: boolean;
    }
  >();

  const ref = useRef<HTMLDivElement>();

  const [{ user, playlist }, setProfileAndPlaylist] = useState({
    user: {} as AccountAndProfileM,
    playlist: [] as PlaylistItem[],
  });

  const [menuVisible, { toogle }] = useToogle();

  const [player, setPlayer] = useState({
    time: 0,
    rawTime: '',
    content: '',
    idx: 0,
    currentTime: 0,
    duration: 0,
    ended: true,
    volume: 1,
    percentage: 0,
  });

  const [listDetail, setListDetail] = useState(
    {} as PlaylistItem & PlaylistDetailM
  );

  const [songDetail, setSongDetail] = useState({
    detail: {} as SongM,
    lyric: [] as LyricItem[],
    songid: 0 as string | number,
  });

  const onTimeUpdate = useCallback((e: any) => {
    playerCtr$.next(e as { target: TimeUpdateValue });
  }, []);

  const autoPlay = useCallback(() => {
    audioRef.current?.play();
  }, []);

  const onPlaylistClick = useCallback((e: DatasetEvent) => {
    const listid =
      e.target?.dataset?.listid ?? e.target?.parentElement?.dataset?.listid;
    if (listid) {
      playlistCtr$.next(listid);
    }
  }, []);

  const onSongListClick = useCallback((e: DatasetEvent) => {
    const songid =
      e.target?.dataset?.songid ?? e.target?.parentElement?.dataset?.songid;
    if (songid) {
      songCtr$.next(songid);
    }
  }, []);

  useEffect(() => {
    const subscription = profileAndPlaylist$.subscribe((p) => {
      setProfileAndPlaylist(p);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const subscription = currentListDetail$.subscribe((list) => {
      setListDetail(list);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const subscription = currentSongDetail$.subscribe((dl) => {
      setSongDetail(dl);

      if (audioRef.current && dl.songid) {
        audioRef.current.src = `https://music.163.com/song/media/outer/url?id=${dl.songid}.mp3`;

        if (!audioRef.current.attached)
          audioRef.current.addEventListener('load', autoPlay);
      }
    });

    return () => {
      subscription.unsubscribe();
      audioRef.current?.removeEventListener('load', autoPlay);
    };
  }, []);

  useEffect(() => {
    const subscription = player$.subscribe((actOne) => {
      setPlayer(actOne);

      if (ref.current) {
        ref.current.style.transform = `translateY(${Math.floor(
          192 - actOne.idx * 20
        )}px)`;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <article className="flex h-screen bg-grey-A400">
      <main className="flex-1 grid place-items-center">
        <div className="flex gap-20 min-w-max">
          <div
            className={`h-96 w-96 shadow-md rounded-full border-8 border-grey-900 $playing?'animate-spin-30s':''}`}
          >
            <img
              src={
                songDetail?.detail?.al?.picUrl ??
                'https://via.placeholder.com/400'
              }
              alt="album"
              className="rounded-full"
            />
          </div>
          <div className="h-96 w-60 overflow-y-auto overflow-x-hidden">
            <div
              ref={ref}
              className="ease-in-out transition-transform duration-500 overflow-x-hidden"
            >
              {Array.isArray(songDetail?.lyric) &&
                songDetail?.lyric.map((lyric) => {
                  return (
                    <div
                      key={lyric?.rawTime}
                      className={`${
                        lyric?.rawTime === player.rawTime
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
          <div className="w-full" onClick={onPlaylistClick}>
            {Array.isArray(playlist) &&
              playlist.map((item) => {
                return (
                  <div
                    className="w-full flex items-center gap-1 cursor-pointer"
                    key={item.trackUpdateTime}
                    data-listid={item.id}
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
            {player.ended ? (
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
                  width: `${player.percentage}%`,
                }}
              />
            </div>
          </div>
          <div className="relative">
            <HamburgerButton
              theme="outline"
              size="24"
              className="text-grey-300 hover:text-cyan-500"
              onClick={toogle}
            />

            <div
              className={`absolute bottom-8 right-0 w-96 bg-grey-A400 text-grey-200 shadow-xl p-4 ${
                menuVisible ? 'visible' : 'invisible'
              }`}
            >
              <div>{songDetail?.detail?.name}</div>
              <div
                className="h-80 mt-4 text-sm text-grey-400 cursor-pointer"
                onClick={onSongListClick}
              >
                <AutoSizer className="h-full">
                  {({ width, height }) => (
                    <List
                      height={height}
                      width={width}
                      overscanRowCount={6}
                      rowCount={listDetail?.tracks?.length ?? 0}
                      rowHeight={60}
                      rowRenderer={({ index, key, style }) => {
                        return (listDetail?.tracks?.length ?? 0) > index ? (
                          <div
                            key={key}
                            style={style}
                            className="flex gap-4 items-center"
                            data-songid={listDetail?.tracks?.[index]?.id}
                          >
                            <img
                              src={`${
                                listDetail?.tracks?.[index]?.al?.picUrl ??
                                'https://via.placeholder.com/60x60'
                              }?param=40y40`}
                              className="w-10 h-10"
                            />
                            <span>{listDetail?.tracks?.[index]?.name}</span>
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
