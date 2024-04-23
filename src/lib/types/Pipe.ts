import { Connect } from './Connect';
import { DebugInstruction } from './Debug';

export const PIPE = Symbol('PIPE');

export type BasePipe<TValue extends any = any> = {
  type: typeof PIPE;
  displayName?: string;
  debugInstruction?: DebugInstruction;
  connect: Connect<TValue>;
};

export type DataPipe<TValue extends any = any> = BasePipe<TValue> & {
  error: BasePipe;
};

export type UniversalDataPipe<TBarrel extends (...args: any) => any> = Promise<any> extends ReturnType<TBarrel>
  ? DataPipe<Exclude<ReturnType<TBarrel>, Promise<any>> | (Extract<ReturnType<TBarrel>, Promise<any>> extends Promise<infer TValue> ? TValue : never)>
  : BasePipe<ReturnType<TBarrel>>;

export type BasePipeWithDebugInstruction<TValue extends any = any> = BasePipe<TValue> & {
  debugInstruction: DebugInstruction;
};

export type BasePipeWithDisplayName<TValue extends any = any> = BasePipe<TValue> & {
  displayName: string;
};
