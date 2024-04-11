import { AnyAction as DeprecatedAnyAction } from 'redux';

export type { Store } from 'redux';

export type AnyAction = DeprecatedAnyAction;

export const PIPE_STORE_KEY = '@@pipes-store';

export type ChannelHooksStoreRootState<TAction extends AnyAction = AnyAction> = {
  [key in typeof PIPE_STORE_KEY]: ChannelHooksStoreState<TAction>;
};

export type ChannelHooksStoreState<TAction extends AnyAction = AnyAction> = {
  action: TAction;
};

export function pipesReducer(state = { action: null }, action: AnyAction) {
  return {
    ...state,
    action,
  };
}

export function actionSelector<TAction extends AnyAction>(state: ChannelHooksStoreRootState<TAction>): TAction {
  return state[PIPE_STORE_KEY].action;
}
