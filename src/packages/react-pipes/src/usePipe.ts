import type { Adjunct } from '../../es-pipes/src';
import type { Emit } from '../../es-pipes/src';
import type { StreamGroupValues } from '../../es-pipes/src';
import type { UniversalDataPipe } from '../../es-pipes/src';
import { FINAL } from '../../es-pipes/src';
import { useCommonPipe } from './useCommonPipe';

export function usePipe<
  TAdjuncts extends [] | [Adjunct] | [Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | Adjunct[] = Adjunct[],
  TPipeBody extends (...args: StreamGroupValues<TAdjuncts>) => any = (...args: StreamGroupValues<TAdjuncts>) => any,
  TValue extends ReturnType<TPipeBody> = ReturnType<TPipeBody>,
>(pipeBody: TPipeBody, adjuncts?: TAdjuncts): UniversalDataPipe<TValue> {
  return useCommonPipe(() => createFill(pipeBody), adjuncts);
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
