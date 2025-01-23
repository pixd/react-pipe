import { useEffect, useRef } from 'react';

import { FINAL } from './FINAL';
import { Adjunct, BasePipe } from './types';
import { useBasePipe, Emit, Reset } from './useBasePipe';

export type MountPipe = BasePipe<null>;

export function useMountPipe<
  TAdjunct extends Adjunct = Adjunct,
>(
  adjuncts?: TAdjunct[],
): MountPipe {
  const emitBankRef = useRef<{ emits: Emit[] }>({ emits: [] });
  const resetRef = useRef<{ reset: null | Reset }>({ reset: null });

  const pipe = useBasePipe((reset: Reset) => {
    resetRef.current.reset = reset;
    return createFill(emitBankRef.current.emits);
  }, adjuncts ?? []);

  useEffect(() => {
    emitBankRef.current.emits.forEach((emit) => emit(FINAL(null)));
    const reset = resetRef.current.reset;
    return () => reset?.();
  }, [pipe]);

  return pipe;
}

function createFill(emits: Emit[]) {
  const fill = (streamGroupValues: any, emitStream: Emit) => {
    emits.push(emitStream);
    return null;
  };
  fill.displayName = 'Mount pipe';
  return fill;
}
