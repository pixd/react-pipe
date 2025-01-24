export type Stream<
  TValue extends any = any,
> = {
  papa: symbol;
  value: TValue;
  released: boolean;
  release: () => void;
};
