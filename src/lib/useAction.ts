import { useStore } from 'react-redux';

import { actionSelector, AnyAction, ChannelHooksStoreRootState, Store } from './store';
import { BasePipe, StreamGroupValues } from './types';
import { useBasePipe, Release, Fill } from './useBasePipe';

export type ActionPipe<
  TAction extends AnyAction = AnyAction,
> = BasePipe<TAction>;

export function useAction<
  TAction extends AnyAction = AnyAction,
>(
  actionType: TAction['type'] | TAction['type'][],
  connectedPipes?: BasePipe[],
): ActionPipe<TAction> {
  const store = useStore<ChannelHooksStoreRootState<TAction>>();

  const [pipe] = useBasePipe(() => createFill(actionType, store), connectedPipes ?? []);

  return pipe;
}

function createFill<
  TAction extends AnyAction,
  TConnectedPipes extends BasePipe[],
>(
  actionType: TAction['type'] | TAction['type'][],
  store: Store,
): Fill<TAction, TConnectedPipes> {
  const actionTypes = ([] as TAction['type'][]).concat(actionType);
  const streamHeadName = actionTypes.join(' / ');
  let num = 0;

  let prevStreamHead = null;

  return function fill(streamHead: symbol, streamGroupValues: StreamGroupValues<TConnectedPipes>, release: Release<TAction>) {
    const unsubscribe = store.subscribe(() => {
      const action = actionSelector<TAction>(store.getState());

      if (actionTypes.includes(action.type)) {
        prevStreamHead = Symbol(`${streamHeadName} (#${ ++ num})`);
        release(prevStreamHead, action, true);
      }
    });

    return unsubscribe;
  };
}
