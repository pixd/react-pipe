import { useEffect } from 'react';
import { useRef } from 'react';

import type { Adjunct } from '@@es-pipes/core';
import type { BasePipe } from '@@es-pipes/core';
import type { Emit } from '@@es-pipes/core';
import type { TerminateAll } from '@@es-pipes/core';
import { FINAL } from '@@es-pipes/core';

import { useCommonPipe } from './useCommonPipe';

export type MountPipe = BasePipe<null>;

export function useMountPipe<
  TAdjunct extends Adjunct = Adjunct,
>(
  adjuncts?: TAdjunct[],
): MountPipe {
  const refs = useRef<{ emits: Emit[], terminateAll: null | TerminateAll }>({ emits: [], terminateAll: null });

  useEffect(() => {
    refs.current.emits.forEach((emit) => emit(FINAL(null)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => refs.current.terminateAll?.();
  }, []);

  return useCommonPipe((terminateAll: TerminateAll) => {
    refs.current.terminateAll = terminateAll;
    return createFill(refs.current.emits);
  }, adjuncts ?? []);
}

function createFill(emits: Emit[]) {
  const fill = (args: any[], emit: Emit) => {
    emits.push(emit);
    return null;
  };

  fill.displayName = 'Mount pipe';

  return fill;
}
