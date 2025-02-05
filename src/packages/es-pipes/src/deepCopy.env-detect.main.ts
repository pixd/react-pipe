export type DeepCopy = {
  <
    TData extends any,
  >(data: TData, circleHack?: any[][]): TData;
};

export function deepCopy<
  TData extends any,
>(data: TData, circleHack?: any[][]): TData;

export function deepCopy(data: any) {
  return data;
}
