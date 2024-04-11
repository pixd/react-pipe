import { BasePipe } from './Pipe';
import { Stream } from './Stream';

export type StreamGroupValues<TItems extends any> = TItems extends [infer TItem, ...(infer TRestItems)]
  ? [
    TItem extends BasePipe<infer TPipeValue>
      ? TPipeValue
      : TItem extends Stream<infer TStreamValue>
        ? TStreamValue
        : never,
    ...StreamGroupValues<TRestItems>,
  ]
  : [];
