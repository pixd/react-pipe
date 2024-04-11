export const requestStatus = {
  IDLE: 'IDLE',
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',

  FORCE_IDLE: 'FORCE_IDLE',
  FORCE_ACTIVE: 'FORCE_ACTIVE',
  FORCE_RESOLVED: 'FORCE_RESOLVED',
  FORCE_REJECTED: 'FORCE_REJECTED',
} as const;

export type RequestStatus = keyof typeof requestStatus;

export type RequestStateMeta = Record<string, any>;

export type RequestIdleState = {
  isIdle: true,
  isActive: false,
  isResolved: false,
  isRejected: false,
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
  isPending: false,
  isForced: boolean,
  status: typeof requestStatus.REJECTED | typeof requestStatus.FORCE_REJECTED;
  error: null | TResponseError;
  meta: null | RequestStateMeta;
};

export type RequestState<
  TError extends Error = Error,
> =
  | RequestIdleState
  | RequestActiveState
  | RequestResolvedState
  | RequestRejectedState<TError>;

const defaultProps = {
  isIdle: false,
  isActive: false,
  isResolved: false,
  isRejected: false,
  isPending: false,
  isForced: false,
} as const;

export function createIdleRequestState(
  meta?: RequestStateMeta,
): RequestIdleState {
  return {
    ...defaultProps,
    isIdle: true,
    isPending: true,
    status: requestStatus.IDLE,
    error: null,
    meta: meta ?? null,
  };
}

export function createActiveRequestState(
  meta?: RequestStateMeta,
): RequestActiveState {
  return {
    ...defaultProps,
    isActive: true,
    isPending: true,
    status: requestStatus.ACTIVE,
    meta: meta ?? null,
    error: null,
  };
}

export function createResolvedRequestState(
  meta?: RequestStateMeta,
): RequestResolvedState {
  return {
    ...defaultProps,
    isResolved: true,
    status: requestStatus.RESOLVED,
    meta: meta ?? null,
    error: null,
  };
}

export function createRejectedRequestState<
  TError extends Error = Error,
>(
  error?: null | TError,
  meta?: RequestStateMeta,
): RequestRejectedState<TError> {
  return {
    ...defaultProps,
    isRejected: true,
    status: requestStatus.REJECTED,
    error: error ?? null,
    meta: meta ?? null,
  };
}

export function forceIdleRequestState(
  meta?: RequestStateMeta,
): RequestIdleState {
  const state = createIdleRequestState(meta);
  state.isForced = true;
  return state;
}

export function forceActiveRequestState(
  meta?: RequestStateMeta,
): RequestActiveState {
  const state = createActiveRequestState(meta);
  state.isForced = true;
  return state;
}

export function forceResolvedRequestState(
  meta?: RequestStateMeta,
): RequestResolvedState {
  const state = createResolvedRequestState(meta);
  state.isForced = true;
  return state;
}

export function forceRejectedRequestState<
  TError extends Error = Error,
>(
  error?: null | TError,
  meta?: RequestStateMeta,
): RequestRejectedState<TError> {
  const state = createRejectedRequestState(error, meta);
  state.isForced = true;
  return state;
}

export const requestState = {
  idle: createIdleRequestState,
  active: createActiveRequestState,
  resolved: createResolvedRequestState,
  rejected: createRejectedRequestState,
  forceIdle: forceIdleRequestState,
  forceActive: forceActiveRequestState,
  forceResolved: forceResolvedRequestState,
  forceRejected: forceRejectedRequestState,
};

export function isIdle(state: RequestState): boolean {
  return state.status === requestStatus.IDLE || state.status === requestStatus.FORCE_IDLE;
}

export function isActive(state: RequestState): boolean {
  return state.status === requestStatus.ACTIVE || state.status === requestStatus.FORCE_ACTIVE;
}

export function isResolved(state: RequestState): boolean {
  return state.status === requestStatus.RESOLVED || state.status === requestStatus.FORCE_RESOLVED;
}

export function isRejected(state: RequestState): boolean {
  return state.status === requestStatus.REJECTED || state.status === requestStatus.FORCE_REJECTED;
}

export function isPending(state: RequestState): boolean {
  return isIdle(state) || isActive(state);
}
