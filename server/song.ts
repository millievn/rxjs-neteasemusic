import { map, pluck } from 'rxjs/operators';

import { query$ } from './fetch';
import { lyricParser } from '@utils';

export type LyricM = {
  sgc: boolean;
  sfy: boolean;
  qfy: boolean;
  transUser?: {
    id: number;
    status: number;
    demand: number;
    userid: number;
    nickname: string;
    uptime: number;
  };
  lyricUser?: {
    id: number;
    status: number;
    demand: number;
    userid: number;
    nickname: string;
    uptime: number;
  };
  lrc?: {
    version: number;
    lyric: string;
  };
  klyric?: { version: number; lyric: string };
  tlyric?: { version: number; lyric: string };
  code: number;
};

export const lyricQ$ = (id: number | string) => {
  return query$<LyricM>(`/lyric`, {
    params: {
      id,
    },
    skip: !id,
  }).pipe(map(lyricParser));
};

export const songUrlQ$ = (id: number | string) =>
  query$(`/song/url`, {
    params: {
      id,
    },
  });

export type SongM = {
  name: string;
  id: number;
  pst: number;
  t: number;
  ar: [{ id: number; name: string; tns: []; alias: [] }];
  alia: [];
  pop: number;
  st: number;
  rt: null;
  fee: number;
  v: number;
  crbt: null;
  cf: '';
  al: {
    id: number;
    name: string;
    picUrl: string;
    tns: [];
    pic: number;
  };
  dt: number;
  h: { br: number; fid: number; size: number; vd: number };
  m: { br: number; fid: number; size: number; vd: number };
  l: { br: number; fid: number; size: number; vd: number };
  a: null;
  cd: string;
  no: number;
  rtUrl: null;
  ftype: number;
  rtUrls: [];
  djId: number;
  copyright: number;
  s_id: number;
  mark: number;
  originCoverType: number;
  originSongSimpleData: null;
  single: number;
  noCopyrightRcmd: null;
  rtype: number;
  rurl: null;
  mst: number;
  cp: number;
  mv: number;
  publishTime: number;
  pc: {
    nickname: '';
    uid: number;
    fn: string;
    cid: string;
    alb: string;
    ar: string;
    sn: string;
    br: number;
  };
};

export const songDetailQ$ = (ids: Array<number | string>) =>
  query$<{ songs: SongM[] }>(`/song/detail`, {
    params: {
      ids: ids.join(','),
    },
  }).pipe(pluck('songs'));
