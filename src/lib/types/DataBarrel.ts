import { PipeType } from './Pipe';
import { Stream } from './Stream';

export type DataBarrelRegistry = Record<symbol, DataBarrelRegistryMember>;

export type DataBarrelRegistryMember = {
  papa: symbol;
  dataBarrel: DataBarrel;
  emittedStreams: Stream[];
}

export type DataBarrel<
  TData extends any = any,
> = {
  uniqKey: symbol;
  data: TData;
  dataType: PipeType;
  final: boolean;
};
