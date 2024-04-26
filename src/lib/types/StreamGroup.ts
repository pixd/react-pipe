import { BasePipe } from './Pipe';
import { Stream } from './Stream';

export type StreamGroup<
  TAdjuncts extends any = any,
> = {
  streamHead: symbol;
  members: StreamGroupMembers<TAdjuncts>;
  release: () => void;
};

type StreamGroupMembers<
  TAdjuncts extends any = any,
> = TAdjuncts extends (infer TAdjunct)[]
  ? Extract<TAdjunct, BasePipe> extends BasePipe<infer TValue>
    ? (null | Stream<TValue>)[]
    : []
  : TAdjuncts extends [infer TAdjunct, ...(infer TRestAdjuncts)]
    ? TAdjunct extends BasePipe<infer TValue>
      ? [null | Stream<TValue>, ...StreamGroupMembers<TRestAdjuncts>]
      : StreamGroupMembers<TRestAdjuncts>
    : [];

export type FilledStreamGroup<
  TAdjuncts extends any = any,
> = Omit<StreamGroup<TAdjuncts>, 'members'> & {
  members: FilledStreamGroupMembers<TAdjuncts>;
};

type FilledStreamGroupMembers<
  TAdjuncts extends any = any,
> = TAdjuncts extends (infer TAdjunct)[]
  ? Extract<TAdjunct, BasePipe> extends BasePipe<infer TValue>
    ? Stream<TValue>[]
    : []
  : TAdjuncts extends [infer TAdjunct, ...(infer TRestAdjuncts)]
    ? TAdjunct extends BasePipe<infer TValue>
      ? [Stream<TValue>, ...StreamGroupMembers<TRestAdjuncts>]
      : StreamGroupMembers<TRestAdjuncts>
    : [];
