import { User } from '../../api/types';
import { createIdleRequestState, createActiveRequestState, createResolvedRequestState,
  createRejectedRequestState, createSelectors, AnyAction, RequestState, RootState }
  from '../../store';

const pageAction = (actionType: string) => 'PageInitialization/' + actionType;

export const PAGE_INIT = pageAction('PAGE_INIT');
export const PAGE_RESET = pageAction('PAGE_RESET');

export const PAGE_DATA_REQUEST = pageAction('PAGE_DATA_REQUEST');
export const PAGE_DATA_REQUEST_RESOLVE = pageAction('PAGE_DATA_REQUEST_RESOLVE');
export const PAGE_DATA_REQUEST_REJECT = pageAction('PAGE_DATA_REQUEST_REJECT');

type State = {
  pageDataRequestState: RequestState;
  user: null | User;
};

export const initialState: State = {
  pageDataRequestState: createIdleRequestState(),
  user: null,
};

export const pageInitializationReducer = (state = initialState, action: AnyAction): State => {
  switch (action.type) {
    case PAGE_DATA_REQUEST: {
      return {
        ...state,
        pageDataRequestState: createActiveRequestState(),
      };
    }
    case PAGE_DATA_REQUEST_RESOLVE: {
      return {
        ...state,
        pageDataRequestState: createResolvedRequestState(),
        user: action.payload.user,
      };
    }
    case PAGE_DATA_REQUEST_REJECT: {
      return {
        ...state,
        pageDataRequestState: createRejectedRequestState(action.payload.error),
      };
    }
    default: {
      return state;
    }
  }
}

export const pageInitializationSelectors = createSelectors<RootState, 'PageInitialization'>(
  initialState,
  state => state.PageInitialization,
);
