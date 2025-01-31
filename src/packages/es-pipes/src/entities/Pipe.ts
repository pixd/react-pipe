import type { Adjunct } from './Adjunct';
import type { Connect } from './Connect';
import type { DataType } from './DataBarrel';
import type { DownstreamConnection } from './Connect';
import type { CreateDebugger } from './Dev';
import type { ParentPipes } from './ParentPipe';
import type { StreamGroupRegistry } from './StreamGroup';

export const PIPE_ENTITY_TYPE = Symbol('PIPE_ENTITY_TYPE');

export type BasePipe<
  TValue extends any = any,
> = {
  entityType: typeof PIPE_ENTITY_TYPE;
  type: DataType;

  /**
   * Available if import.meta.env.DEV
   */
  uniqKey: symbol;

  connect: Connect<TValue>;

  /**
   * Available if import.meta.env.DEV
   */
  displayName?: null | string;

  /**
   * Available if import.meta.env.DEV
   */
  createDebugger?: null | CreateDebugger;
};

export type DataPipe<
  TValue extends any = any,
> = BasePipe<TValue> & {
  error: BasePipe;
};

export type UniversalDataPipe<
  TValue extends any = any,
> = Promise<any> extends TValue
  ? DataPipe<Exclude<TValue, Promise<any>> | (Extract<TValue, Promise<any>> extends Promise<infer TPromiseValue> ? TPromiseValue : never)>
  : BasePipe<TValue>;

export type BasePipeWithCreateDebugger<
  TValue extends any = any,
> = BasePipe<TValue> & {
  /**
   * Available if import.meta.env.DEV
   */
  createDebugger: CreateDebugger;
};

export type BasePipeWithDisplayName<
  TValue extends any = any,
> = BasePipe<TValue> & {
  /**
   * Available if import.meta.env.DEV
   */
  displayName: string;
};

// TODO Check returned array second member. Is it normal?
export type PipeKit<
  TValue extends any = any,
> = [pipe: DataPipe<TValue>, HZ: undefined | (() => void)];

export type PipeState<
  TValue extends any = any,
  TError extends any = any,
  TAdjuncts extends Adjunct[] = Adjunct[],
> = {
  /**
   * Available if import.meta.env.DEV
   */
  displayName?: string;

  parentPipes: ParentPipes<TAdjuncts>;
  streamGroupRegistry: StreamGroupRegistry<TAdjuncts>;
  dataPipe: CommonPipeState<TValue>;
  errorPipe: CommonPipeState<TError>;
};

export type CommonPipeState<
  TValue extends any = any,
> = {
  uniqKey: symbol;
  downstreamConnections: DownstreamConnection<TValue>[];
};
