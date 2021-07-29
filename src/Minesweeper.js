import React, { useState, useEffect } from 'react';
import './Minesweeper.css';

const GAME_ONGOING = 0;
const GAME_WIN = 1;
const GAME_LOSS = 2;

function Minesweeper(props) {
  const height = props.height;
  const width = props.width;
  const bombCount = props.bombCount;
  const rows = [];
  
  const [flags, setFlags] = useState([]);
  const [mines, setMines] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [currentTime, setCurrentTime] = useState(Date.now());

  function resetState() {
    setFlags([]);
    setMines([]);
    setRevealed([]);
    setStartTime(Date.now());
    setCurrentTime(Date.now());
  }
  
  function handleCellClick(x, y) {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (checkGameOver() !== GAME_ONGOING) {
	return;
      }
      console.log(e);
      const current = new Coordinate(x, y);
      if (e.button === 0) {
	// Generate mines and then reveal if first click
	// Flag if unrevealed and right click
	// Unflag if unrevealed, right click and flagged
	// Reveal if unrevealed and left click
	if (mines.length === 0) {
	  const newMines = createMines(width, height, bombCount, current);
	  const newRevealed = inclusiveReveal(width, height, current, flags, newMines, revealed);
	  setMines(newMines);
	  setRevealed(newRevealed);
	  return;
	}
	
	if (containsCoordinate(current, revealed)) {
	  return;
	}
	const newRevealed = inclusiveReveal(width, height, current, flags, mines, revealed);
	setRevealed(newRevealed);
      } else if (e.button === 1) {
	console.log("Middle click");
	const newRevealed = chord(width, height, current, flags, mines, revealed);
	console.log("newrev", newRevealed);
	setRevealed(newRevealed);
      } else if (e.button === 2) {
	console.log("Right click");
	const newFlags = flag(current, flags, revealed);
	setFlags(newFlags);
      }
    }
  }
  

  function renderButton(x, y, gameState) {
    const current = new Coordinate(x, y);
    const isMine = containsCoordinate(current, mines);
    const isRevealed = containsCoordinate(current, revealed);
    const isFlagged = containsCoordinate(current, flags);

    if (isRevealed && !isMine) {
      const cellNumber = adjacentIn(width, height, current, mines).length;
      const numberClass = numberToClass(cellNumber);
      return <button className={numberClass + ' revealed'} onMouseUp={handleCellClick(x, y)}>{cellNumber > 0 ? cellNumber : ''}</button>;
    } else if (isRevealed && isMine) {
      return <button className="revealed-mine" onMouseUp={handleCellClick(x, y)}><span>💣</span></button>;
    } else if (!isRevealed && isMine && gameState === GAME_LOSS) {
      return <button onMouseUp={handleCellClick(x, y)}><span>💣</span></button>;
    } else if (!isRevealed && !isFlagged) {
      return <button onMouseUp={handleCellClick(x, y)}>{" "}</button>;
    } else if (!isRevealed && isFlagged) {
      return <button onMouseUp={handleCellClick(x, y)}><span>🚩</span></button>;
    }
  }

  function checkGameOver() {
    for (const mine of mines) {
      if (containsCoordinate(mine, revealed)) {
	return GAME_LOSS;
      }
    }
    if (revealed.length === (width * height - bombCount)) {
      return GAME_WIN;
    }
    return GAME_ONGOING;
  }
  
  const gameState = checkGameOver();

  for (let y = 0; y < height; y++) {
    const cells = [];
    for (let x = 0; x < width; x++) {
      //cells.push(<button onClick={newCoordAlerter(x, y)}>{x}</button>);
      cells.push(renderButton(x, y, gameState));
    }
    rows.push(<div className="row">{cells}</div>);
  }

  return (
    <div className="minesweeper" onContextMenu={(e) => {e.preventDefault();e.stopPropagation();}}>
      <div className="minesweeper-header">
        <span className="bomb-counter">{bombCount - flags.length}</span>
        <button onClick={resetState}>Game status: {gameState}</button>
        <Timer callback={() => setCurrentTime(Date.now())}
               running={gameState === GAME_ONGOING} 
               secondsElapsed={Math.floor((currentTime - startTime) / 1000)} />
      </div>
      {rows}
    </div>
  );
}

