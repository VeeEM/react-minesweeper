import React from 'react';
import ReactDOM from 'react-dom';
import Minesweeper from './Minesweeper';

ReactDOM.render(
  <React.StrictMode>
    <Minesweeper width={30} height={16} bombCount={99} />
    <Minesweeper width={8} height={8} bombCount={8} />
  </React.StrictMode>,
  document.getElementById('root')
);
