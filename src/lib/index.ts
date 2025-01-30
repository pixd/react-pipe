import { debug } from './debug';
import { displayName } from './debug';
import { latest } from './createPipeKit';
import { leading } from './createPipeKit';
import { once } from './createPipeKit';

export { initDebugPanel } from './debug-panel';
export { PIPE_STORE_KEY } from './store';
export { pipesReducer } from './store';
export { useActionPipe } from './useActionPipe';
export { useMountPipe } from './useMountPipe';
export { usePipe } from './usePipe';

export type { BasePipe } from './types';
export type { DataPipe } from './types';
export type { ActionPipe } from './useActionPipe';
export type { MountPipe } from './useMountPipe';

export default {
  debug,
  dn: displayName,
  latest,
  leading,
  once,
};
