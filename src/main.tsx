import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import './main.css';

import App from './App';
import { createStore } from './store';

const store = createStore();

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
