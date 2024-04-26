import { useStore } from 'react-redux';

import { actionSelector, AnyAction, ChannelHooksStoreRootState, Store } from './store';
import { Adjunct, BasePipe } from './types';
import { useBasePipe, Emit } from './useBasePipe';

export type ActionPipe<
  TAction extends AnyAction = AnyAction,
> = BasePipe<TAction>;

export function useAction<
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
    // TODO Any times subscribe?
    return store.subscribe(() => {
      const action = actionSelector(store.getState());

      if (actionTypes.includes(action.type)) {
        emitStream(action);
      }
    });
  };

  fill.displayName = actionTypes[0] + (actionTypes.length > 1 ? ` + ${actionTypes.length - 1}` : '');
  return fill;
}
