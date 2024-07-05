let state = {
    currentScreen: "normalScreen",
    playerTurn: true,
    turnCounter: 0,
    playerArmy: [playerWarrior1, playerWarrior2],
    opponentArmy: [opponentWarrior1, opponentWarrior2],
    movableSquares: [],
    attackRangeSquares: [],
    selectedUnitIndex: null,
    grid: [
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0
    ]
  };


function createEndTurnButton(stateObj) {
    const endTurnButton = document.createElement('button');
    endTurnButton.textContent = 'End Turn';
    endTurnButton.addEventListener('click', () => {
        stateObj = handleEndTurn(stateObj);
        updateState(stateObj);
    });

    return endTurnButton
}

function handleEndTurn(stateObj) {
    return immer.produce(stateObj, draft => {
        draft.playerArmy.forEach(unit => {
            unit.unitMovedThisTurn = false;
            unit.unitAttackedThisTurn = false;
        });

        draft.turnCounter++;

        draft.selectedUnitIndex = null;
        draft.currentScreen = "normalScreen";
    });
}


function updateGrid(stateObj) {
    newState = immer.produce(stateObj, draft => {
        draft.grid = draft.grid.map(() => 0)

        draft.playerArmy.forEach(unit => {
            if (unit.currentSquare >= 0 && unit.currentSquare < draft.grid.length) {
              draft.grid[unit.currentSquare] = unit;
            }
        });

        draft.opponentArmy.forEach(unit => {
            if (unit.currentSquare >= 0 && unit.currentSquare < draft.grid.length) {
              draft.grid[unit.currentSquare] = unit;
            }
        });
    })
    return newState;
  }
  
function renderGrid(stateObj) {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = ''; // Clear existing content

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';

    stateObj.grid.forEach((cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'grid-cell';

        if (cell === 0) {
            cellDiv.style.backgroundColor = 'white';
        } else {
            cellDiv.style.backgroundColor = cell.color;
            cellDiv.textContent = stateObj.grid[index].health
            cellDiv.addEventListener('click', () => handleCellClick(stateObj, index));
        };
        gridContainer.appendChild(cellDiv);
    });
    appDiv.appendChild(gridContainer);
    const endTurnButton = createEndTurnButton(stateObj)
    appDiv.appendChild(endTurnButton)
}

function renderGlowingSquares(stateObj) {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = ''; // Clear existing content

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';

    stateObj.grid.forEach((cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'grid-cell';
        
        if (cell === 0) {
            cellDiv.style.backgroundColor = 'white';
        } else {
            cellDiv.style.backgroundColor = cell.color;
            cellDiv.textContent = stateObj.grid[index].health;
        }
        
        if (stateObj.attackRangeSquares.includes(index)) {
            cellDiv.classList.add('glow-red');
            cellDiv.addEventListener('click', () => handleMoveToSquare(stateObj, index));
        } else if (stateObj.movableSquares.includes(index)) {
            cellDiv.classList.add('glow-blue');
            cellDiv.addEventListener('click', () => handleMoveToSquare(stateObj, index));
        } else {
            cellDiv.addEventListener('click', () => handleMoveToSquare(stateObj, index));
        }
        
        gridContainer.appendChild(cellDiv);
    });

    appDiv.appendChild(gridContainer);
}

function handleCellClick(stateObj, index) {
    const clickedUnit = stateObj.playerArmy.find(unit => unit.currentSquare === index);
    if (clickedUnit && (!clickedUnit.unitMovedThisTurn ||  !clickedUnit.unitAttackedThisTurn) ) {
        stateObj = clickedUnit.whenClicked(stateObj);
        if (!clickedUnit.unitMovedThisTurn || (!clickedUnit.unitAttackedThisTurn && stateObj.attackRangeSquares.length !== 0)) {
            stateObj = immer.produce(stateObj, draft => {
                draft.selectedUnitIndex = draft.playerArmy.indexOf(clickedUnit);
                draft.currentScreen = "chooseSquareToMove";
            })
        }
        renderScreen(stateObj);
    }
}

function handleMoveToSquare(stateObj, index) {
    // Here you would implement the logic to move the unit
    // For now, we'll just switch back to the normal screen
    

    stateObj = immer.produce(stateObj, draft => {
        const selectedUnit = draft.playerArmy[draft.selectedUnitIndex];
        const hasEnemyUnit = draft.opponentArmy.some(unit => unit.currentSquare === index);

        if (draft.selectedUnitIndex !== null && draft.movableSquares.includes(index)) {  
            if (selectedUnit.unitMovedThisTurn === false && !hasEnemyUnit) {
                draft.grid[selectedUnit.currentSquare] = 0;
                selectedUnit.currentSquare = index;
                draft.grid[index] = selectedUnit.color;
                selectedUnit.unitMovedThisTurn = true
            }
        }

        if (hasEnemyUnit && !selectedUnit.unitAttackedThisTurn) {
            const enemyUnit = draft.opponentArmy.find(unit => unit.currentSquare === index);
            const gridSize = 5; // Assuming a 5x5 grid
            
            const selectedRow = Math.floor(selectedUnit.currentSquare / gridSize);
            const selectedCol = selectedUnit.currentSquare % gridSize;
            
            const enemyRow = Math.floor(enemyUnit.currentSquare / gridSize);
            const enemyCol = enemyUnit.currentSquare % gridSize;
            
            // Calculate Manhattan distance
            const distance = Math.max(Math.abs(selectedRow - enemyRow), Math.abs(selectedCol - enemyCol));
            
            if (distance <= selectedUnit.attack1.range) {
                stateObj = selectedUnit.attack1.execute(stateObj, enemyUnit.currentSquare);
            }
        }
        // Clear glowing squares and reset selection
        draft.movableSquares = [];
        draft.attackRangeSquares = [];
        draft.selectedUnitIndex = null;
        draft.currentScreen = "normalScreen";
    })
    stateObj = updateGrid(stateObj)
    renderScreen(stateObj);
}

function renderScreen(stateObj) {
    const screenRenderers = {
      "normalScreen": renderGrid,
      "chooseSquareToMove": renderGlowingSquares
    };
  
    const renderer = screenRenderers[stateObj.currentScreen];
    if (renderer) {
      renderer(stateObj);
    } else {
      console.error(`Unknown screen: ${stateObj.currentScreen}`);
    }
}

  // Usage
  currentState = updateGrid(state);
  renderScreen(currentState)

  function updateState(stateObj) {
    state = {...stateObj}
    renderScreen(stateObj)
  }