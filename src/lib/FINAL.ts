const FINAL_TYPE = Symbol('FINAL');

export type Final<
  TValue extends any = any,
> = {
  type: typeof FINAL_TYPE;
  value: TValue;
}

export function FINAL<
  TValue extends any = undefined,
>(value?: TValue): Final<TValue> {
  return {
    type: FINAL_TYPE,
    value: value as TValue,
  };
}

export function isFinal(value: any): value is Final {
  return !! value && value.type === FINAL_TYPE && 'value' in value;
}
