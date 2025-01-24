import { Stream } from './Stream';

export type OnParentPipeStreamEmit<
  TValue extends any = any,
> = {
  (
    stream: Stream<TValue>,
  ): void;
};
