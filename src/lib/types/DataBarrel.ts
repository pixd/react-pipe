import { Stream } from './Stream';

export enum EDataBarrelStatus {
  active = 'active',
  deleted = 'deleted',
}

export type DataBarrelRegistry = Record<symbol, DataBarrel>;

export type DataBarrel<
  TData extends any = any,
> = {
  /**
   * Available if process.env.NODE_ENV === 'development'
   */
  uniqKey: symbol;

  papa: symbol;
  data: TData;
  dataType: EDataType;
  final: boolean;
  status: EDataBarrelStatus;
  emittedStreams: Stream[];
};

export enum EDataType {
  data = 'data',
  error = 'error',
}
