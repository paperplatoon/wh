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
    const distanceModifier = (distance-1) * attack.effects[0].accuracyModifier
    const threshold = Math.round((distanceModifier - markPenalty) * 100)
    const accuracy = ((100-threshold)>100) ? 100 : (100-threshold)
    const textString = (accuracy) ?  attack.name + " (" + accuracy + "%)" : attack.name
    attackButton.innerText = textString
    return attackButton
}

function executeEnemyAttack(draft, attacker, target, attack) {
    const targetIndex = draft.playerArmy.findIndex(unit => unit.currentSquare === target.currentSquare);
    if (targetIndex === -1) return;

    attack.effects.forEach(effect => {
        switch (effect.type) {
            case 'damage':
                console.log(attack.name)
                applyPlayerDamage(draft, attacker, targetIndex, effect.amount, effect.accuracyModifier);
                break;
            case 'stun':
                applyStun(draft, targetIndex, effect.duration);
                break;
            case 'areaEffect':
                applyAreaEffect(draft, targetIndex, effect.radius, effect.effect);
                break;
            // Add more effect types as needed
        }
    });

    attacker.unitAttackedThisTurn = true;
}

function applyPlayerDamage(draft, attacker, targetIndex, amount, accuracyModifier) {
    const targetUnit = draft.playerArmy[targetIndex];
    const selectedUnit = draft.playerArmy[draft.selectedUnitIndex];
    if (targetUnit) {
        const distance = chebyshevDistance(attacker.currentSquare, targetUnit.currentSquare);
        const hitRoll = Math.random();
        const markPenalty = targetUnit.mark * 0.1; // Calculate mark penalty
        const threshold = (distance - 1) * accuracyModifier - markPenalty; 
        console.log(`Hit roll: ${Math.round(hitRoll * 100) / 100}, Threshold: ${Math.round(threshold * 100) / 100}`);
        if (hitRoll > threshold) {
            targetUnit.health -= amount;
        }
    }
}

function applyStun(draft, targetIndex, duration) {
    const targetUnit = draft.playerArmy.find(unit => unit.currentSquare === draft.playerArmy[targetIndex].currentSquare);
    if (targetUnit) {
        targetUnit.stunned = duration;
    }
}

function applyAreaEffect(draft, centerIndex, radius, effect) {
    const affectedSquares = getSquaresInRadius(centerIndex, radius, draft.gridSize);
    affectedSquares.forEach(square => {
        const targetIndex = draft.playerArmy.findIndex(unit => unit.currentSquare === square);
        if (targetIndex !== -1) {
            switch (effect.type) {
                case 'damage':
                    applyDamage(draft, effect, targetIndex, effect.amount, effect.accuracyModifier);
                    break;
                case 'stun':
                    applyStun(draft, targetIndex, effect.duration);
                    break;
                // Add more effect types as needed
            }
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
    }
    return cellDiv;
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



function executeAttack(stateObj, unit, attackIndex, targetIndex) {
    const attack = unit.attacks[attackIndex];
    if (!attack) return stateObj;

    attack.effects.forEach(effect => { 
        stateObj = applyEffect(stateObj, effect, targetIndex);
    });

    return immer.produce(stateObj, draft => {
        const unitIndex = draft.playerArmy.findIndex(u => u.id === unit.id);
        if (unitIndex !== -1) {
            draft.playerArmy[unitIndex].unitAttackedThisTurn = true;
        }
    });
}

function applyEffect(stateObj, effect, targetIndex) {
    switch (effect.type) {
        case 'damage':
            return applyDamage(stateObj, targetIndex, effect.amount, effect.accuracyModifier);
        case 'stun':
            return applyStun(stateObj, targetIndex, effect.duration);
        case 'areaEffect':
            return applyAreaEffect(stateObj, targetIndex, effect.radius, effect.effect);
        case 'applyMark':
            return applyMark(stateObj, targetIndex, effect.amount);
        // Add more effect types as needed
        default:
            return stateObj;
    }
}

function applyDamage(stateObj, targetIndex, amount, accuracyModifier) {
    return immer.produce(stateObj, draft => {
        const targetUnit = draft.opponentArmy[targetIndex];
        if (targetUnit) {
            const distance = chebyshevDistance(stateObj.playerArmy[stateObj.selectedUnitIndex].currentSquare, targetUnit.currentSquare);
            const hitRoll = Math.random();
            const markPenalty = targetUnit.mark * 0.1; // Calculate mark penalty
            const distMod = ((distance - 1) * accuracyModifier)
            const threshold =  distMod - markPenalty; 
            console.log("markpen " + markPenalty + " accmod " + accuracyModifier +" distnace " + distance +  " distMod " + distMod)
            console.log("hitroll is " + Math.round(hitRoll*100)/100 + " and threshold is " + Math.round(threshold*100)/100);
            if (hitRoll > threshold) {
                targetUnit.health -= amount;
            }
        }
    });
}

function applyMark(stateObj, targetIndex, amount) {
    return immer.produce(stateObj, draft => {
        const targetUnit = draft.opponentArmy[targetIndex];
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

function applyAreaEffect(stateObj, centerIndex, radius, effect) {
    const affectedSquares = getSquaresInRadius(centerIndex, radius, stateObj.gridSize);
    return affectedSquares.reduce((accStateObj, square) => {
        return applyEffect(accStateObj, effect, square);
    }, stateObj);
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

