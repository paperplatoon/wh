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
    const accuracy = 100-Math.round(((distance-1) * attack.effects[0].accuracyModifier ) * 100)
    attackButton.innerText = attack.name + " (" + accuracy + "%)";
    return attackButton
}

function chebyshevDistance(square1, square2) {
    const x1 = square1 % state.gridSize, y1 = Math.floor(square1 / state.gridSize);
    const x2 = square2 % state.gridSize, y2 = Math.floor(square2 / state.gridSize);
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

function executeEnemyAttack(draft, attacker, target, attack) {
    const targetIndex = draft.playerArmy.findIndex(unit => unit.currentSquare === target.currentSquare);
    if (targetIndex === -1) return;

    attack.effects.forEach(effect => {
        switch (effect.type) {
            case 'damage':
                console.log(attack.name)
                applyDamage(draft, attacker, targetIndex, effect.amount, effect.accuracyModifier);
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

function applyDamage(draft, attacker, targetIndex, amount, accuracyModifier) {
    const targetUnit = draft.playerArmy[targetIndex];
    if (targetUnit) {
        const distance = chebyshevDistance(attacker.currentSquare, targetUnit.currentSquare);
        const hitRoll = Math.random();
        const threshold = (distance - 1) * accuracyModifier;
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
