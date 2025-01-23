import { Adjunct } from './Adjunct';
import { BasePipe } from './Pipe';
import { Stream } from './Stream';

export type StreamGroupStatus = 'idle' | 'active' | 'finished';

export type StreamGroup<
  TAdjuncts extends Adjunct[] = Adjunct[],
> = {
  uniqKey: symbol;
  streamHead: symbol;
  status: StreamGroupStatus;
  members: StreamGroupMembers<TAdjuncts>;
  emitDataGroups: Record<symbol, boolean[]>;
  emitErrorGroups: Record<symbol, boolean[]>;
  finish: null | (() => void);
};

export type StreamGroupMembers<
  TAdjuncts extends any = any,
> = TAdjuncts extends [infer TAdjunct, ...(infer TRestAdjuncts)]
  ? TAdjunct extends BasePipe<infer TValue>
    ? [null | Stream<TValue>, ...StreamGroupMembers<TRestAdjuncts>]
    : StreamGroupMembers<TRestAdjuncts>
  : TAdjuncts extends (infer TAdjunct)[]
    ? Extract<TAdjunct, BasePipe> extends BasePipe<infer TValue>
      ? (null | Stream<TValue>)[]
      : []
    : [];

export type StreamGroups<
  TAdjuncts extends Adjunct[] = Adjunct[],
> = Record<symbol, StreamGroup<TAdjuncts>>;

export type StreamGroupValues<
  TAdjuncts extends any[] = any[],
> = TAdjuncts extends [infer TAdjunct, ...(infer TRestAdjuncts)]
  ? TAdjunct extends BasePipe<infer TValue>
    ? [TValue, ...StreamGroupValues<TRestAdjuncts>]
    : StreamGroupValues<TRestAdjuncts>
  : TAdjuncts extends (infer TAdjunct)[]
    ? Extract<TAdjunct, BasePipe> extends BasePipe<infer TValue>
      ? TValue[]
      : []
    : [];
