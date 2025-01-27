import { Adjunct } from './Adjunct';
import { DataBarrelRegistry } from './DataBarrel';
import { BasePipe } from './Pipe';
import { Stream } from './Stream';

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
   * Available if process.env.NODE_ENV === 'development'
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

export type StreamGroups<
  TAdjuncts extends Adjunct[] = Adjunct[],
> = Record<symbol, StreamGroup<TAdjuncts>>;
