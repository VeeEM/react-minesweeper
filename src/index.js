import React from 'react';
import ReactDOM from 'react-dom';
import Minesweeper from './Minesweeper';

ReactDOM.render(
  <React.StrictMode>
    <Minesweeper width={30} height={16} bombCount={99} />
  </React.StrictMode>,
  document.getElementById('root')
);
