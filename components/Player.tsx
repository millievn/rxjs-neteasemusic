import { AudioHTMLAttributes, DetailedHTMLProps, SyntheticEvent } from 'react';
import { Observable } from 'rxjs';
import { useEventCallback } from 'rxjs-hooks';
import { map, take, takeWhile, tap, throttleTime } from 'rxjs/operators';

export type PlayerProps = {
  onTimeUpdate?(v: TimeUpdateValue): void;
} & Omit<
  DetailedHTMLProps<AudioHTMLAttributes<HTMLAudioElement>, HTMLAudioElement>,
  'onTimeUpdate'
>;

export type TimeUpdateValue = {
  currentTime: number;
  duration: number;
  ended: boolean;
  volume: number;
};

export default function Player({ onTimeUpdate, ...props }: PlayerProps) {
  const [onRealTimeUpdate] = useEventCallback(
    (te$) => {
      return te$.pipe(
        throttleTime(1000),
        map((e: { target: TimeUpdateValue }) => ({
          currentTime: e.target.currentTime,
          duration: e.target.duration,
          ended: e.target.ended,
          volume: e.target.volume,
        })),
        takeWhile((v) => !v.ended),
        tap((v) => {
          console.log('>>>>>>>>>');
          onTimeUpdate?.(v);
        })
      );
    },
    {
      currentTime: 0,
      duration: 0,
      ended: true,
      volume: 1,
    },
    [onTimeUpdate]
  );

  return <audio {...props} onTimeUpdate={onRealTimeUpdate} />;
}
