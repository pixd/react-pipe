import { FINAL, Final } from './FINAL';
import { Adjunct, StreamGroupValues, UniversalDataPipe } from './types';
import { useBasePipe, Emit } from './useBasePipe';

export function usePipe<
  TAdjuncts extends [] | [Adjunct] | [Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | Adjunct[] = Adjunct[],
  TPipeBody extends (...args: StreamGroupValues<TAdjuncts>) => any = (...args: StreamGroupValues<TAdjuncts>) => any,
  TValue extends ReturnType<TPipeBody> = ReturnType<TPipeBody>,
>(pipeBody: TPipeBody, adjuncts?: TAdjuncts): UniversalDataPipe<TValue> {
  return useBasePipe(() => createFill(pipeBody), adjuncts);
}

function createFill<
  TValue extends any = any,
  TArgs extends any[] = any[],
>(
  pipeBody: { (...args: TArgs): TValue | Promise<TValue>, displayName?: string },
) {
  const fill = (streamGroupValues: TArgs, emitStream: Emit<TValue | Final<TValue>>, emitError: Emit) => {
    let result;
    try {
      result = pipeBody(...streamGroupValues);
    }
    catch (error: any) {
      emitError(FINAL(error));
      return null;
    }

    if (result instanceof Promise) {
      let active: boolean = true;

      result
        .then((result) => {
          active && emitStream(FINAL(result));
        })
        .catch((error) => {
          active && emitError(FINAL(error));
        })
        .finally(() => {
          active = false;
        });

      return () => (active = false);
    }
    else {
      emitStream(FINAL(result));
      return null;
    }
  };

  fill.displayName = pipeBody.displayName || pipeBody.name;
  return fill;
}
