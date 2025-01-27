import { useEffect } from 'react';
import { useMemo } from 'react';

import { createPipeKit } from './createPipeKit';
import type { Adjunct } from './types';
import type { CreateFill } from './types';
import type { DataPipe } from './types';
import type { StreamGroupValues } from './types';

export function useBasePipe<
  TValue extends any = any,
  TAdjuncts extends [] | [Adjunct] | [Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | Adjunct[] = Adjunct[],
>(
  createFill: CreateFill<TValue, StreamGroupValues<TAdjuncts>>,
  adjuncts?: TAdjuncts,
): DataPipe<TValue>

export function useBasePipe(createFill: CreateFill, adjuncts: Adjunct[]): DataPipe {
  const [pipe, onUnmount] = useMemo(() => {
    return createPipeKit(createFill, adjuncts);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => onUnmount, [onUnmount]);

  return pipe;
}
