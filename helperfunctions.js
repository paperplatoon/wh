function findTargetDistance(stateObj) {
    const selectedUnit = stateObj.playerArmy[stateObj.selectedUnitIndex];
    const enemyUnit = stateObj.opponentArmy[stateObj.targetEnemyIndex];
    const distance = chebyshevDistance(selectedUnit.currentSquare, enemyUnit.currentSquare)
    return distance
}

function createEndTurnButton(stateObj) {
    const endTurnButton = document.createElement('button');
    endTurnButton.textContent = 'End Turn';
    endTurnButton.className = "bottom-button"
    endTurnButton.addEventListener('click', () => {
        stateObj = handleEndTurn(stateObj);
        updateState(stateObj);
    });

    return endTurnButton
}

function createRestartButton() {
    const endTurnButton = document.createElement('button');
    endTurnButton.className = "bottom-button"
    endTurnButton.textContent = 'You won! Click to restart';
    endTurnButton.addEventListener('click', () => {
        location.reload()
    });
    return endTurnButton
}

function createImageAvatar(cell) {
    const img = document.createElement('img');
    img.src = cell.img;
    img.alt = '';
    img.className = 'centered-img';
    return img
}

function createHealthText(cell) {
    const healthDiv = document.createElement('div');
    healthDiv.className = 'health-text';
    healthDiv.textContent = cell.health;
    return healthDiv
}

function createAttackButton(stateObj, attack) {
    const attackButton = document.createElement('button');
    const distance = findTargetDistance(stateObj)
    const markPenalty = stateObj.opponentArmy[stateObj.targetEnemyIndex].mark * 0.1
    const distanceModifier = (distance-1) * attack.accuracyModifier
    const threshold = Math.round((distanceModifier - markPenalty) * 100)
    const accuracy = ((100-threshold)>100) ? 100 : (100-threshold)
    const textString = (accuracy) ?  attack.name + " (" + accuracy + "%)" : attack.name
    attackButton.innerText = textString
    return attackButton
}

function executeEnemyAttack(stateObj, attacker, target, attack) {
    const targetIndex = stateObj.playerArmy.findIndex(unit => unit.currentSquare === target.currentSquare);
    stateObj = attack.execute(stateObj, targetIndex, attack);
    return immer.produce(stateObj, draft => {
        
        if (targetIndex === -1) return;

        // Mark the attacker as having attacked this turn
        const attackerIndex = draft.opponentArmy.findIndex(unit => unit.id === attacker.id);
        if (attackerIndex !== -1) {
            draft.opponentArmy[attackerIndex].unitAttackedThisTurn = true;
        }
    });
}

function applyDamage(stateObj, targetIndex, attack, attackerSquare, isPlayer) {
    return immer.produce(stateObj, draft => {
        const targetUnit = (isPlayer) ? draft.opponentArmy[targetIndex] : draft.playerArmy[targetIndex];
        const attackerUnit = (isPlayer) ? stateObj.playerArmy[stateObj.selectedUnitIndex] : draft.opponentArmy.find(unit => unit.currentSquare === attackerSquare);
        if (targetUnit) {
            const distance = chebyshevDistance(attackerSquare, targetUnit.currentSquare);
            const hitRoll = Math.random();
            const markBuff = targetUnit.mark * 0.1; // Calculate mark penalty
            const stunnedPenalty = attackerUnit.stunned * 0.1;
            const distanceModifier = ((distance - 1) * attack.accuracyModifier)
            const threshold =  distanceModifier + stunnedPenalty - markBuff; 
            console.log("hitroll is " + Math.round(hitRoll*100)/100 + " and threshold is " + Math.round(threshold*100)/100);
            if (hitRoll > threshold) {
                targetUnit.health -= attack.damage;
            }
        }
    });
}


function applyAOEdamage(stateObj, targetIndex, attack, isPlayer) {
    centerIndex = (isPlayer) ? stateObj.opponentArmy[targetIndex].currentSquare : stateObj.playerArmy[targetIndex].currentSquare
    return immer.produce(stateObj, draft => {
        const affectedSquares = getSquaresInRadius(centerIndex, attack.radius, draft.gridSize);
        console.log(affectedSquares)
        affectedSquares.forEach(square => {
            const targetUnit = draft.grid[square];
            if (targetUnit !== 0) {
                let targetIndex = draft.playerArmy.findIndex(unit => unit.currentSquare === square);
                let targetArmy = draft.playerArmy;
                if (targetIndex === -1) {
                    targetIndex = draft.opponentArmy.findIndex(unit => unit.currentSquare === square);
                    targetArmy = draft.opponentArmy;
                }
                if (targetIndex !== -1) {
                    targetArmy[targetIndex].health -= attack.damage;
                }
            }
        });
    });
}

async function applyStun(stateObj, targetIndex, amount, isPlayer) {
    return immer.produce(stateObj, draft => {
        const targetUnit = isPlayer ? draft.playerArmy[targetIndex] : draft.opponentArmy[targetIndex];
        if (targetUnit) {
            targetUnit.stunned += amount;
        }
    });
}

