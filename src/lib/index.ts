import { debug } from './debug';
import { destruct } from './destruct';
import { useActionPipe } from './useActionPipe';
import { useMountPipe } from './useMountPipe';
import { usePipe } from './usePipe';

export { pipesReducer, PIPE_STORE_KEY } from './store';
export { useActionPipe } from './useActionPipe';
export { useMountPipe } from './useMountPipe';
export { usePipe } from './usePipe';

export type { BasePipe, DataPipe } from './types';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  destruct,
  debug,
  useActionPipe,
  useMountPipe,
  usePipe,
};
