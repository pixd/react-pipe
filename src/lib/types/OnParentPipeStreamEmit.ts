import { Stream } from './Stream';

export type OnParentPipeStreamEmit<
  TValue extends any = any,
> = {
  (
    streamHead: symbol,
    stream: Stream<TValue>,
  ): void;
};
