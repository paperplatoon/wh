function findTargetDistance(stateObj) {
    const selectedUnit = stateObj.playerArmy[stateObj.selectedUnitIndex];
    const enemyUnit = stateObj.opponentArmy[stateObj.targetEnemyIndex];
    const distance = chebyshevDistance(selectedUnit.currentSquare, enemyUnit.currentSquare)
    return distance
}

function createEndTurnButton(stateObj) {
    const endTurnButton = document.createElement('button');
    endTurnButton.textContent = 'End Turn';
    endTurnButton.addEventListener('click', () => {
        stateObj = handleEndTurn(stateObj);
        updateState(stateObj);
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
    const accuracy = 100-Math.round(((distance-1) * attack.distanceAccuracyModifier ) * 100)
    attackButton.innerText = attack.name + " (" + accuracy + "%)";
    return attackButton
}

function chebyshevDistance(square1, square2) {
    const x1 = square1 % state.gridSize, y1 = Math.floor(square1 / state.gridSize);
    const x2 = square2 % state.gridSize, y2 = Math.floor(square2 / state.gridSize);
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

function executeAttack(draft, enemy, target, attack) {
    target.health -= attack.attack;
    enemy.unitAttackedThisTurn = true;
}