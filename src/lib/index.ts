import { debug } from './debug';
import { displayName } from './debug';
import { destruct } from './destruct';
import { latest } from './instruction';

export { PIPE_STORE_KEY } from './store';
export { pipesReducer } from './store';
export { useActionPipe } from './useActionPipe';
export { useMountPipe } from './useMountPipe';
export { usePipe } from './usePipe';

export type { BasePipe } from './types';
export type { DataPipe } from './types';
export type { ActionPipe } from './useActionPipe';
export type { MountPipe } from './useMountPipe';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  debug,
  destruct,
  displayName,
  latest,
};
