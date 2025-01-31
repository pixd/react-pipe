type State = Record<string, any>;

type RootState<
  TStateName extends string = string,
  TState extends State = State,
> = {
  [key in TStateName]: TState;
};

type StateSelector<
  TRootState extends RootState<TStateName> = RootState,
  TStateName extends string = string,
> = {
  (rootState: TRootState): TRootState[TStateName];
};

type Selectors<
  TRootState extends RootState<TStateName> = RootState,
  TStateName extends string = string,
> = {
  [TKey in Extract<keyof TRootState[TStateName], string> as `select${Capitalize<TKey>}`]: (
    rootState: TRootState,
  ) => TRootState[TStateName][TKey];
} & {
  [TKey in keyof TRootState[TStateName] as TKey extends `${infer T}RequestState`
    ? (
      | `selectIs${Capitalize<T>}RequestIdle`
      | `selectIs${Capitalize<T>}RequestActive`
      | `selectIs${Capitalize<T>}RequestResolved`
      | `selectIs${Capitalize<T>}RequestRejected`
      | `selectIs${Capitalize<T>}RequestPending`
    )
    : never]: (rootState: TRootState) => boolean;
};

export function createSelectors<
  TRootState extends RootState<TStateName> = RootState,
  TStateName extends string = string,
>(
  initialState: TRootState[TStateName],
  stateSelector: StateSelector<TRootState, TStateName>,
): Selectors<TRootState, TStateName> {
  return Object.keys(initialState).reduce((selectors, key) => {
    // @ts-ignore
    selectors[createSelectorName(key)] = (rootState: TRootState) => stateSelector(rootState)[key];

    if (key.endsWith('RequestState')) {
      // @ts-ignore
      selectors[createStatusSelectorName(key, 'Idle')] = (rootState: TRootState) =>
        stateSelector(rootState)[key].isIdle;

      // @ts-ignore
      selectors[createStatusSelectorName(key, 'Active')] = (rootState: TRootState) =>
        stateSelector(rootState)[key].isActive;

      // @ts-ignore
      selectors[createStatusSelectorName(key, 'Resolved')] = (rootState: TRootState) =>
        stateSelector(rootState)[key].isResolved;

      // @ts-ignore
      selectors[createStatusSelectorName(key, 'Rejected')] = (rootState: TRootState) =>
        stateSelector(rootState)[key].isRejected;

      // @ts-ignore
      selectors[createStatusSelectorName(key, 'Pending')] = (rootState: TRootState) =>
        stateSelector(rootState)[key].isPending;
    }

    return selectors;
  }, {} as Selectors<TRootState, TStateName>);
}

function createSelectorName(key: string): string {
  return 'select' + key[0].toUpperCase() + key.slice(1);
}

function createStatusSelectorName(key: string, status: string): string {
  return ('selectIs' + key[0].toUpperCase() + key.slice(1)).replace(/State$/, status);
}
