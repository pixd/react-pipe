export function normalizeResponse<
  TData extends any,
  TDataProp extends null | string,
  TErrorProp extends null | string,
>(
  promise: Promise<TData>,
  dataProp: TDataProp,
  errorProp: TErrorProp,
): Promise<
  & (TDataProp extends string ? { [key in TDataProp]: TData } : TData)
  & (TErrorProp extends string ? { [key in TErrorProp]: Error } : Error)
> {
  // @ts-ignore
  return promise
    .then((data) => {
      return dataProp == null ? data : { [dataProp]: data };
    })
    .catch((error) => {
      return errorProp == null ? error : { [errorProp]: error };
    });
}
