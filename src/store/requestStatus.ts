export const requestStatus = {
  IDLE: 'IDLE',
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
  ABORTED: 'ABORTED',

  FORCE_IDLE: 'FORCE_IDLE',
  FORCE_ACTIVE: 'FORCE_ACTIVE',
  FORCE_RESOLVED: 'FORCE_RESOLVED',
  FORCE_REJECTED: 'FORCE_REJECTED',
  FORCE_ABORTED: 'FORCE_ABORTED',
} as const;

export type RequestStatus = keyof typeof requestStatus;

export type RequestStateMeta = Record<string, any>;

export type RequestIdleState = {
  isIdle: true,
  isActive: false,
  isResolved: false,
  isRejected: false,
  isAborted: false,
  isPending: true,
  isForced: boolean,
  status: typeof requestStatus.IDLE | typeof requestStatus.FORCE_IDLE;
  error: null;
  meta: null | RequestStateMeta;
};

export type RequestActiveState = {
  isIdle: false,
  isActive: true,
  isResolved: false,
  isRejected: false,
  isAborted: false,
  isPending: true,
  isForced: boolean,
  status: typeof requestStatus.ACTIVE | typeof requestStatus.FORCE_ACTIVE;
  error: null;
  meta: null | RequestStateMeta;
};

export type RequestResolvedState = {
  isIdle: false,
  isActive: false,
  isResolved: true,
  isRejected: false,
  isAborted: false,
  isPending: false,
  isForced: boolean,
  status: typeof requestStatus.RESOLVED | typeof requestStatus.FORCE_RESOLVED;
  error: null;
  meta: null | RequestStateMeta;
};

export type RequestRejectedState<
  TResponseError extends Error = Error,
> = {
  isIdle: false,
  isActive: false,
  isResolved: false,
  isRejected: true,
  isAborted: false,
  isPending: false,
  isForced: boolean,
  status: typeof requestStatus.REJECTED | typeof requestStatus.FORCE_REJECTED;
  error: null | TResponseError;
  meta: null | RequestStateMeta;
};

export type RequestAbortedState = {
  isIdle: false,
  isActive: false,
  isResolved: false,
  isRejected: false,
  isAborted: true,
  isPending: false,
  isForced: boolean,
  status: typeof requestStatus.ABORTED | typeof requestStatus.FORCE_ABORTED;
  error: null;
  meta: null | RequestStateMeta;
};

export type RequestState<
  TError extends Error = Error,
> =
  | RequestIdleState
  | RequestActiveState
  | RequestResolvedState
  | RequestRejectedState<TError>
  | RequestAbortedState;

const defaultProps = {
  isIdle: false,
  isActive: false,
  isResolved: false,
  isRejected: false,
  isAborted: false,
  isPending: false,
  isForced: false,
} as const;

export const requestState = {
  idle: (meta?: RequestStateMeta): RequestIdleState => {
    return {
      ...defaultProps,
      isIdle: true,
      isPending: true,
      status: requestStatus.IDLE,
      error: null,
      meta: meta ?? null,
    };
  },
  active: (meta?: RequestStateMeta): RequestActiveState => {
    return {
      ...defaultProps,
      isActive: true,
      isPending: true,
      status: requestStatus.ACTIVE,
      meta: meta ?? null,
      error: null,
    };
  },
  resolved: (meta?: RequestStateMeta): RequestResolvedState => {
    return {
      ...defaultProps,
      isResolved: true,
      status: requestStatus.RESOLVED,
      meta: meta ?? null,
      error: null,
    };
  },
  rejected: <TError extends Error = Error>(error?: null | TError, meta?: RequestStateMeta): RequestRejectedState<TError> => {
    return {
      ...defaultProps,
      isRejected: true,
      status: requestStatus.REJECTED,
      error: error ?? null,
      meta: meta ?? null,
    };
  },
  aborted: (meta?: RequestStateMeta): RequestAbortedState => {
    return {
      ...defaultProps,
      isAborted: true,
      status: requestStatus.ABORTED,
      meta: meta ?? null,
      error: null,
    };
  },
  forceIdle: (meta?: RequestStateMeta): RequestIdleState => {
    const state = requestState.idle(meta);
    state.isForced = true;
    return state;
  },
  forceActive: (meta?: RequestStateMeta): RequestActiveState => {
    const state = requestState.active(meta);
    state.isForced = true;
    return state;
  },
  forceResolved: (meta?: RequestStateMeta): RequestResolvedState => {
    const state = requestState.resolved(meta);
    state.isForced = true;
    return state;
  },
  forceRejected: <TError extends Error = Error>(error?: null | TError, meta?: RequestStateMeta): RequestRejectedState<TError> => {
    const state = requestState.rejected(error, meta);
    state.isForced = true;
    return state;
  },
  forceAborted: (meta?: RequestStateMeta): RequestAbortedState => {
    const state = requestState.aborted(meta);
    state.isForced = true;
    return state;
  },
};
