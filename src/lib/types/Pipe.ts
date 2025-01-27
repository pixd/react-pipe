import type { Connect } from './Connect';
import type { CreateDebugger } from './Dev';
import { EDataType } from './DataBarrel';

export const PIPE_ENTITY_TYPE = Symbol('PIPE_ENTITY_TYPE');

export type BasePipe<
  TValue extends any = any,
> = {
  entityType: typeof PIPE_ENTITY_TYPE;
  type: EDataType;

  /**
   * Available if process.env.NODE_ENV === 'development'
   */
  uniqKey: symbol;

  connect: Connect<TValue>;

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
  /**
   * Available if process.env.NODE_ENV === 'development'
   */
  createDebugger: CreateDebugger;
};

export type BasePipeWithDisplayName<
  TValue extends any = any,
> = BasePipe<TValue> & {
  /**
   * Available if process.env.NODE_ENV === 'development'
   */
  displayName: string;
};

// TODO Check returned array second member. Is it normal?
export type PipeKit<
  TValue extends any = any,
> = [pipe: DataPipe<TValue>, HZ: undefined | (() => void)];
