import { User } from '../../api/types';
import { requestState, createSelectors, AnyAction, RequestState, RootState } from '../../store';

const pageAction = (actionType: string) => 'PageInitialization/' + actionType;

export const PAGE_INIT = pageAction('PAGE_INIT');
export const PAGE_RESET = pageAction('PAGE_RESET');
export const PAGE_REFRESH = pageAction('PAGE_REFRESH');
export const ABORT_REQUEST = pageAction('ABORT_REQUEST');

export const PAGE_DATA_REQUEST = pageAction('PAGE_DATA_REQUEST');
export const PAGE_DATA_REQUEST_RESOLVE = pageAction('PAGE_DATA_REQUEST_RESOLVE');
export const PAGE_DATA_REQUEST_REJECT = pageAction('PAGE_DATA_REQUEST_REJECT');

export const FRIENDS_REQUEST = pageAction('FRIENDS_REQUEST');
export const FRIENDS_REQUEST_RESOLVE = pageAction('FRIENDS_REQUEST_RESOLVE');
export const FRIENDS_REQUEST_REJECT = pageAction('FRIENDS_REQUEST_REJECT');

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
      return { ...state };
    }
    case PAGE_RESET: {
      return { ...state };
    }
    case PAGE_REFRESH: {
      return {
        ...initialState,
        pageDataRequestState: requestState.forceIdle(),
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
