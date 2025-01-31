import { useDispatch as useDispatchNative } from 'react-redux';
import { useSelector as useSelectorNative } from 'react-redux';
import { useStore as useStoreNative } from 'react-redux';
import { applyMiddleware } from 'redux';
import { createStore as createStoreNative } from 'redux';
import type { Action as ActionNative } from 'redux';
import type { AnyAction as AnyActionNative } from 'redux';
import type { UnknownAction as UnknownActionNative } from 'redux';
import { createLogger } from 'redux-logger';

import { rootReducer } from './rootReducer';

const logger = createLogger({ collapsed: true, timestamp: false });

export function createStore(initialState = {}) {
  return createStoreNative(
    rootReducer,
    initialState,
    applyMiddleware(
      logger,
    )
  );
}

export type Action = ActionNative;
export type AnyAction = AnyActionNative;
export type UnknownAction = UnknownActionNative;

export type RootState = ReturnType<typeof rootReducer>;

export const useStore = useStoreNative.withTypes<ReturnType<typeof createStore>>();
export const useDispatch = useDispatchNative.withTypes<ReturnType<typeof createStore>['dispatch']>();
export const useSelector = useSelectorNative.withTypes<ReturnType<ReturnType<typeof createStore>['getState']>>();