function Timer(props) {
  useEffect(() => {
    if (props.running) {
      const id = setInterval(props.callback, 1000);
      return (() => clearInterval(id));
    }
  }, [props.running]);

  return (
    <span className="timer">{props.secondsElapsed}</span>
  );
}

function adjacentIn(width, height, coord, coords) {
  const adjacentCoords = adjacentCells(width, height, coord);
  return coords.filter(c => containsCoordinate(c, adjacentCoords));
}

function adjacentCells(width, height, coord) {
  const x = coord.x;
  const y = coord.y;
  const candidates = [
    new Coordinate(x + 1, y + 1),
    new Coordinate(x + 1, y),
    new Coordinate(x + 1, y - 1),
    new Coordinate(x, y + 1),
    new Coordinate(x, y - 1),
    new Coordinate(x - 1, y + 1),
    new Coordinate(x - 1, y),
    new Coordinate(x - 1, y - 1)
  ];
  return candidates.filter(c => c.x >= 0 && c.x < width && c.y >= 0 && c.y < height);
}

function createMines(width, height, mineCount, firstClick) {
  const mines = [];
  let potentialMines = [];
  const notMines = adjacentCells(width, height, firstClick);
  notMines.push(firstClick);
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      potentialMines.push(new Coordinate(x, y));
    }
  }
  // First revealed cell and the cells adjacent to it should be free of mines
  potentialMines = potentialMines.filter(coord => !containsCoordinate(coord, notMines));
  
  for (let i = 0; i < mineCount; i++) {
    // Array.splice does not actually require the first argument to be an integer O,o
    let randomIndex = Math.floor(Math.random() * potentialMines.length);
    let randomElement = potentialMines.splice(randomIndex, 1)[0]
    mines.push(randomElement);
  }
  return mines;
}

function coordEq(c1, c2) {
  if (c1.x === c2.x && c1.y === c2.y) {
    return true;
  } else {
    return false;
  }
}

function containsCoordinate(target, arr) {
  for (const coord of arr) {
    if (coordEq(coord, target)) {
      return true;
    }
  }
  return false;
}

function Coordinate(x, y) {
  this.x = x;
  this.y = y;
}

function numberToClass(num) {
  if (num === 0) {
    return 'zero';
  } else if (num === 1) {
    return 'one';
  } else if (num === 2) {
    return 'two';
  } else if (num === 3) {
    return 'three';
  } else if (num === 4) {
    return 'four';
  } else if (num === 5) {
    return 'five';
  } else if (num === 6) {
    return 'six';
  } else if (num === 7) {
    return 'seven';
  } else if (num === 8) {
    return 'eight';
  }
}

function flag(coord, flags, revealed) {
  if (containsCoordinate(coord, revealed)) {
    return flags.slice();
  }

  if (containsCoordinate(coord, flags)) {
    return flags.filter(flag => !(coordEq(flag, coord)));
  } else {  
    return flags.concat([coord]);
  }
}

function inclusiveReveal(width, height, coord, flags, mines, revealed) {
  return revealed.concat(exclusiveReveal(width, height, coord, flags, mines, revealed));
}

function exclusiveReveal(width, height, coord, flags, mines, revealed) {
  const newlyRevealed = [];
  // Reveal only unflagged and unrevealed tiles
  if (!containsCoordinate(coord, revealed) && !containsCoordinate(coord, flags)) {
    newlyRevealed.push(coord);
    if (adjacentIn(width, height, coord, mines).length === 0 && !containsCoordinate(coord, mines)) {
      for (const cell of adjacentCells(width, height, coord)) {
	const revealedSoFar = revealed.concat(newlyRevealed);
	const deepReveal = exclusiveReveal(width, height, cell, flags, mines, revealedSoFar);
	Array.prototype.push.apply(newlyRevealed, deepReveal);
      }
    }
  }
  return newlyRevealed;
}

function chord(width, height, coord, flags, mines, revealed) {
  const adjacentFlags = adjacentIn(width, height, coord, flags);
  const adjacentMines = adjacentIn(width, height, coord, mines);
  if (containsCoordinate(coord, revealed) &&
      adjacentFlags.length >= adjacentMines.length) {
    const adjacents = adjacentCells(width, height, coord);
    return adjacents.reduce(
      (acc, cur) => acc.concat(exclusiveReveal(width, height, cur, flags, mines, acc)),
      revealed
    );
  }
  return revealed.slice();
}

export default Minesweeper;

