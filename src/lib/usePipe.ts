import { useMemo } from 'react';

import { StreamGroupValues } from './types';
import { BasePipe, DataPipe, UniversalDataPipe } from './types';
import { useBasePipe, Release, Fill } from './useBasePipe';

export function usePipe<
  TValue extends any,
  TConnectedPipes extends [] | [BasePipe] | [BasePipe, BasePipe] | [BasePipe, BasePipe, BasePipe] | [BasePipe, BasePipe, BasePipe, BasePipe] | [BasePipe, BasePipe, BasePipe, BasePipe, BasePipe] | [BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe] | [BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe] | [BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe] | [BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe] | [BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe, BasePipe] | BasePipe[],
  TBarrel extends (...args: StreamGroupValues<TConnectedPipes>) => TValue,
>(
  barrel: TBarrel,
  connectedPipes: TConnectedPipes,
): UniversalDataPipe<TBarrel> {
  const [errorPipe, onErrorRelease] = useBasePipe(() => () => undefined, []);
  const [pipe] = useBasePipe(() => createFill(barrel, onErrorRelease), connectedPipes);

  const commonPipe = useMemo(() => {
    const commonPipe = pipe as DataPipe<TValue>;
    commonPipe.error = errorPipe;
    return commonPipe;
  }, []); // eslint-disable-line

  return commonPipe as UniversalDataPipe<TBarrel>;
}

function createFill<
  TValue extends any,
  TConnectedPipes extends BasePipe[],
  TBarrel extends (...args: StreamGroupValues<TConnectedPipes>) => TValue,
>(
  barrel: TBarrel,
  errorRelease: Release<Error>,
): Fill<TValue, TConnectedPipes> {
  return function fill(streamHead: symbol, streamGroupValues: StreamGroupValues<TConnectedPipes>, release: Release<TValue>) {
    let completed: boolean = false;
    const complete = () => (completed = true);

    const result = barrel(...streamGroupValues);

    if (result instanceof Promise) {
      result
        .then((result) => {
          if ( ! completed) {
            complete();
            release(streamHead, result);
          }
        })
        .catch((error) => {
          if ( ! completed) {
            complete();
            errorRelease(streamHead, error);
          }
        });
    }
    else {
      complete();
      release(streamHead, result);
    }

    return complete;
  };
}
