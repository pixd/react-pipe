import { useEffect } from 'react';
import { useMemo } from 'react';

import type { Adjunct } from '../../es-pipes/src/index.core';
import type { CreateFill } from '../../es-pipes/src/index.core';
import type { DataPipe } from '../../es-pipes/src/index.core';
import type { StreamGroupValues } from '../../es-pipes/src/index.core';
import { createPipeKit } from '../../es-pipes/src/index.core';

export function useCommonPipe<
  TValue extends any = any,
  TAdjuncts extends [] | [Adjunct] | [Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | Adjunct[] = Adjunct[],
>(
  createFill: CreateFill<TValue, StreamGroupValues<TAdjuncts>>,
  adjuncts?: TAdjuncts,
): DataPipe<TValue>

export function useCommonPipe(createFill: CreateFill, adjuncts: Adjunct[]): DataPipe {
  const [pipe, onUnmount] = useMemo(() => {
    return createPipeKit(createFill, adjuncts);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => onUnmount, [onUnmount]);

  return pipe;
}
