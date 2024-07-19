import { useStore } from 'react-redux';

import { actionSelector, AnyAction, ChannelHooksStoreRootState, Store } from './store';
import { Adjunct, BasePipe } from './types';
import { useBasePipe, Emit } from './useBasePipe';

export type ActionPipe<
  TAction extends AnyAction = AnyAction,
> = BasePipe<TAction>;

export function useActionPipe<
  TAction extends AnyAction = AnyAction,
  TAdjunct extends Adjunct = Adjunct,
>(
  actionType: TAction['type'] | TAction['type'][],
  adjuncts?: TAdjunct[],
): ActionPipe<TAction> {
  const store = useStore<ChannelHooksStoreRootState<TAction>>();

  return useBasePipe(() => createFill(actionType, store), adjuncts ?? []);
}

function createFill(
  actionType: string | string[],
  store: Store,
) {
  const actionTypes = ([] as string[]).concat(actionType);

  const fill = (streamGroupValues: any, emitStream: Emit) => {
    return store.subscribe(() => {
      const action = actionSelector(store.getState());

      if (actionTypes.includes(action.type)) {
        Promise.resolve().then(() => emitStream(action));
      }
    });
  };

  fill.displayName = 'Action listener (' + (actionTypes.length > 1 ? `${actionTypes[0]} + ${actionTypes.length - 1}` : actionTypes[0]) + ')';
  return fill;
}
