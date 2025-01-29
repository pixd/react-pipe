export type Stream<
  TValue extends any = any,
> = {
  /**
   * Available if process.env.NODE_ENV === 'development'
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
