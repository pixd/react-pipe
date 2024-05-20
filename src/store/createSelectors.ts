type State = Record<string, any>;

type RootState<TStateName extends string = string, TState extends State = State> = {
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
    ? `select${Capitalize<T>}RequestIdle`
    : never]: (rootState: TRootState) => boolean;
} & {
  [TKey in keyof TRootState[TStateName] as TKey extends `${infer T}RequestState`
    ? `select${Capitalize<T>}RequestActive`
    : never]: (rootState: TRootState) => boolean;
} & {
  [TKey in keyof TRootState[TStateName] as TKey extends `${infer T}RequestState`
    ? `select${Capitalize<T>}RequestResolved`
    : never]: (rootState: TRootState) => boolean;
} & {
  [TKey in keyof TRootState[TStateName] as TKey extends `${infer T}RequestState`
    ? `select${Capitalize<T>}RequestRejected`
    : never]: (rootState: TRootState) => boolean;
} & {
  [TKey in keyof TRootState[TStateName] as TKey extends `${infer T}RequestState`
    ? `select${Capitalize<T>}RequestPending`
    : never]: (rootState: TRootState) => boolean;
};

type Enhancer<
  TRootState extends RootState<TStateName> = RootState,
  TStateName extends string = string,
> = {
  (selectors: Selectors<TRootState, TStateName>): Partial<Selectors<TRootState, TStateName>>;
};

function createStatusSelectorName(key: string, status: string): string {
  return ('select' + key[0].toUpperCase() + key.slice(1)).replace(/State$/, status);
}

export function createSelectors<
  TRootState extends RootState<TStateName> = RootState,
  TStateName extends string = string,
>(
  initialState: TRootState[TStateName],
  stateSelector: StateSelector<TRootState, TStateName>,
  ...enhancers: Enhancer<TRootState, TStateName>[]
): Selectors<TRootState, TStateName> {
  const selectors = Object.keys(initialState).reduce((selectors, key) => {
    const selectorName = 'select' + key[0].toUpperCase() + key.slice(1);
    // @ts-ignore
    selectors[selectorName] = (rootState: TRootState) => stateSelector(rootState)[key];

    if (key.endsWith('RequestState')) {
      const idleSelectorName = createStatusSelectorName(key, 'Idle');
      // @ts-ignore
      selectors[idleSelectorName] = (rootState: TRootState) =>
        stateSelector(rootState)[key].isIdle;

      const activeSelectorName = createStatusSelectorName(key, 'Active');
      // @ts-ignore
      selectors[activeSelectorName] = (rootState: TRootState) =>
        stateSelector(rootState)[key].isActive;

      const resolvedSelectorName = createStatusSelectorName(key, 'Resolved');
      // @ts-ignore
      selectors[resolvedSelectorName] = (rootState: TRootState) =>
        stateSelector(rootState)[key].isResolved;

      const rejectedSelectorName = createStatusSelectorName(key, 'Rejected');
      // @ts-ignore
      selectors[rejectedSelectorName] = (rootState: TRootState) =>
        stateSelector(rootState)[key].isRejected;

      const pendingSelectorName = createStatusSelectorName(key, 'Pending');
      // @ts-ignore
      selectors[pendingSelectorName] = (rootState: TRootState) =>
        stateSelector(rootState)[key].isPending;
    }

    return selectors;
  }, {} as Selectors<TRootState, TStateName>);

  return enhancers
    ? enhancers.reduce((selectors, enhancer) => ({ ...selectors, ...enhancer(selectors) }), selectors)
    : selectors;
}
