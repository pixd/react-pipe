import type { Stream } from './Stream';

export const dataType = {
  data: 'data',
  error: 'error',
} as const;

export type DataType = (typeof dataType)[keyof typeof dataType];

export const dataBarrelStatus = {
  active: 'active',
  deleted: 'deleted',
} as const;

export type DataBarrelStatus = (typeof dataBarrelStatus)[keyof typeof dataBarrelStatus];

export type DataBarrelRegistry = Record<symbol, DataBarrel>;

export type DataBarrel<
  TData extends any = any,
> = {
  /**
   * Available if import.meta.env.DEV
   */
  uniqKey: symbol;

  papa: symbol;
  data: TData;
  dataType: DataType;
  final: boolean;
  status: DataBarrelStatus;
  emittedStreams: Stream[];
};
