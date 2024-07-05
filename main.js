let state = {
    currentScreen: "normalScreen",
    playerTurn: true,
    turnCounter: 0,
    playerArmy: [playerWarrior1, playerWarrior2],
    opponentArmy: [opponentWarrior1, opponentWarrior2],
    movableSquares: [],
    attackRangeSquares1: [],
    attackRangeSquares2: [],
    selectedUnitIndex: null,
    grid: [
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0
    ],
    showAttackPopup: false,
    attackPopupPosition: null,
    attackOptions: {
        attack1: false,
        attack2: false
    },
    targetEnemyIndex: null
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
        
        if (stateObj.attackRangeSquares1.includes(index) || stateObj.attackRangeSquares2.includes(index)) {
            cellDiv.classList.add('glow-red');
            cellDiv.addEventListener('click', () => {
                stateObj = handleMoveToSquare(stateObj, index);
                if (stateObj.showAttackPopup) {
                    console.log("rendering attack popup")
                    renderAttackPopup(stateObj, cellDiv);
                }
            });
        } else if (stateObj.movableSquares.includes(index)) {
            cellDiv.classList.add('glow-blue');
            cellDiv.addEventListener('click', () => {
                stateObj = handleMoveToSquare(stateObj, index);
            });
        } else {
            cellDiv.addEventListener('click', () => {
                stateObj = handleMoveToSquare(stateObj, index);
            });
        }
        
        gridContainer.appendChild(cellDiv);
    });

    appDiv.appendChild(gridContainer);
}

