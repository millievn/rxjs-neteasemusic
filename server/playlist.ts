import { query$ } from './fetch';
import { ProfileM } from './user';

export type PlaylistItem = {
  subscribers: ProfileM[];
  subscribed: boolean;
  creator: ProfileM;
  artists: string | null;
  tracks: string | null;
  updateFrequency: string | null;
  backgroundCoverId: number;
  backgroundCoverUrl: string | null;
  titleImage: number;
  titleImageUrl: string | null;
  englishTitle: string | null;
  opRecommend: boolean;
  recommendInfo: string | null;
  adType: number;
  subscribedCount: number;
  cloudTrackCount: number;
  userId: number;
  trackNumberUpdateTime: number;
  highQuality: boolean;
  createTime: number;
  updateTime: number;
  coverImgId: number;
  newImported: boolean;
  anonimous: boolean;
  trackCount: number;
  coverImgUrl: string;
  specialType: number;
  trackUpdateTime: number;
  commentThreadId: string;
  totalDuration: number;
  privacy: number;
  playCount: number;
  tags: string[];
  ordered: true;
  description: string | null;
  status: number;
  name: string;
  id: number;
  coverImgId_str: string;
};

export const playlistQ$ = (uid: number) =>
  query$<{
    playlist: PlaylistItem[];
  }>(`/user/playlist`, {
    params: {
      uid,
    },
  });

export type PlaylistDetailM = {
  trackIds: {
    alg: null | string;
    at: number;
    id: number;
    v: number;
  }[];
  tracks: {
    a: null | string;
    al: {
      id: number;
      name: string;
      pic: number;
      picUrl: string;
      pic_str: string;
      tns: [];
    };
    alia: [];
    ar: [{ id: number; name: string; tns: []; alias: [] }];
    cd: string;
    cf: string;
    copyright: number;
    cp: number;
    crbt: null | string;
    djId: number;
    dt: number;
    fee: number;
    ftype: number;
    h: { br: number; fid: number; size: number; vd: number };
    id: number;
    l: { br: number; fid: number; size: number; vd: number };
    m: { br: number; fid: number; size: number; vd: number };
    mark: number;
    mst: number;
    mv: number;
    name: string;
    no: number;
    noCopyrightRcmd: null | string;
    originCoverType: number;
    originSongSimpleData: null | string;
    pop: number;
    pst: number;
    publishTime: number;
    rt: string;
    rtUrl: null | string;
    rtUrls: [];
    rtype: number;
    rurl: null | string;
    s_id: number;
    single: number;
    st: number;
    t: number;
    v: number;
  }[];
};

export const playlistDetailQ$ = (id: number | string) =>
  query$<{
    playlist: PlaylistItem & PlaylistDetailM;
  }>(`/playlist/detail`, {
    params: {
      id,
    },
  });
