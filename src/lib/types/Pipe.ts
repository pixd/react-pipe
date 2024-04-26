import { Connect } from './Connect';
import { DebugInstruction } from './Debug';

export const PIPE = Symbol('PIPE');

export type BasePipe<
  TValue extends any = any,
> = {
  type: typeof PIPE;
  displayName?: null | string;
  debugInstruction?: null | DebugInstruction;
  connections: number;
  connect: Connect<TValue>;
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

export type BasePipeWithDebugInstruction<
  TValue extends any = any,
> = BasePipe<TValue> & {
  debugInstruction: DebugInstruction;
};

export type BasePipeWithDisplayName<
  TValue extends any = any,
> = BasePipe<TValue> & {
  displayName: string;
};
