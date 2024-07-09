let state = {
    currentScreen: "normalScreen",
    playerTurn: true,
    turnCounter: 0,
    playerArmy: [playerWarrior1, playerWarrior2, playerWarrior3, playerWarrior4],
    opponentArmy: [opponentWarrior1, opponentWarrior2, opponentWarrior3],
    movableSquares: [],
    attackRangeSquares: [],
    selectedUnitIndex: null,
    gridSize: 8,
    grid: new Array(64).fill(0),
    showAttackPopup: false,
    attackPopupPosition: null,
    attackOptions: [],
    targetEnemyIndex: null,
    currentUnitID: 4,
};

function handleEndTurn(stateObj) {
    stateObj = immer.produce(stateObj, draft => {
        resetUnitTurnStatus(draft.playerArmy);
        resetUnitTurnStatus(draft.opponentArmy);
        draft.turnCounter++;
        setBackToNormal(draft)
    });
    return EnemiesMove(stateObj);
}


function updateGrid(stateObj) {
    return immer.produce(stateObj, draft => {
        draft.grid = draft.grid.map(() => 0);
        const updateGridWithUnits = (units) => {
            units.forEach(unit => {
                if (unit.currentSquare >= 0 && unit.currentSquare < draft.grid.length) {
                    draft.grid[unit.currentSquare] = unit;
                }
            });
        };
        updateGridWithUnits(draft.playerArmy);
        updateGridWithUnits(draft.opponentArmy);
    });
}
  
