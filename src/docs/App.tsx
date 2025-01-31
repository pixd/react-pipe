import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { Provider } from 'react-redux';

import { createStore } from './store';

import './App.css';

import { PageInitialization } from './pages/PageInitialization';

const pageComponents: Record<string, FunctionComponent>  = {
  Blank,
  PageInitialization,
};

const store = createStore();

export function App() {
  const [page, setPage] = useState('PageInitialization');

  const PageComponent = pageComponents[page];

  return (
    <Provider store={store}>
      <div className="App">
        <div className="Menu">
          <button className="button"
            onClick={() => setPage('Blank')}
          >
            • Blank
          </button>
          {' '}
          <button className="button"
            onClick={() => setPage('PageInitialization')}
          >
            • PageInitialization
          </button>
        </div>
        <PageComponent />
      </div>
    </Provider>
  );
}

function Blank() {
  return (
    <div>
      Blank page
    </div>
  );
}
