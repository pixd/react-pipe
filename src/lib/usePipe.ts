import { useMemo } from 'react';

import { Adjunct, DataPipe, DebugInstruction, StreamGroupValues, UniversalDataPipe } from './types';
import { getDebugInstruction, getNonEmptyDisplayName, useBasePipe, Fill, EmitStream }
  from './useBasePipe';

export function usePipe<
  TAdjuncts extends [] | [Adjunct] | [Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | Adjunct[] = Adjunct[],
  TBarrel extends (...args: StreamGroupValues<TAdjuncts>) => any = (...args: StreamGroupValues<TAdjuncts>) => any,
  TValue extends ReturnType<TBarrel> = ReturnType<TBarrel>,
>(barrel: TBarrel, adjuncts: TAdjuncts): UniversalDataPipe<TValue> {
  let displayName: string;
  let debugInstruction: null | DebugInstruction = null;

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { dn, di } = useMemo(() => {
      const displayName = barrel.name || getNonEmptyDisplayName(adjuncts);
      const debugInstruction = getDebugInstruction(adjuncts) ?? null;

      return { dn: displayName, di: debugInstruction };
    }, []); // eslint-disable-line
    displayName = dn; debugInstruction = di;
  }

  const [errorPipe, errorEmitStream] = useBasePipe(() => createErrorPipeFill(displayName), [debugInstruction]);
  const [pipe] = useBasePipe(() => createDataPipeFill(barrel, errorEmitStream, displayName), adjuncts);

  const commonPipe = useMemo(() => {
    const commonPipe = pipe as DataPipe<TValue>;
    commonPipe.error = errorPipe;
    return commonPipe;
  }, []); // eslint-disable-line

  return commonPipe as UniversalDataPipe<TValue>;
}

function createDataPipeFill<
  TValue extends any = any,
  TStreamGroupValues extends any[] = any[],
>(
  barrel: (...args: TStreamGroupValues) => TValue,
  errorEmitStream: EmitStream,
  displayName?: string,
): Fill<TValue, TStreamGroupValues> {
  const fill = (streamGroupValues: TStreamGroupValues, emitStream: EmitStream<TValue>) => {
    let result;
    try {
      result = barrel(...streamGroupValues);
    }
    catch (error: any) {
      errorEmitStream(error);
      return null;
    }

    if (result instanceof Promise) {
      let active: boolean = true;

      result
        .then((result) => {
          active && emitStream(result);
        })
        .catch((error) => {
          active && errorEmitStream(error);
        })
        .finally(() => {
          active = false;
        });

      return () => (active = false);
    }
    else {
      emitStream(result);
      return null;
    }
  };

  fill.displayName = displayName;
  return fill;
}

function createErrorPipeFill(displayName?: string) {
  const fill = () => undefined;

  fill.displayName = displayName + '.error';
  return fill;
}
