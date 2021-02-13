import { qrcodeQ$, loginM$ } from '@server';
import { useEffect } from 'react';
import { useObservable } from 'rxjs-hooks';
import { useRouter } from 'next/router';

export default function Page() {
  const router = useRouter();
  const value = useObservable(qrcodeQ$);

  useEffect(() => {
    const subscription = loginM$(value?.unikey).subscribe((res) => {
      document.cookie = res.cookie;

      router.push('/');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [value]);

  return (
    <div className="grid place-items-center h-screen w-full">
      <div className="p-10 shadow-md text-center">
        <p>扫码登录</p>
        <div className="w-40 h-40">
          <img
            src={
              value?.qrimg ??
              'https://via.placeholder.com/40x40?text=Visit+Blogging.com+Now'
            }
            alt=""
          />
        </div>
      </div>
    </div>
  );
}
