import { Stream } from './Stream';

export type ParentRelease<TValue extends any = any> = {
  (pipeIndex: number, streamHead: symbol, stream: Stream<TValue>): void;
};
