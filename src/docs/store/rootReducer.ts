import { combineReducers } from 'redux';

import { reduxPipeKit } from './reduxPipeKit';

// Pages
import { pageInitializationReducer } from '../pages/PageInitialization/store';

export const rootReducer = combineReducers({
  [reduxPipeKit.storeKey]: reduxPipeKit.reducer,
  PageInitialization: pageInitializationReducer,
});
