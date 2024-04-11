import { ParentRelease } from './ParentRelease';
import { ParentTerminate } from './ParentTerminate';

export type BasePipe<TValue extends any = any> = {
  connect: (selfIndex: number, onRelease: ParentRelease<TValue>, onTerminate: ParentTerminate) => void;
};

export type DataPipe<TValue extends any = any> = BasePipe<TValue> & {
  error: ErrorPipe;
};

export type UniversalDataPipe<TBarrel extends (...args: any) => any> = Promise<any> extends ReturnType<TBarrel>
  ? DataPipe<Exclude<ReturnType<TBarrel>, Promise<any>> | (Extract<ReturnType<TBarrel>, Promise<any>> extends Promise<infer TValue> ? TValue : never)>
  : BasePipe<ReturnType<TBarrel>>;

export type ErrorPipe<TValue extends Error = Error> = BasePipe<TValue>;
