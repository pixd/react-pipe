import { Connect } from './Connect';
import { CreateDebugger } from './Dev';

export const PIPE_ENTITY_TYPE = Symbol('PIPE_ENTITY_TYPE');

export type PipeType = 'data' | 'error';

export type BasePipe<
  TValue extends any = any,
> = {
  entityType: typeof PIPE_ENTITY_TYPE;
  type: PipeType;
  uniqKey: symbol;

  connect: Connect<TValue>;
  throw: (error: any) => void;
  reset: () => void;
  terminate: () => void;

  /**
   * Available if process.env.NODE_ENV === 'development'
   */
  displayName?: null | string;

  /**
   * Available if process.env.NODE_ENV === 'development'
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
  createDebugger: CreateDebugger;
};

export type BasePipeWithDisplayName<
  TValue extends any = any,
> = BasePipe<TValue> & {
  displayName: string;
};
