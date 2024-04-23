import { useMemo } from 'react';

import { Adjunct, DataPipe, StreamGroupValues, UniversalDataPipe } from './types';
import { getDebugInstruction, getNonEmptyDisplayName, useBasePipe, Release, Fill } from './useBasePipe';

export function usePipe<
  TValue extends any = any,
  TAdjuncts extends [] | [Adjunct] | [Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | Adjunct[] = Adjunct[],
  TBarrel extends (...args: StreamGroupValues<TAdjuncts>) => TValue = (...args: StreamGroupValues<TAdjuncts>) => TValue,
>(barrel: TBarrel, adjuncts: TAdjuncts): UniversalDataPipe<TBarrel> {
  const { displayName, debugInstruction } = useMemo(() => {
    const displayName = barrel.name || getNonEmptyDisplayName(adjuncts);
    const debugInstruction = getDebugInstruction(adjuncts) ?? null;
    return { displayName, debugInstruction };
  }, []); // eslint-disable-line

  const [errorPipe, errorRelease] = useBasePipe(() => createErrorPipeFill(displayName), [debugInstruction]);
  const [pipe] = useBasePipe(() => createDataPipeFill(displayName, barrel, errorRelease), adjuncts);

  const commonPipe = useMemo(() => {
    const commonPipe = pipe as DataPipe<TValue>;
    commonPipe.error = errorPipe;
    return commonPipe;
  }, []); // eslint-disable-line

  return commonPipe as UniversalDataPipe<TBarrel>;
}

function createDataPipeFill<
  TValue extends any = any,
  TStreamGroupValues extends any[] = any[],
>(
  displayName: string,
  barrel: (...args: TStreamGroupValues) => TValue,
  errorRelease: Release,
): Fill<TValue, TStreamGroupValues> {
  const fill = (streamHead: symbol, streamGroupValues: TStreamGroupValues, release: Release<TValue>) => {
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

  fill.displayName = displayName;
  return fill;
}

function createErrorPipeFill(displayName: string) {
  const fill = () => undefined;

  fill.displayName = displayName + '.error';
  return fill;
}
