export type Stream<
  TValue extends any = any,
> = {
  value: TValue;
  release: () => void;
};
