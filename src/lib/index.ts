import { debug } from './debug';
import { initDebugPanel } from './debugPanel';
import { destruct } from './destruct';
import { useActionPipe } from './useActionPipe';
import { useMountPipe } from './useMountPipe';
import { usePipe } from './usePipe';

export { initDebugPanel } from './debugPanel';
export { pipesReducer, PIPE_STORE_KEY } from './store';
export { useActionPipe } from './useActionPipe';
export { useMountPipe } from './useMountPipe';
export { usePipe } from './usePipe';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  destruct,
  debug,
  initDebugPanel,
  useActionPipe,
  useMountPipe,
  usePipe,
};
