import type { Adjunct } from './Adjunct';
import type { DataBarrelRegistry } from './DataBarrel';
import type { BasePipe } from './Pipe';
import type { Stream } from './Stream';

export const streamGroupStatus = {
  open: 'open',
  closed: 'closed',
  retired: 'retired',
  deleted: 'deleted',
} as const;

export type StreamGroupStatus = (typeof streamGroupStatus)[keyof typeof streamGroupStatus];

export type StreamGroup<
  TAdjuncts extends Adjunct[] = Adjunct[],
> = {
  /**
   * Available if import.meta.env.DEV
   */
  uniqKey: symbol;

  papa: symbol;
  status: StreamGroupStatus;
  members: StreamGroupMembers<TAdjuncts>;
  dataBarrelRegistry: DataBarrelRegistry;
  retire: null | (() => void);
};

// TODO Rename to something like `AdjunctsStreams`
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

// TODO Rename to something like `AdjunctsValues`
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

// TODO Should rely on a `TStreamGroup`, not a `TAdjuncts`
export type StreamGroupRegistry<
  TAdjuncts extends Adjunct[] = Adjunct[],
> = Record<symbol, StreamGroup<TAdjuncts>>;
