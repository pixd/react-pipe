import React, { useCallback, useEffect } from 'react';

import { getFriends, getUser } from '../../api';
import { useAction, initDebugPanel, usePipe } from '../../lib';
import { useDispatch, useSelector } from '../../store';
import { ABORT_REQUEST, FRIENDS_REQUEST, FRIENDS_REQUEST_REJECT, FRIENDS_REQUEST_RESOLVE, PAGE_INIT,
  PAGE_REFRESH, PAGE_RESET, PAGE_DATA_REQUEST, PAGE_DATA_REQUEST_REJECT, PAGE_DATA_REQUEST_RESOLVE,
  pageInitializationSelectors } from './store';

const { debugPanel } = initDebugPanel();

export function PageInitialization() {
  usePageInit();
  usePageDataRequest();

  const dispatch = useDispatch();

  const pageDataRequestState = useSelector(pageInitializationSelectors.selectPageDataRequestState);
  const friendsRequestState = useSelector(pageInitializationSelectors.selectFriendsRequestState);
  const user = useSelector(pageInitializationSelectors.selectUser);
  const friends = useSelector(pageInitializationSelectors.selectFriends);

  const handleRefresh = useCallback(() => {
    dispatch({ type: PAGE_REFRESH });
  }, [dispatch]);

  const handleAbort = useCallback(() => {
    dispatch({ type: ABORT_REQUEST });
  }, [dispatch]);

  return (
    <>
      <div>
        <button className="button"
          onClick={handleRefresh}
        >
          Refresh
        </button>
        {' '}
        <button className="button"
          onClick={handleAbort}
        >
          Abort
        </button>
      </div>
      <div>
        {'User: ' + (pageDataRequestState.isPending
          ? 'loading...'
          : pageDataRequestState.isRejected
            ? 'request error'
            : pageDataRequestState.isAborted
              ? 'request aborted'
              : `${user!.name} [id: ${user!.id}]`)}
      </div>
      {user
        ? (
          <div>
            {'Friends: ' + (friendsRequestState.isPending
              ? 'loading...'
              : friendsRequestState.isRejected
                ? 'request error'
                : friendsRequestState.isAborted
                  ? 'request aborted'
                  : friends!.map((friend) => `${friend.name} [id: ${friend.id}]`).join(', '))}
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

  const actionPipe = useAction([PAGE_INIT, PAGE_REFRESH], [debugPanel]);

  const abortPipe = useAction(ABORT_REQUEST, [debugPanel, actionPipe]);

  usePipe(actionPipe.cancel, [abortPipe]);

  const pageDataRequestPipe = usePipe(() => {
    dispatch({ type: PAGE_DATA_REQUEST });
    return getUser();
  }, [actionPipe]);

  const pageDataPipe = usePipe((data) => {
    dispatch({ type: PAGE_DATA_REQUEST_RESOLVE, payload: data });
    return data;
  }, [pageDataRequestPipe]);

  usePipe((error) => {
    dispatch({ type: PAGE_DATA_REQUEST_REJECT, payload: { error }});
  }, [pageDataRequestPipe.error]);

  const friendsPipe = usePipe((data) => {
    dispatch({ type: FRIENDS_REQUEST });
    return getFriends({ userId: data.user.id });
  }, [pageDataPipe]);

  usePipe((data) => {
    dispatch({ type: FRIENDS_REQUEST_RESOLVE, payload: data });
  }, [friendsPipe]);

  usePipe((error) => {
    dispatch({ type: FRIENDS_REQUEST_REJECT, payload: { error }});
  }, [friendsPipe.error]);
}
