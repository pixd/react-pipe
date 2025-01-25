import { DataBarrel } from './DataBarrel';

export type Stream<
  TValue extends any = any,
> = {
  uniqKey: symbol;
  papa: symbol;
  dataBarrel: DataBarrel<TValue>;
  release: () => void;
  released: boolean;
};
