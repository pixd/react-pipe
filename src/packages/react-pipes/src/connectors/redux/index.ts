import { useStore } from 'react-redux';
import type { Store } from 'redux';
import type { UnknownAction } from 'redux';

import type { Adjunct } from '../../../../es-pipes/src/index.core';
import type { BasePipe } from '../../../../es-pipes/src/index.core';
import type { Emit } from '../../../../es-pipes/src/index.core';
import { useCommonPipe } from '../../useCommonPipe';

type ActionPipe<
  TAction extends UnknownAction = UnknownAction,
> = BasePipe<TAction>;

type PipeKitState = {
  action: null | UnknownAction;
};

type ReduxPipeKit<
  TStoreKey extends string = string,
> = {
  storeKey: TStoreKey;
  reducer: {
    (state: PipeKitState, action: UnknownAction): PipeKitState;
  };
  useActionPipe: {
    <
      TAction extends UnknownAction = UnknownAction,
      TAdjunct extends Adjunct = Adjunct,
    >(
      actionType: TAction['type'],
      adjuncts?: TAdjunct[],
    ): ActionPipe<TAction>;
    <
      TAction extends UnknownAction = UnknownAction,
      TAdjunct extends Adjunct = Adjunct,
    >(
      actionType: TAction['type'][],
      adjuncts?: TAdjunct[],
    ): ActionPipe<TAction>;
  };
};

export function createReduxPipeKit<
  TStoreKey extends string = string,
>(storeKey: TStoreKey): ReduxPipeKit<TStoreKey> {
  const reducer = (state: PipeKitState = { action: null }, action: UnknownAction) => {
    return { ...state, action };
  };

  const useActionPipe = (actionType: string | string[], adjuncts?: Adjunct[]): ActionPipe => {
    // TODO `store` can change
    //  But is this change normal? Probably not. For now, let's leave it as it is.
    const store = useStore();
    return useCommonPipe(() => createFill(storeKey, actionType, store), adjuncts ?? []);
  };

  return {
    storeKey,
    reducer,
    useActionPipe,
  };
}

function createFill(
  storeKey: string,
  actionType: string | string[],
  store: Store,
) {
  const actionTypes = ([] as string[]).concat(actionType);

  const fill = (args: any[], emitStream: Emit) => {
    let active: boolean = true;

    const unsubscribe = store.subscribe(() => {
      const action = store.getState()[storeKey].action;

      if (actionTypes.includes(action.type)) {
        // TODO Why?
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

  fill.displayName = 'Action channel (' + (actionTypes.length > 1 ? `${actionTypes[0]} + ${actionTypes.length - 1} ${actionTypes.length - 1 === 1 ? 'other' : 'others'}` : actionTypes[0]) + ')';

  return fill;
}
