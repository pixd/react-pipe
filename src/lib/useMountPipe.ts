import { useEffect } from 'react';

import { Adjunct, BasePipe } from './types';
import { useBasePipe } from './useBasePipe';

export type ActionPipe = BasePipe<null>;

export function useMountPipe<
  TAdjunct extends Adjunct = Adjunct,
>(
  adjuncts?: TAdjunct[],
): ActionPipe {
  const pipe = useBasePipe(createFill, adjuncts ?? []);

  useEffect(() => {
    pipe.emit(null);
    return () => pipe.reset();
  }, [pipe]);

  return pipe;
}

function createFill() {
  const fill = () => null;
  fill.displayName = 'Mount pipe';
  return fill;
}
