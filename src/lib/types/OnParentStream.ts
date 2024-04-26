import { Stream } from './Stream';

export type OnParentStream<
  TValue extends any = any,
> = {
  (
    streamHead: symbol,
    stream: Stream<TValue>,
  ): void;
};
