import { BasePipe } from './Pipe';
import { Stream } from './Stream';

export type StreamGroupValues<TItems extends any> = TItems extends (infer TItem)[]
  ? Extract<TItem, BasePipe> extends BasePipe<infer TValue>
    ? TValue[]
    : Extract<TItem, Stream> extends Stream<infer TValue>
      ? TValue[]
      : []
  : TItems extends [infer TItem, ...(infer TRestItems)]
    ? TItem extends BasePipe<infer TValue>
      ? [TValue, ...StreamGroupValues<TRestItems>]
      : TItem extends Stream<infer TValue>
        ? [TValue, ...StreamGroupValues<TRestItems>]
        : StreamGroupValues<TRestItems>
    : [];
