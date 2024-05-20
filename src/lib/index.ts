import { debug } from './debug';
import { initDebugPanel } from './debugPanel';
import { destruct } from './destruct';
import { useAction } from './useAction';
import { usePipe } from './usePipe';

export { pipesReducer, PIPE_STORE_KEY } from './store';
export { useAction } from './useAction';
export { initDebugPanel } from './debugPanel';
export { usePipe } from './usePipe';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  destruct,
  debug,
  useAction,
  initDebugPanel,
  usePipe,
};
