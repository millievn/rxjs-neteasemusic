import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { qrcodeQ$, loginM$, QrcodeQM } from '@server';

export default function Page() {
  const router = useRouter();
  const [qrcode, setQrcode] = useState({
    qrurl: '',
    qrimg: '',
    unikey: '',
  } as QrcodeQM);

  useEffect(() => {
    const subscription = loginM$(qrcode?.unikey).subscribe((res) => {
      document.cookie = res.cookie;

      router.push('/');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [qrcode]);

  useEffect(() => {
    const subscription = qrcodeQ$().subscribe((qr) => {
      setQrcode(qr);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="grid place-items-center h-screen w-full">
      <div className="p-10 shadow-md text-center">
        <p>扫码登录</p>
        <div className="w-40 h-40">
          <img
            src={
              qrcode?.qrimg ??
              'https://via.placeholder.com/40x40?text=Visit+Blogging.com+Now'
            }
            alt=""
          />
        </div>
      </div>
    </div>
  );
}
