import { useDispatch as useDispatchNative, useSelector as useSelectorNative,
  useStore as useStoreNative } from 'react-redux';
import { applyMiddleware, createStore as createStoreNative, Action as ActionNative,
  AnyAction as AnyActionNative, UnknownAction as UnknownActionNative } from 'redux';
import { createLogger as createLoggerMiddleware } from 'redux-logger';

import { rootReducer } from './rootReducer';

const loggerMiddleware = createLoggerMiddleware({ collapsed: true });

export function createStore(initialState = {}) {
  return createStoreNative(
    rootReducer,
    initialState,
    applyMiddleware(
      loggerMiddleware,
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
