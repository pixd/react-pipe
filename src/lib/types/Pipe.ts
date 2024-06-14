import { Connect } from './Connect';
import { DebugInstruction } from './Debug';

export const PIPE_ENTITY_TYPE = Symbol('PIPE_ENTITY_TYPE');

export type PipeType = 'data' | 'error';

export type BasePipe<
  TValue extends any = any,
> = {
  entityType: typeof PIPE_ENTITY_TYPE;
  type: PipeType;
  uniqKey: symbol;
  displayName: null | string;
  debugInstruction: null | DebugInstruction;
  connect: Connect<TValue>;
  emit: (value: TValue) => void;
  cancel: () => void;
  die: () => void;
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