function renderGrid(stateObj) {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = '';
    const existingPopup = document.querySelector('.attack-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';

    stateObj.grid.forEach((cell, index) => {
        gridContainer.appendChild(createGridCell(cell, index, stateObj));
    });

    appDiv.appendChild(gridContainer);
    if (stateObj.opponentArmy.length === 0) {
        appDiv.appendChild(createRestartButton(stateObj));
    } else {
        appDiv.appendChild(createEndTurnButton(stateObj));
    }
    
}

async function renderGlowingSquares(stateObj) {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = ''; // Clear existing content

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';

    stateObj.grid.forEach(async (cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'grid-cell';
        
        if (cell !== 0) {
            const avatar = createImageAvatar(cell)
            const healthDiv = createHealthText(cell)
            cellDiv.appendChild(avatar)
            cellDiv.appendChild(healthDiv)
            cellDiv.style.backgroundColor = cell.color

            if (cell.stunned > 0) {
                const stunnedIndicator = createStatusIndicator('stunned', cell.stunned);
                cellDiv.appendChild(stunnedIndicator);
            }
            if (cell.mark > 0) {
                const markedIndicator = createStatusIndicator('marked', cell.mark);
                cellDiv.appendChild(markedIndicator);
            }
        }
        
        if (stateObj.attackRangeSquares.includes(index)) {
            cellDiv.classList.add('glow-red');
            cellDiv.addEventListener('click', () => {
                console.log("clicked red square")
                stateObj = handleMoveToSquare(stateObj, index);
                console.log(stateObj.showAttackPopup + " popup")
                if (stateObj.showAttackPopup) {
                    renderAttackPopup(stateObj);
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

function calculatePopupPosition(index) {
    const row = Math.floor(index / state.gridSize) - 1;
    const col = index % state.gridSize - 1;

    let insertSize = (state.attackOptions.attack1 && state.attackOptions.attack2) ? ((80/state.gridSize)/2) : ((80/state.gridSize)) 

    const locationX = 10 + insertSize + (col * (80/state.gridSize));
    let locationY = ((80/state.gridSize)/2) + (row * (80/state.gridSize));
    if (row < 0) {
        locationY = (80/state.gridSize) + 3;
    }
    
    return { x: locationX, y: locationY };
}





async function renderAttackPopup(stateObj) {
    // Remove any existing popup
    const existingPopup = document.querySelector('.attack-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.className = 'attack-popup';
    const distance = findTargetDistance(stateObj)

    // Add buttons to the popup
    stateObj.attackOptions.forEach(async (attack, index) => {
        const attackButton = createAttackButton(stateObj, attack);
        attackButton.onclick = () => {
            stateObj = handleAttackButtonClick(stateObj, index);
        };
        popup.appendChild(attackButton);
    });
    
    const position = calculatePopupPosition(stateObj.attackPopupPosition);

    // Set the calculated position
    popup.style.position = 'absolute';
    popup.style.left = `${position.x}vw`;
    popup.style.top = `${position.y}vh`;

    document.body.appendChild(popup);
}

function handleCellClick(stateObj, index) {
    const clickedUnit = stateObj.playerArmy.find(unit => unit.currentSquare === index);
    if (clickedUnit && (!clickedUnit.unitMovedThisTurn || !clickedUnit.unitAttackedThisTurn)) {
        stateObj = whenUnitClicked(stateObj, clickedUnit);
        if (!clickedUnit.unitMovedThisTurn || (!clickedUnit.unitAttackedThisTurn && stateObj.attackRangeSquares.length > 0)) {
            stateObj = immer.produce(stateObj, draft => {
                draft.selectedUnitIndex = draft.playerArmy.indexOf(clickedUnit);
                draft.currentScreen = "chooseSquareToMove";
            });
        }
        renderScreen(stateObj);
    }
}

async function handleAttackButtonClick(stateObj, attackOptionsIndex) {
    const selectedUnit = stateObj.playerArmy[stateObj.selectedUnitIndex];
    const targetIndex = stateObj.targetEnemyIndex
    const attackIndex = selectedUnit.attacks.indexOf(stateObj.attackOptions[attackOptionsIndex])

    stateObj = await executeAttack(stateObj, selectedUnit, attackIndex, targetIndex);
    stateObj = setBackToNormal(stateObj);
    stateObj = updateState(stateObj)
    return stateObj
}

function handleMoveToSquare(stateObj, index) {

    if (canMoveToSquare(stateObj, index)) {
        stateObj = moveUnitToSquare(stateObj, index);
        stateObj = clearSelectionAndGlowingSquares(stateObj)
    } else if (canAttackSquare(stateObj, index)) {
        stateObj = prepareAttack(stateObj, index);
    } else {
        stateObj = setBackToNormal(clearSelectionAndGlowingSquares(stateObj));
    }
    stateObj= updateState(stateObj)
    return stateObj
}

function canMoveToSquare(stateObj, index) {
    return stateObj.selectedUnitIndex !== null && 
           stateObj.movableSquares.includes(index) && 
           !stateObj.playerArmy[stateObj.selectedUnitIndex].unitMovedThisTurn;
}

function moveUnitToSquare(stateObj, index) {
    return immer.produce(stateObj, draft => {
        const selectedUnit = draft.playerArmy[draft.selectedUnitIndex];
        draft.grid[selectedUnit.currentSquare] = 0;
        selectedUnit.currentSquare = index;
        draft.grid[index] = selectedUnit.color;
        selectedUnit.unitMovedThisTurn = true;
        draft.selectedUnitIndex = null;
        draft.currentScreen = "normalScreen";
    });
}

function canAttackSquare(stateObj, index) {
    const selectedUnit = stateObj.playerArmy[stateObj.selectedUnitIndex];
    const hasEnemyUnit = stateObj.opponentArmy.some(unit => unit.currentSquare === index);
    return hasEnemyUnit && 
           !selectedUnit.unitAttackedThisTurn && 
           stateObj.attackRangeSquares.includes(index);
}

function prepareAttack(stateObj, index) {
    return immer.produce(stateObj, draft => {
        const selectedUnit = draft.playerArmy[draft.selectedUnitIndex];
        const enemyUnit = draft.opponentArmy.find(unit => unit.currentSquare === index);
        draft.showAttackPopup = true;
        draft.attackPopupPosition = index;
        draft.attackOptions = getValidAttacks(selectedUnit, index);
        draft.targetEnemyIndex = draft.opponentArmy.indexOf(enemyUnit);
    });
}

function getValidAttacks(unit, targetIndex) {
    const distance = chebyshevDistance(unit.currentSquare, targetIndex);
    return unit.attacks.filter(attack => distance <= attack.range);
}

function clearSelectionAndGlowingSquares(stateObj) {
    return immer.produce(stateObj, draft => {
        draft.movableSquares = [];
        draft.attackRangeSquares = [];
    });
}

function setBackToNormal(stateObj) {
    return immer.produce(stateObj, draft => {
        draft.showAttackPopup = false;
        draft.attackPopupPosition = null;
        draft.attackOptions = null;
        draft.targetEnemyIndex = null;
        draft.selectedUnitIndex = null;
        draft.currentScreen = "normalScreen";
    });
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
    return stateObj.opponentArmy.reduce((accState, enemy) => {
        let newState = moveEnemy(accState, enemy);
        newState = enemyAttack(newState, enemy);
        return updateState(newState);
    }, stateObj);
}

function moveEnemy(stateObj, enemy) {
    return immer.produce(stateObj, draft => {
        const currentEnemy = draft.opponentArmy.find(e => e.id === enemy.id);
        if (currentEnemy.moveTowardsClosestEnemy) {
            moveTowardsClosestPlayer(draft, currentEnemy);
        } else {
            moveAwayFromAllPlayers(draft, currentEnemy);
        }
        updateGrid(draft);
    });
}

function enemyAttack(stateObj, enemy) {
    return immer.produce(stateObj, draft => {
        const currentEnemy = draft.opponentArmy.find(e => e.id === enemy.id);
        const attackInfo = findTargetForAttack(draft, currentEnemy);
        if (attackInfo) {
            executeEnemyAttack(draft, currentEnemy, attackInfo.target, attackInfo.attack);
        }
        updateGrid(draft);
    });
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

function getBestAttack(enemy, target) {
    // Get all attacks that can kill the target
    const killingAttacks = enemy.attacks.filter(attack => attack.damage >= target.health);

    if (killingAttacks.length > 0) {
        // If multiple attacks can kill, choose the one with the highest accuracy modifier
        killingAttacks.sort((a, b) => a.accuracyModifier - b.accuracyModifier);
        return killingAttacks[0];
    }

    // If no attack can kill, return the attack with the highest damage
    return enemy.attacks.reduce((best, current) => 
        current.damage > best.damage ? current : best
    , enemy.attacks[0]);
}

function findTargetForAttack(stateObj, enemy) {
    let potentialTargets = [];
    let closestTarget = null;
    let minDistance = Infinity;

    stateObj.playerArmy.forEach(player => {
        const distance = chebyshevDistance(enemy.currentSquare, player.currentSquare);
        // Check if any attack can kill the player within its range
        const canKill = enemy.attacks.some(attack => 
            attack.damage >= player.health && distance <= attack.range
        );

        if (canKill) {
            potentialTargets.push({ player, distance });
        }

        // Check if the player is the closest target within any attack range
        const inRange = enemy.attacks.some(attack => distance <= attack.range);
        if (distance < minDistance && inRange) {
            minDistance = distance;
            closestTarget = player;
        }
    });
    //aim at closest target if you can't kill any, then hit it with your most damaging attack
    if (potentialTargets.length > 0) {
        potentialTargets.sort((a, b) => a.distance - b.distance);
        const target = potentialTargets[0].player;
        const bestAttack = getBestAttack(enemy, target);
        return { target, attack: bestAttack };
    } else if (closestTarget) {
        const bestAttack = getBestAttack(enemy, closestTarget);
        return { target: closestTarget, attack: bestAttack };
    }

    return null; // No valid target found
}

