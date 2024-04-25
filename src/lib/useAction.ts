import { useStore } from 'react-redux';

import { actionSelector, AnyAction, ChannelHooksStoreRootState, Store } from './store';
import { Adjunct, BasePipe } from './types';
import { useBasePipe, EmitStream, Fill } from './useBasePipe';

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

  const fill = (streamGroupValues: any, emitStream: EmitStream<TAction>) => {
    // TODO Any times subscribe?
    return store.subscribe(() => {
      const action = actionSelector<TAction>(store.getState());

      if (actionTypes.includes(action.type)) {
        emitStream(action);
      }
    });
  };

  fill.displayName = actionTypes[0] + (actionTypes.length > 1 ? ` + ${actionTypes.length - 1}` : '');
  return fill;
}
