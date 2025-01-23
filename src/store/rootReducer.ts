import { combineReducers } from 'redux';

// saga-hooks reducer
import { pipesReducer, PIPE_STORE_KEY } from '../lib';

// Pages
import { pageInitializationReducer } from '../pages/PageInitialization/store';

export const rootReducer = combineReducers({
  [PIPE_STORE_KEY]: pipesReducer,
  PageInitialization: pageInitializationReducer,
});
