import { useObservable } from 'rxjs-hooks';
import {
  first,
  last,
  map,
  mergeMap,
  pluck,
  shareReplay,
  take,
  takeWhile,
} from 'rxjs/operators';
import {
  playlistQ$,
  profileQ$,
  playlistDetailQ$,
  lyricQ$,
  songDetailQ$,
} from '@server';
import Player, { TimeUpdateValue } from '@comp/Player';
import { useCallback, useMemo, useRef, useState } from 'react';

export default function Page() {
  const user = useObservable(profileQ$);
  const playlist = useObservable(() =>
    profileQ$().pipe(
      mergeMap((u) => playlistQ$(u.profile.userId)),
      pluck('playlist')
    )
  );

  const lyric$ = useMemo(() => {
    return lyricQ$(28802028).pipe(pluck('lyric'), shareReplay(1));
  }, []);

  const songDetail = useObservable(() =>
    songDetailQ$([28802028]).pipe(
      mergeMap((i) => i),
      take(1)
    )
  );

  const [active, setActive] = useState({
    time: 0,
    rawTime: '',
    content: '',
    idx: 0,
  });

  const ref = useRef<HTMLDivElement>();

  const lyrics = useObservable(() => lyric$);

  const onTimeUpdate = useCallback(
    (v: TimeUpdateValue) => {
      lyric$
        .pipe(
          mergeMap((i) => i),
          map((t, idx) => ({ ...t, idx })),
          last((t) => t?.time < v?.currentTime),
          takeWhile((v) => !!v)
        )
        .subscribe((v) => {
          setActive(v);
          ref.current.style.transform = `translateY(${Math.floor(
            192 - v.idx * 20
          )}px)`;
        });
    },
    [lyric$]
  );

  return (
    <article className="flex h-screen bg-grey-A400">
      <main className="flex-1 grid place-items-center relative min-w-max">
        {/* <div>
          <div>{playlistDetail?.playlist?.name}</div>
          <div>
            {playlistDetail?.playlist?.tracks?.map((song) => {
              return (
                <div key={song?.id}>
                  <div>{song?.name}</div>
                </div>
              );
            })}
          </div>
        </div> */}

        <div className="h-96 w-96 absolute shadow-md rounded-full transform -translate-y-36 opacity-50">
          <img
            src={songDetail?.al?.picUrl ?? 'https://via.placeholder.com/400'}
            alt="album"
            className="rounded-full"
          />
        </div>

        <div className="h-96 overflow-y-auto overflow-x-hidden">
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
                      lyric?.rawTime === active.rawTime
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
        <div>
          <img
            src={
              'https://p2.music.126.net/-OTPMtpp1bgXKGZ7UvdMfw==/109951165448830413.jpg' ??
              'https://via.placeholder.com/60x60?text=Visit+Blogging.com+Now'
            }
            alt=""
            className="w-12 h-12 rounded-full block hover:animate-spin"
          />
        </div>
        <Player
          src="https://music.163.com/song/media/outer/url?id=28802028.mp3"
          autoPlay
          onTimeUpdate={onTimeUpdate}
          loop
        />
      </footer>
    </article>
  );
}
