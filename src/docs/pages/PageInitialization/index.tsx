import { useCallback } from 'react';
import { useEffect } from 'react';
import { fork } from 'react-pipes';
import { latest } from 'react-pipes';
import { useMountPipe } from 'react-pipes';
import { usePipe } from 'react-pipes';
import { initDebugPanel } from 'react-pipes/debug';

import { getFriends } from '../../api';
import { getUser } from '../../api';
import { useActionPipe } from '../../store';
import { useDispatch } from '../../store';
import { useSelector } from '../../store';
import { ABORT_REQUEST } from './store';
import { FRIENDS_REQUEST } from './store';
import { FRIENDS_REQUEST_REJECT } from './store';
import { FRIENDS_REQUEST_RESOLVE } from './store';
import { PAGE_INIT } from './store';
import { PAGE_REFRESH } from './store';
import { PAGE_RESET } from './store';
import { PAGE_DATA_REQUEST } from './store';
import { PAGE_DATA_REQUEST_REJECT } from './store';
import { PAGE_DATA_REQUEST_RESOLVE } from './store';
import { pageInitializationSelectors } from './store';

const { debugPanel } = initDebugPanel();

export function PageInitialization() {
  usePageDataRequest();

  usePageInit();

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

  const userText = user
    ? `${user!.name} [id: ${user!.id}]`
    : 'null';

  const friendsText = friends
    ? friends!.map((friend) => `${friend.name} [id: ${friend.id}]`).join(', ')
    : 'null';

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
        User request state: {pageDataRequestState.status}
      </div>
      <div>
        User: {userText}
      </div>
      <div>
        Friends request state: {friendsRequestState.status}
      </div>
      <div>
        Friends: {friendsText}
      </div>
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

  const mount = useMountPipe([debugPanel]);

  const initAction = useActionPipe([
    PAGE_INIT,
    PAGE_REFRESH,
    PAGE_REFRESH,
  ], [mount]);

  // const abortRequestPipe = useActionPipe(ABORT_REQUEST, [initAction]);

  const pageData = usePipe(function pageDataPipe() {
    dispatch({ type: PAGE_DATA_REQUEST });
    return getUser();
  }, [initAction, latest]);

  usePipe(function pageRejectedPipe(error) {
    dispatch({ type: PAGE_DATA_REQUEST_REJECT, payload: { error }});
    return error;
  }, [pageData.error]);

  const pageDataResolved = usePipe(function pageDataResolvedPipe(data) {
    dispatch({ type: PAGE_DATA_REQUEST_RESOLVE, payload: data });
    return data;
  }, [pageData]);

  const friends = usePipe(function friendsPipe(data) {
    dispatch({ type: FRIENDS_REQUEST });
    return getFriends({ userId: data.user.id });
  }, [pageDataResolved, fork]);

  usePipe(function friendsRejectedPipe(error) {
    dispatch({ type: FRIENDS_REQUEST_REJECT, payload: { error }});
    return error;
  }, [friends.error]);

  const friendsResolved = usePipe(function friendsResolvedPipe(data) {
    dispatch({ type: FRIENDS_REQUEST_RESOLVE, payload: data });
    return data;
  }, [friends]);

  usePipe(function completedPipe() {
    return 'Done!';
  }, [pageDataResolved, friendsResolved, fork]);
}
