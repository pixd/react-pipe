import React, { useCallback, useEffect } from 'react';

import { getFriends, getUser } from '../../api';
import pipe, { useAction, usePipe } from '../../lib';
import { useDispatch, useSelector } from '../../store';
import { FRIENDS_REQUEST, FRIENDS_REQUEST_REJECT, FRIENDS_REQUEST_RESOLVE, PAGE_INIT, PAGE_REFRESH,
  PAGE_RESET, PAGE_DATA_REQUEST, PAGE_DATA_REQUEST_REJECT, PAGE_DATA_REQUEST_RESOLVE,
  pageInitializationSelectors } from './store';

export function PageInitialization() {
  usePageInit();
  usePageDataRequest();
  // useFriendsRequest();

  const dispatch = useDispatch();

  const pageDataRequestState = useSelector(pageInitializationSelectors.selectPageDataRequestState);
  const friendsRequestState = useSelector(pageInitializationSelectors.selectFriendsRequestState);
  const user = useSelector(pageInitializationSelectors.selectUser);
  const friends = useSelector(pageInitializationSelectors.selectFriends);

  const handleRefresh = useCallback(() => {
    dispatch({ type: PAGE_REFRESH });
  }, [dispatch]);

  return (
    <>
      <div>
        <button className="button"
          onClick={handleRefresh}
        >
          Refresh
        </button>
      </div>
      <div>
        {pageDataRequestState.isPending
          ? 'User loading ...'
          : pageDataRequestState.isRejected
            ? 'User request error'
            : 'User: ' + user!.name}
      </div>
      {user
        ? (
          <div>
            {friendsRequestState.isPending
              ? 'Friends loading ...'
              : friendsRequestState.isRejected
                ? 'Friends request error'
                : 'Friends: ' + friends!.map((friend) => friend.name).join(', ')}
          </div>
        )
        : null}
    </>
  );
}

function usePageInit() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: PAGE_INIT });

    // setTimeout(() => dispatch({ type: PAGE_INIT }), 300);

    return () => {
      dispatch({ type: PAGE_RESET });
    };
  }, []); // eslint-disable-line
}

function usePageDataRequest() {
  const dispatch = useDispatch();

  const actionPipe = useAction([PAGE_INIT, PAGE_REFRESH], [pipe.debug]);

  const pageDataPipe = usePipe(() => {
    dispatch({ type: PAGE_DATA_REQUEST });
    return getUser();
  }, [actionPipe]);

  usePipe((data) => {
    dispatch({ type: PAGE_DATA_REQUEST_RESOLVE, payload: data });
  }, [pageDataPipe]);

  usePipe((error) => {
    dispatch({ type: PAGE_DATA_REQUEST_REJECT, payload: { error }});
  }, [pageDataPipe.error]);
}

function useFriendsRequest() {
  const dispatch = useDispatch();

  const actionPipe = useAction(PAGE_DATA_REQUEST_RESOLVE, [pipe.debug]);

  const friendsPipe = usePipe((action) => {
    dispatch({ type: FRIENDS_REQUEST });
    return getFriends({ userId: action.payload.user.id });
  }, [actionPipe]);

  usePipe((data) => {
    dispatch({ type: FRIENDS_REQUEST_RESOLVE, payload: data });
  }, [friendsPipe]);

  usePipe((error) => {
    dispatch({ type: FRIENDS_REQUEST_REJECT, payload: { error }});
  }, [friendsPipe.error]);
}
