export type Stream<
  TValue extends any = any,
> = {
  value: TValue;
  released: boolean;
  release: () => void;
};
