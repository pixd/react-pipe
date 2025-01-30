export type Stream<
  TValue extends any = any,
> = {
  /**
   * Available if import.meta.env.DEV
   */
  uniqKey: symbol;

  papa: symbol;
  data: TValue;
  release: ReleaseStream;
  released: boolean;
};

export type ReleaseStream = {
  (): void;
};
