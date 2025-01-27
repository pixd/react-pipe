import { useEffect, useRef } from 'react';

import type { Adjunct } from './types';
import type { BasePipe } from './types';
import type { Emit } from './types';
import type { TerminateAll } from './types';
import { FINAL } from './types';
import { useBasePipe } from './useBasePipe';

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

  return useBasePipe((terminateAll: TerminateAll) => {
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
