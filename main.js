let state = {
    currentScreen: "normalScreen",
    playerTurn: true,
    turnCounter: 0,
    playerArmy: [playerWarrior1, playerWarrior2, playerWarrior3],
    opponentArmy: [opponentWarrior1, opponentWarrior2],
    movableSquares: [],
    attackRangeSquares1: [],
    attackRangeSquares2: [],
    selectedUnitIndex: null,
    gridSize: 7,
    grid: [
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
    ],
    showAttackPopup: false,
    attackPopupPosition: null,
    attackOptions: {
        attack1: false,
        attack2: false
    },
    targetEnemyIndex: null,
    currentUnitID: 4,
};


function handleEndTurn(stateObj) {
    stateObj = immer.produce(stateObj, draft => {
        draft.playerArmy.forEach(unit => {
            unit.unitMovedThisTurn = false;
            unit.unitAttackedThisTurn = false;
        });

        draft.opponentArmy.forEach(unit => {
            unit.unitMovedThisTurn = false;
            unit.unitAttackedThisTurn = false;
        });

        draft.turnCounter++;

        draft.selectedUnitIndex = null;
        draft.currentScreen = "normalScreen";
    });

    stateObj = EnemiesMove(stateObj)
    return stateObj
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
    const existingPopup = document.querySelector('.attack-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';

    stateObj.grid.forEach((cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'grid-cell';

        if (cell === 0) {
            cellDiv.style.backgroundColor = 'white';
        } else {
            const avatar = createImageAvatar(cell)
            healthDiv = createHealthText(cell)
            cellDiv.appendChild(avatar)
            cellDiv.appendChild(healthDiv)
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
            const avatar = createImageAvatar(cell)
            const healthDiv = createHealthText(cell)
            cellDiv.appendChild(avatar)
            cellDiv.appendChild(healthDiv)
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
    const distance = findTargetDistance(stateObj)

    // Add buttons to the popup
    if (stateObj.attackOptions.attack1) {
        const attack1Button = createAttackButton(stateObj, stateObj.playerArmy[stateObj.selectedUnitIndex].attack1)
        attack1Button.onclick = () => {
            stateObj = handleAttackButtonClick(stateObj, 'attack1', distance);
        };
        popup.appendChild(attack1Button);
    }

    if (stateObj.attackOptions.attack2) {
        const attack2Button = createAttackButton(stateObj, stateObj.playerArmy[stateObj.selectedUnitIndex].attack2)
        attack2Button.onclick = () => {
            stateObj = handleAttackButtonClick(stateObj, 'attack2', distance);
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

function handleAttackButtonClick(stateObj, attackType, distance) {
    stateObj = immer.produce(stateObj, draft => {
        const selectedUnit = stateObj.playerArmy[stateObj.selectedUnitIndex];
        const enemyUnit = stateObj.opponentArmy[stateObj.targetEnemyIndex];
        const distance = chebyshevDistance(selectedUnit.currentSquare, enemyUnit.currentSquare)

        if (attackType === 'attack1') {
            stateObj = selectedUnit.attack1.execute(stateObj, enemyUnit.currentSquare, distance);
        } else if (attackType === 'attack2') {
            stateObj = selectedUnit.attack2.execute(stateObj, enemyUnit.currentSquare, distance);
        }

        // Clear attack-related state
        draft.showAttackPopup = false;
        draft.attackPopupPosition = null;
        draft.attackOptions = null;
        draft.targetEnemyIndex = null;
        draft.selectedUnitIndex = null;
        draft.currentScreen = "normalScreen"
    });

    const existingPopup = document.querySelector('.attack-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

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
        } else if (hasEnemyUnit && !selectedUnit.unitAttackedThisTurn) {
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
            draft.currentScreen = "normalScreen";
        }

        // Clear glowing squares and reset selection
        draft.movableSquares = [];
        draft.attackRangeSquares1 = [];
        draft.attackRangeSquares2 = [];
        
    });
    
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

function checkForDeath(stateObj) {
    return immer.produce(stateObj, draft => {
        // Check player army
        for (let i = draft.playerArmy.length - 1; i >= 0; i--) {
            if (draft.playerArmy[i].health <= 0) {
                const deadUnitSquare = draft.playerArmy[i].currentSquare;
                draft.grid[deadUnitSquare] = 0;
                draft.playerArmy.splice(i, 1);
            }
        }

        // Check opponent army
        for (let i = draft.opponentArmy.length - 1; i >= 0; i--) {
            if (draft.opponentArmy[i].health <= 0) {
                const deadUnitSquare = draft.opponentArmy[i].currentSquare;
                draft.grid[deadUnitSquare] = 0;
                draft.opponentArmy.splice(i, 1);
            }
        }
    });
}

  // Usage

function updateState(stateObj) {
    stateObj = checkForDeath(stateObj)
    stateObj = updateGrid(stateObj)
    state = {...stateObj}
    renderScreen(stateObj)
    return state;
}

updateState(state)

















function EnemiesMove(stateObj) {
    for (let i = 0; i < stateObj.opponentArmy.length; i++) {
        stateObj = immer.produce(stateObj, draft => {
            const currentEnemy = draft.opponentArmy.find(e => e.id === stateObj.opponentArmy[i].id);
            
            // Move the enemy
            if (currentEnemy.moveTowardsClosestEnemy) {
                moveTowardsClosestPlayer(draft, currentEnemy);
            } else {
                moveAwayFromAllPlayers(draft, currentEnemy);
            }

            // Attack if possible
            const bestAttack = getBestAttack(currentEnemy);
            const targetUnit = findTargetForAttack(draft, currentEnemy, bestAttack);
            if (targetUnit) {
                executeAttack(draft, currentEnemy, targetUnit, bestAttack);
            }

            // Update the grid after each enemy's move and attack
            updateGrid(draft);
        });

        // Update the state after each enemy's turn
        stateObj = updateState(stateObj);
    }

    return stateObj;
}



function moveTowardsClosestPlayer(draft, enemy) {
    let closestPlayer = null;
    let minDistance = Infinity;

    draft.playerArmy.forEach(player => {
        const distance = chebyshevDistance(enemy.currentSquare, player.currentSquare);
        if (distance < minDistance) {
            minDistance = distance;
            closestPlayer = player;
        }
    });

    if (closestPlayer) {
        const possibleMoves = getPossibleMoves(draft, enemy);
        let bestMove = enemy.currentSquare;
        let bestMoveDistance = minDistance;

        possibleMoves.forEach(move => {
            const distance = chebyshevDistance(move, closestPlayer.currentSquare);
            if (distance < bestMoveDistance) {
                bestMoveDistance = distance;
                bestMove = move;
            }
        });
        enemy.currentSquare = bestMove;
    }
}

function moveAwayFromAllPlayers(draft, enemy) {
    const possibleMoves = getPossibleMoves(draft, enemy);
    let bestMove = enemy.currentSquare;
    let maxMinDistance = 0;

    possibleMoves.forEach(move => {
        let minDistance = Infinity;
        draft.playerArmy.forEach(player => {
            const distance = chebyshevDistance(move, player.currentSquare);
            if (distance < minDistance) {
                minDistance = distance;
            }
        });
        if (minDistance > maxMinDistance) {
            maxMinDistance = minDistance;
            bestMove = move;
        }
    });

    enemy.currentSquare = bestMove;
}

function getPossibleMoves(draft, unit) {
    const possibleMoves = [];
    const currentX = unit.currentSquare % draft.gridSize;
    const currentY = Math.floor(unit.currentSquare / draft.gridSize);

    for (let dx = -unit.movementSquares; dx <= unit.movementSquares; dx++) {
        for (let dy = -unit.movementSquares; dy <= unit.movementSquares; dy++) {
            const newX = currentX + dx;
            const newY = currentY + dy;
            const newSquare = newY * draft.gridSize + newX;

            if (newX >= 0 && newX < draft.gridSize && newY >= 0 && newY < draft.gridSize && 
                draft.grid[newSquare] === 0) {
                possibleMoves.push(newSquare);
            }
        }
    }

    return possibleMoves;
}

function getBestAttack(enemy) {
    return enemy.attack1.attack > enemy.attack2.attack ? enemy.attack1 : enemy.attack2;
}

function findTargetForAttack(draft, enemy, bestAttack) {
    let closestTarget = null;
    let minDistance = Infinity;

    draft.playerArmy.forEach(player => {
        const distance = chebyshevDistance(enemy.currentSquare, player.currentSquare);
        if (distance <= bestAttack.range && distance < minDistance) {
            minDistance = distance;
            closestTarget = player;
        }
    });

    if (!closestTarget) {
        const otherAttack = bestAttack === enemy.attack1 ? enemy.attack2 : enemy.attack1;
        draft.playerArmy.forEach(player => {
            const distance = chebyshevDistance(enemy.currentSquare, player.currentSquare);
            if (distance <= otherAttack.range && distance < minDistance) {
                minDistance = distance;
                closestTarget = player;
            }
        });
    }

    return closestTarget;
}


