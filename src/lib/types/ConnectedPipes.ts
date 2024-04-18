import { BasePipe } from './Pipe';

export type ConnectedPipes<TItems extends any> = TItems extends (infer TItem)[]
  ? Extract<TItem, BasePipe>
  : TItems extends [infer TItem, ...(infer TRestItems)]
    ? TItem extends BasePipe
        ? [TItem, ...ConnectedPipes<TRestItems>]
        : ConnectedPipes<TRestItems>
    : [];
