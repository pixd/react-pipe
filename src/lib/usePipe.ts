import { useMemo } from 'react';

import { Adjunct, DataPipe, StreamGroupValues, UniversalDataPipe } from './types';
import { useBasePipe, Release, Fill } from './useBasePipe';

export function usePipe<
  TValue extends any = any,
  TAdjuncts extends [] | [Adjunct] | [Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | Adjunct[] = Adjunct[],
  TBarrel extends (...args: StreamGroupValues<TAdjuncts>) => TValue = (...args: StreamGroupValues<TAdjuncts>) => TValue,
>(
  barrel: TBarrel,
  adjuncts: TAdjuncts,
): UniversalDataPipe<TBarrel> {
  const [errorPipe, errorRelease] = useBasePipe(() => () => undefined, []);
  const [pipe] = useBasePipe(() => createFill(barrel, errorRelease), adjuncts);

  const commonPipe = useMemo(() => {
    const commonPipe = pipe as DataPipe<TValue>;
    commonPipe.error = errorPipe;
    return commonPipe;
  }, []); // eslint-disable-line

  return commonPipe as UniversalDataPipe<TBarrel>;
}

function createFill<
  TValue extends any = any,
  TStreamGroupValues extends any[] = any[],
>(
  barrel: (...args: TStreamGroupValues) => TValue,
  errorRelease: Release,
): Fill<TValue, TStreamGroupValues> {
  return function fill(streamHead: symbol, streamGroupValues: TStreamGroupValues, release: Release<TValue>) {
    let result;
    try {
      result = barrel(...streamGroupValues);
    }
    catch (error: any) {
      errorRelease(streamHead, error);
      return null;
    }

    if (result instanceof Promise) {
      let active: boolean = true;

      result
        .then((result) => {
          active && release(streamHead, result);
        })
        .catch((error) => {
          active && errorRelease(streamHead, error);
        })
        .finally(() => {
          active = false;
        });

      return () => (active = false);
    }
    else {
      release(streamHead, result);
      return null;
    }
  };
}
