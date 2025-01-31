import type { User } from '../../api/types';
import { requestState } from '../../store';
import { createSelectors } from '../../store';
import type { AnyAction } from '../../store';
import type { RequestState } from '../../store';
import type { RootState } from '../../store';

export const PAGE_INIT = 'PAGE_INITIALIZATION/PAGE_INIT';
export const PAGE_RESET = 'PAGE_INITIALIZATION/PAGE_RESET';
export const PAGE_REFRESH = 'PAGE_INITIALIZATION/PAGE_REFRESH';

export const ABORT_REQUEST = 'PAGE_INITIALIZATION/ABORT_REQUEST';

export const PAGE_DATA_REQUEST = 'PAGE_INITIALIZATION/PAGE_DATA_REQUEST';
export const PAGE_DATA_REQUEST_RESOLVE = 'PAGE_INITIALIZATION/PAGE_DATA_REQUEST_RESOLVE';
export const PAGE_DATA_REQUEST_REJECT = 'PAGE_INITIALIZATION/PAGE_DATA_REQUEST_REJECT';

export const FRIENDS_REQUEST = 'PAGE_INITIALIZATION/FRIENDS_REQUEST';
export const FRIENDS_REQUEST_RESOLVE = 'PAGE_INITIALIZATION/FRIENDS_REQUEST_RESOLVE';
export const FRIENDS_REQUEST_REJECT = 'PAGE_INITIALIZATION/FRIENDS_REQUEST_REJECT';

type State = {
  user: null | User;
  friends: null | User[];

  pageDataRequestState: RequestState;
  friendsRequestState: RequestState;
};

export const initialState: State = {
  user: null,
  friends: null,

  pageDataRequestState: requestState.idle(),
  friendsRequestState: requestState.idle(),
};

export const pageInitializationReducer = (state = initialState, { type, payload }: AnyAction): State => {
  switch (type) {
    case PAGE_INIT: {
      return {
        ...state,
      };
    }
    case PAGE_RESET:
    case PAGE_REFRESH: {
      return {
        ...state,
        ...initialState,
      };
    }
    case ABORT_REQUEST: {
      return {
        ...state,
        pageDataRequestState: state.pageDataRequestState.isActive
          ? requestState.aborted()
          : state.pageDataRequestState,
        friendsRequestState: state.friendsRequestState.isActive
          ? requestState.aborted()
          : state.friendsRequestState,
      };
    }
    case PAGE_DATA_REQUEST: {
      return {
        ...state,
        pageDataRequestState: requestState.active(),
      };
    }
    case PAGE_DATA_REQUEST_RESOLVE: {
      return {
        ...state,
        pageDataRequestState: requestState.resolved(),
        user: payload.user,
      };
    }
    case PAGE_DATA_REQUEST_REJECT: {
      return {
        ...state,
        pageDataRequestState: requestState.rejected(payload.error),
      };
    }
    case FRIENDS_REQUEST: {
      return {
        ...state,
        friendsRequestState: requestState.active(),
      };
    }
    case FRIENDS_REQUEST_RESOLVE: {
      return {
        ...state,
        friendsRequestState: requestState.resolved(),
        friends: payload.friends,
      };
    }
    case FRIENDS_REQUEST_REJECT: {
      return {
        ...state,
        friendsRequestState: requestState.rejected(payload.error),
      };
    }
    default: {
      return state;
    }
  }
}

export const pageInitializationSelectors = createSelectors<RootState, 'PageInitialization'>(
  initialState,
  (state) => state.PageInitialization,
);
