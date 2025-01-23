import { User } from '../../api/types';
import { requestState, createSelectors, AnyAction, RequestState, RootState } from '../../store';

const pageActionType = (actionType: string) => 'PageInitialization/' + actionType;

export const PAGE_INIT = pageActionType('PAGE_INIT');
export const PAGE_RESET = pageActionType('PAGE_RESET');
export const PAGE_REFRESH = pageActionType('PAGE_REFRESH');

export const ABORT_REQUEST = pageActionType('ABORT_REQUEST');

export const PAGE_DATA_REQUEST = pageActionType('PAGE_DATA_REQUEST');
export const PAGE_DATA_REQUEST_RESOLVE = pageActionType('PAGE_DATA_REQUEST_RESOLVE');
export const PAGE_DATA_REQUEST_REJECT = pageActionType('PAGE_DATA_REQUEST_REJECT');

export const FRIENDS_REQUEST = pageActionType('FRIENDS_REQUEST');
export const FRIENDS_REQUEST_RESOLVE = pageActionType('FRIENDS_REQUEST_RESOLVE');
export const FRIENDS_REQUEST_REJECT = pageActionType('FRIENDS_REQUEST_REJECT');

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
