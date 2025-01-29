import type { Adjunct } from './types';
import type { Emit } from './types';
import type { StreamGroupValues } from './types';
import type { UniversalDataPipe } from './types';
import { FINAL } from './types';
import { useBasePipe } from './useBasePipe';

export function usePipe<
  TAdjuncts extends [] | [Adjunct] | [Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | Adjunct[] = Adjunct[],
  TPipeBody extends (...args: StreamGroupValues<TAdjuncts>) => any = (...args: StreamGroupValues<TAdjuncts>) => any,
  TValue extends ReturnType<TPipeBody> = ReturnType<TPipeBody>,
>(pipeBody: TPipeBody, adjuncts?: TAdjuncts): UniversalDataPipe<TValue> {
  return useBasePipe(() => createFill(pipeBody), adjuncts);
}

function createFill(
  pipeBody: { (...args: any[]): any, displayName?: string },
) {
  const fill = (args: any[], emitStream: Emit, emitError: Emit) => {
    let result;
    try {
      result = pipeBody(...args);
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

      return () => {
        active = false;
      };
    }
    else {
      emitStream(FINAL(result));
      return null;
    }
  };

  fill.displayName = pipeBody.displayName || pipeBody.name;

  return fill;
}
