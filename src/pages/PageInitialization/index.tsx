import React, { useEffect } from 'react';

import { getUser } from '../../api';
import { useAction, useTask } from '../../lib';
import { useDispatch, useSelector } from '../../store';
import { PAGE_INIT, PAGE_RESET, PAGE_DATA_REQUEST, PAGE_DATA_REQUEST_RESOLVE,
  PAGE_DATA_REQUEST_REJECT, pageInitializationSelectors } from './store';

export function PageInitialization() {
  const pageDataRequestState = useSelector(pageInitializationSelectors.selectPageDataRequestState);
  const user = useSelector(pageInitializationSelectors.selectUser);

  usePageInit();
  usePageInitChannel();

  return (
    <div>
      {pageDataRequestState.isPending ? 'Loading ...' : user?.name}
    </div>
  );
}

function usePageInit() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: PAGE_INIT });
    return () => {
      dispatch({ type: PAGE_RESET });
    };
  }, [dispatch]);
}

function usePageInitChannel() {
  const dispatch = useDispatch();

  const action = useAction(PAGE_INIT);

  const response = useTask(() => {
    dispatch({ type: PAGE_DATA_REQUEST });
    return getUser();
  }, [action]);

  useTask((data) => {
    dispatch({ type: PAGE_DATA_REQUEST_RESOLVE, payload: data });
  }, [response]);

  useTask((error) => {
    dispatch({ type: PAGE_DATA_REQUEST_REJECT, payload: { error }});
  }, [response.error]);
}
