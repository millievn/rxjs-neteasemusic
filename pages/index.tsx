import { useObservable } from 'rxjs-hooks';

import { playlistQ$, profileQ$, playlistDetailQ$ } from '@server';
import { mergeMap, pluck } from 'rxjs/operators';

export default function Page() {
  const user = useObservable(profileQ$);
  const playlist = useObservable(() =>
    profileQ$().pipe(
      mergeMap((u) => playlistQ$(u.profile.userId)),
      pluck('playlist')
    )
  );

  const playlistDetail = useObservable(() => playlistDetailQ$(369781634));

  return (
    <article className="flex h-screen">
      <main className="flex-1">main</main>
      <aside className=" flex flex-col items-center w-40 px-4 py-6 box-border bg-gray-800">
        <div className="flex flex-col items-center mb-20">
          <img
            src={
              user?.profile?.avatarUrl ??
              'https://via.placeholder.com/60x60?text=Visit+Blogging.com+Now'
            }
            alt=""
            className="w-12 h-12 rounded-full block hover:animate-spin"
          />
          <p className="mt-2 text-gray-200 text-xs">
            {user?.profile?.nickname ?? ''}
          </p>
        </div>

        <div className="w-full overflow-y-auto">
          <div className="flex items-center gap-1 w-full mb-2">
            <span className="flex-1 border-b border-purple-500" />
            <span className="text-purple-500 text-xs">我的歌单</span>
            <span className="flex-1 border-b border-purple-500" />
          </div>
          <div className="w-full">
            {Array.isArray(playlist) &&
              playlist.map((item) => {
                return (
                  <div className="w-full flex items-center gap-1" key={item.id}>
                    <span className="block w-1 h-1 rounded-full bg-purple-500"></span>{' '}
                    <span className="h-6 text-xs text-gray-300 overflow-ellipsis break-all overflow-hidden leading-loose">
                      {item.name}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </aside>
      <footer className="fixed bottom-0 left-0 w-full bg-gray-800 ">
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
      </footer>
    </article>
  );
}
