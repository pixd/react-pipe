import React from 'react';
import { useState } from 'react';
import './App.css';

import { PageInitialization } from './pages/PageInitialization';

const routes: Record<string, React.FunctionComponent>  = {
  Blank,
  PageInitialization,
};

function Blank() {
  return (
    <div>
      Blank page
    </div>
  );
}

function App() {
  const [route, setRoute] = useState('PageInitialization');

  const Component = routes[route];

  return (
    <div className="App">
      <div className="Menu">
        <button className="button"
          onClick={() => setRoute('Blank')}
        >
          • Blank
        </button>
        {' '}
        <button className="button"
          onClick={() => setRoute('PageInitialization')}
        >
          • PageInitialization
        </button>
      </div>
      <Component />
    </div>
  );
}

export default App;
