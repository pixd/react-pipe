import { BasePipe } from './Pipe';
import { Stream } from './Stream';

export type StreamGroupValues<TItems extends any> = [] extends TItems
  ? []
  : TItems extends [infer TItem, ...(infer TRestItems)]
    ? TItem extends BasePipe<infer TPipeValue>
      ? [TPipeValue, ...StreamGroupValues<TRestItems>]
      : TItem extends Stream<infer TStreamValue>
        ? [TStreamValue, ...StreamGroupValues<TRestItems>]
        : StreamGroupValues<TRestItems>
    : TItems extends BasePipe<infer TPipeValue>[]
        ? TPipeValue[]
        : TItems extends Stream<infer TStreamValue>[]
          ? TStreamValue[]
          : [];