function createGridCell(cell, index, stateObj) {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'grid-cell';
    if (cell !== 0) {
        const avatar = createImageAvatar(cell);
        const healthDiv = createHealthText(cell);
        cellDiv.appendChild(avatar);
        cellDiv.appendChild(healthDiv);
        cellDiv.style.backgroundColor = cell.color;
        cellDiv.addEventListener('click', () => handleCellClick(stateObj, index));

        if (cell.stunned > 0) {
            const stunnedIndicator = createStatusIndicator('stunned', cell.stunned);
            cellDiv.appendChild(stunnedIndicator);
        }
        if (cell.mark > 0) {
            const markedIndicator = createStatusIndicator('marked', cell.mark);
            cellDiv.appendChild(markedIndicator);
        }
    }
    return cellDiv;
}

function createStatusIndicator(status, value) {
    const indicator = document.createElement('div');
    indicator.className = `status-indicator ${status}-indicator`;
    indicator.textContent = value;
    return indicator;
}


function setBackToNormal(draft) {
    draft.showAttackPopup = false;
    draft.attackPopupPosition = null;
    draft.attackOptions = null;
    draft.targetEnemyIndex = null;
    draft.selectedUnitIndex = null;
    draft.currentScreen = "normalScreen";
}

function resetUnitTurnStatus(units) {
    units.forEach(unit => {
        unit.unitMovedThisTurn = false;
        unit.unitAttackedThisTurn = false;
    });
}



async function executeAttack(stateObj, unit, attackIndex, targetIndex) {
    const attack = unit.attacks[attackIndex];
    if (!attack) return stateObj;

    stateObj = await attack.execute(stateObj, targetIndex, attack);

    return immer.produce(stateObj, draft => {
        const unitIndex = draft.playerArmy.findIndex(u => u.id === unit.id);
        if (unitIndex !== -1) {
            draft.playerArmy[unitIndex].unitAttackedThisTurn = true;
        }
    });
}

function applyMark(stateObj, targetIndex, amount, isPlayer) {
    return immer.produce(stateObj, draft => {
        const targetUnit = (isPlayer) ? draft.opponentArmy[targetIndex] : draft.playerArmy[targetIndex]
        if (targetUnit) {
            targetUnit.mark += amount;
        }
    });
}

function applyStun(stateObj, targetIndex, duration) {
    return immer.produce(stateObj, draft => {
        const targetUnit = draft.opponentArmy.find(unit => unit.currentSquare === draft.opponentArmy[targetIndex].currentSquare);
        if (targetUnit) {
            targetUnit.stunned = duration;
        }
    });
}

function whenUnitClicked(stateObj, unit) {
    if (!unit.playerOwned || (unit.unitMovedThisTurn && unit.unitAttackedThisTurn)) return stateObj;

    return immer.produce(stateObj, draft => {
        const { movableSquares, attackRangeSquares } = getUnitActionSquares(unit, draft.gridSize);

        if (!unit.unitMovedThisTurn) {
            draft.movableSquares = movableSquares.filter(square => 
                square >= 0 && square < draft.grid.length && draft.grid[square] === 0
            );
        }

        if (!unit.unitAttackedThisTurn) {
            draft.attackRangeSquares = attackRangeSquares.filter(square => 
                square >= 0 && square < draft.grid.length && 
                draft.opponentArmy.some(unit => unit.currentSquare === square)
            );
        }
    });
}

function getUnitActionSquares(unit, gridSize) {
    const movableSquares = new Set();
    const attackRangeSquares = new Set();
    const currentRow = Math.floor(unit.currentSquare / gridSize);
    const currentCol = unit.currentSquare % gridSize;

    getSquaresInRange(currentRow, currentCol, unit.movementSquares, gridSize, movableSquares);
    unit.attacks.forEach(attack => {
        getSquaresInRange(currentRow, currentCol, attack.range, gridSize, attackRangeSquares);
    });

    return { 
        movableSquares: Array.from(movableSquares), 
        attackRangeSquares: Array.from(attackRangeSquares)
    };
}

function getSquaresInRange(currentRow, currentCol, range, gridSize, squaresSet) {
    for (let rowOffset = -range; rowOffset <= range; rowOffset++) {
        for (let colOffset = -range; colOffset <= range; colOffset++) {
            const newRow = currentRow + rowOffset;
            const newCol = currentCol + colOffset;

            if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                const distance = Math.max(Math.abs(rowOffset), Math.abs(colOffset));
                if (distance <= range && distance > 0) {
                    squaresSet.add(newRow * gridSize + newCol);
                }
            }
        }
    }
}


function chebyshevDistance(square1, square2) {
    const x1 = square1 % state.gridSize, y1 = Math.floor(square1 / state.gridSize);
    const x2 = square2 % state.gridSize, y2 = Math.floor(square2 / state.gridSize);
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

function getSquaresInRadius(centerIndex, radius, gridSize) {
    const squares = [];
    const centerX = centerIndex % gridSize;
    const centerY = Math.floor(centerIndex / gridSize);

    for (let x = centerX - radius; x <= centerX + radius; x++) {
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
                squares.push(y * gridSize + x);
            }
        }
    }

    return squares;
}