function renderAttackPopup(stateObj, cellDiv) {
    // Remove any existing popup
    const existingPopup = document.querySelector('.attack-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.className = 'attack-popup';

    // Position the popup above the cell
    const cellRect = cellDiv.getBoundingClientRect();
    popup.style.position = 'absolute';
    popup.style.left = `${cellRect.left}px`;
    popup.style.top = `${cellRect.top - 60}px`; // Adjust this value as needed

    if (stateObj.attackOptions.attack1) {
        const attack1Button = document.createElement('button');
        attack1Button.textContent = 'Attack 1';
        attack1Button.onclick = () => {
            stateObj = handleAttackButtonClick(stateObj, 'attack1');
        };
        popup.appendChild(attack1Button);
    }

    if (stateObj.attackOptions.attack2) {
        const attack2Button = document.createElement('button');
        attack2Button.textContent = 'Attack 2';
        attack2Button.onclick = () => {
            stateObj = handleAttackButtonClick(stateObj, 'attack2');
        };
        popup.appendChild(attack2Button);
    }

    document.body.appendChild(popup);
}

function calculatePopupPosition(index, popupWidth, popupHeight) {
    const gridContainer = document.querySelector('.grid-container');
    const gridRect = gridContainer.getBoundingClientRect();
    const cellWidth = gridRect.width / 5; // 5 columns
    const cellHeight = gridRect.height / 5; // 5 rows

    const row = Math.floor(index / 5);
    const col = index % 5;

    const cellX = gridRect.left + (col * cellWidth);
    const cellY = gridRect.top + (row * cellHeight);

    // Center the popup horizontally over the cell
    let popupX = cellX + (cellWidth / 2) - (popupWidth / 2);
    // Position the popup above the cell
    let popupY = cellY - popupHeight - 10; // 10px extra space

    // Ensure the popup doesn't go off-screen
    popupX = Math.max(10, Math.min(popupX, window.innerWidth - popupWidth - 10));
    popupY = Math.max(10, popupY);

    return { x: popupX, y: popupY };
}
function renderAttackPopup(stateObj, cellDiv) {
    // Remove any existing popup
    const existingPopup = document.querySelector('.attack-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.className = 'attack-popup';

    // Add buttons to the popup
    if (stateObj.attackOptions.attack1) {
        const attack1Button = document.createElement('button');
        attack1Button.textContent = 'Attack 1';
        attack1Button.onclick = () => {
            stateObj = handleAttackButtonClick(stateObj, 'attack1');
        };
        popup.appendChild(attack1Button);
    }

    if (stateObj.attackOptions.attack2) {
        const attack2Button = document.createElement('button');
        attack2Button.textContent = 'Attack 2';
        attack2Button.onclick = () => {
            stateObj = handleAttackButtonClick(stateObj, 'attack2');
        };
        popup.appendChild(attack2Button);
    }

    // Append the popup to the body so we can measure its size
    document.body.appendChild(popup);

    // Calculate the position after the popup is in the DOM
    const popupRect = popup.getBoundingClientRect();
    const position = calculatePopupPosition(stateObj.attackPopupPosition, popupRect.width, popupRect.height);

    // Set the calculated position
    popup.style.position = 'absolute';
    popup.style.left = `${position.x}px`;
    popup.style.top = `${position.y}px`;
}

function handleCellClick(stateObj, index) {
    const clickedUnit = stateObj.playerArmy.find(unit => unit.currentSquare === index);
    if (clickedUnit && (!clickedUnit.unitMovedThisTurn ||  !clickedUnit.unitAttackedThisTurn) ) {
        stateObj = clickedUnit.whenClicked(stateObj);
        if (!clickedUnit.unitMovedThisTurn || (!clickedUnit.unitAttackedThisTurn && (stateObj.attackRangeSquares1.length !== 0 || stateObj.attackRangeSquares2.length !== 0))) {
            stateObj = immer.produce(stateObj, draft => {
                draft.selectedUnitIndex = draft.playerArmy.indexOf(clickedUnit);
                draft.currentScreen = "chooseSquareToMove";
            })
        }
        renderScreen(stateObj);
    }
}

function handleAttackButtonClick(stateObj, attackType) {
    stateObj = immer.produce(stateObj, draft => {
        const selectedUnit = draft.playerArmy[draft.selectedUnitIndex];
        const enemyUnit = draft.opponentArmy[draft.targetEnemyIndex];

        if (attackType === 'attack1') {
            stateObj = selectedUnit.attack1.execute(stateObj, enemyUnit.currentSquare);
        } else if (attackType === 'attack2') {
            stateObj = selectedUnit.attack2.execute(stateObj, enemyUnit.currentSquare);
        }

        // Clear attack-related state
        draft.showAttackPopup = false;
        draft.attackPopupPosition = null;
        draft.attackOptions = null;
        draft.targetEnemyIndex = null;
        draft.selectedUnitIndex = null;
        draft.currentScreen = "normalScreen"
    });

    stateObj = updateState(stateObj)
    return stateObj
}

function handleMoveToSquare(stateObj, index) {
    stateObj =  immer.produce(stateObj, draft => {
        const selectedUnit = draft.playerArmy[draft.selectedUnitIndex];
        const hasEnemyUnit = draft.opponentArmy.some(unit => unit.currentSquare === index);

        if (draft.selectedUnitIndex !== null && draft.movableSquares.includes(index)) {  
            if (selectedUnit.unitMovedThisTurn === false && !hasEnemyUnit) {
                draft.grid[selectedUnit.currentSquare] = 0;
                selectedUnit.currentSquare = index;
                draft.grid[index] = selectedUnit.color;
                selectedUnit.unitMovedThisTurn = true;
                draft.selectedUnitIndex = null;
                draft.currentScreen = "normalScreen";
            }
        }

        if (hasEnemyUnit && !selectedUnit.unitAttackedThisTurn) {
            const enemyUnit = draft.opponentArmy.find(unit => unit.currentSquare === index);
            const inRange1 = draft.attackRangeSquares1.includes(index);
            const inRange2 = draft.attackRangeSquares2.includes(index);

            if (inRange1 || inRange2) {
                console.log("setting attack popup to true") 
                draft.showAttackPopup = true;
                draft.attackPopupPosition = index;
                draft.attackOptions = {
                    attack1: inRange1,
                    attack2: inRange2
                };
                draft.targetEnemyIndex = draft.opponentArmy.indexOf(enemyUnit);
            }
        } else {
            // Clear attack-related state if not attacking
            draft.showAttackPopup = false;
            draft.attackPopupPosition = null;
            draft.attackOptions = null;
            draft.targetEnemyIndex = null;
        }

        // Clear glowing squares and reset selection
        draft.movableSquares = [];
        draft.attackRangeSquares1 = [];
        draft.attackRangeSquares2 = [];
        
    });
    stateObj = updateGrid(stateObj)
    stateObj = updateState(stateObj);
    return stateObj
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
    return state;
  }