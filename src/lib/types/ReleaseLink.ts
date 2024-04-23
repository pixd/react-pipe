import { Stream } from './Stream';

export type ReleaseLink<
  TValue extends any = any,
> = {
  childIndex: number;
  streamHead: symbol;
  stream: Stream<TValue>;
};
