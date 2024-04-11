import { Stream } from './Stream';

export type ParentRelease<TValue extends any = any> = {
  (holderIndex: number, streamHead: symbol, stream: Stream<TValue>): void;
};
