import { useStore } from 'react-redux';

import type { AnyAction } from './store';
import type { ChannelHooksStoreRootState } from './store';
import type { Store } from './store';
import { actionSelector } from './store';
import type { Adjunct } from './types';
import type { BasePipe } from './types';
import type { Emit } from './types';
import { useBasePipe } from './useBasePipe';

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

  const fill = (args: any[], emitStream: Emit) => {
    let active: boolean = true;

    const unsubscribe = store.subscribe(() => {
      const action = actionSelector(store.getState());

      if (actionTypes.includes(action.type)) {
        Promise.resolve().then(() => {
          active && emitStream(action)
        });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  };

  fill.displayName = 'Action listener (' + (actionTypes.length > 1 ? `${actionTypes[0]} + ${actionTypes.length - 1}` : actionTypes[0]) + ')';

  return fill;
}
