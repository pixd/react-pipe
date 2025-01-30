export type CreateFill<
  TValue extends any = any,
  TArgs extends any[] = any[],
> = {
  (terminateAll: TerminateAll): Fill<TValue, TArgs>;
};

export type Fill<
  TValue extends any = any,
  TArgs extends any[] = any[],
> = {
  (
    args: TArgs,
    emitData: Emit<TValue | Final<TValue>>,
    emitError: Emit,
  ): void | undefined | null | Retire;

  /**
   * Available if import.meta.env.DEV
   */
  displayName?: string;
};

export type TerminateAll = {
  (): void;
};

export type Emit<
  TValue extends any = any,
> = {
  (
    value: TValue,
  ): void;
};

export type Retire = {
  (): void;
};

export const FINAL_TYPE = Symbol('FINAL');

export type Final<
  TValue extends any = any,
> = {
  type: typeof FINAL_TYPE;
  value: TValue;
};

export function FINAL<
  TValue extends any = undefined,
>(value?: TValue): Final<TValue> {
  return {
    type: FINAL_TYPE,
    value: value as TValue,
  };
}
