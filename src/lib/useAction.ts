import { useStore } from 'react-redux';

import { actionSelector, AnyAction, ChannelHooksStoreRootState, Store } from './store';
import { Adjunct, BasePipe } from './types';
import { useBasePipe, Release, Fill } from './useBasePipe';

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

  const [pipe] = useBasePipe(() => createFill(actionType, store), adjuncts ?? []);

  return pipe;
}

function createFill<
  TAction extends AnyAction,
  TStreamGroupValues extends any[] = any[],
>(
  actionType: TAction['type'] | TAction['type'][],
  store: Store,
): Fill<TAction, TStreamGroupValues> {
  const actionTypes = ([] as TAction['type'][]).concat(actionType);
  const streamHeadName = actionTypes[0] + (actionTypes.length > 1 ? ` + ${actionTypes.length - 1}` : '');
  let num = 0;

  const fill = (streamHead: symbol, streamGroupValues: TStreamGroupValues, release: Release<TAction>) => {
    // TODO Any times subscribe?
    return store.subscribe(() => {
      const action = actionSelector<TAction>(store.getState());

      if (actionTypes.includes(action.type)) {
        const streamHead = Symbol(`${streamHeadName} (#${ ++ num})`);
        release(streamHead, action);
      }
    });
  };

  fill.displayName = streamHeadName;
  return fill;
}
