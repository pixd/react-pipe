import type { Adjunct } from './Adjunct';
import type { DataBarrelRegistry } from './DataBarrel';
import type { BasePipe } from './Pipe';
import type { Stream } from './Stream';

export enum EStreamGroupStatus {
  open = 'open',
  closed = 'closed',
  retired = 'retired',
  deleted = 'deleted',
}

export type StreamGroup<
  TAdjuncts extends Adjunct[] = Adjunct[],
> = {
  /**
   * Available if import.meta.env.DEV
   */
  uniqKey: symbol;

  papa: symbol;
  status: EStreamGroupStatus;
  members: StreamGroupMembers<TAdjuncts>;
  dataBarrelRegistry: DataBarrelRegistry;
  retire: null | (() => void);
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

export type StreamGroupRegistry<
  TAdjuncts extends Adjunct[] = Adjunct[],
> = Record<symbol, StreamGroup<TAdjuncts>>;
