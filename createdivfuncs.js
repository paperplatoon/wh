function createEndTurnButton(stateObj) {
    const endTurnButton = document.createElement('button');
    endTurnButton.textContent = 'End Turn';
    endTurnButton.className = "bottom-button"
    endTurnButton.addEventListener('click', () => {
        stateObj = handleEndTurn(stateObj);
        updateState(stateObj);
    });
    const allUnitsDone = stateObj.playerArmy.every(unit => unit.unitAttackedThisTurn && unit.unitMovedThisTurn);
    if (allUnitsDone) {
        endTurnButton.classList.add("player-done");
    }
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
    const attackerUnit = stateObj.playerArmy[stateObj.selectedUnitIndex]
    let textString = attack.name
    if (attack.accuracyModifier > 0 && stateObj.targetEnemyIndex) {
        const distance = findTargetDistance(stateObj)
        const stunnedPenalty = attackerUnit.accuracy * 0.1;
        const markBuff = stateObj.opponentArmy[stateObj.targetEnemyIndex].mark * 0.1
        const distanceModifier = (distance-1) * attack.accuracyModifier
        let threshold =  distanceModifier + stunnedPenalty - markBuff; 
        threshold = Math.round(threshold * 100)
        const accuracy = ((100-threshold)>100) ? 100 : (100-threshold)
         textString +=  " (" + accuracy + "%)"
    }
    
    attackButton.innerText = textString
    return attackButton
}

function createStunnedIndicator(status, value) {
    const indicator = document.createElement('div');
    if (value < 0) {
        indicator.className = `status-indicator stunned-indicator-buff`;
        indicator.textContent = "+" + Math.abs(value);
    } else {
        indicator.className = `status-indicator ${status}-indicator`;
        indicator.textContent = Math.abs(value);
    } 
    
    return indicator;
}

function createStatusIndicator(status, value) {
    const indicator = document.createElement('div');
    if (value < 0) {
        indicator.className = `status-indicator ${status}-indicator-buff`;
        indicator.textContent = "+" + Math.abs(value);
    } else {
        indicator.className = `status-indicator ${status}-indicator`;
        indicator.textContent = Math.abs(value);
    } 
    
    return indicator;
}

function createAttackDivs(unit) {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('attack-bottom-row-div')

    for (let i=0; i<unit.attacks.length; i++) {
        const attackDiv = document.createElement('div');
        attackDiv.classList.add('attack-bottom-div')

        const attackNameDiv = document.createElement('div');
        attackNameDiv.classList.add('attack-name-div')
        attackNameDiv.textContent = unit.attacks[i].name

        const attackTextDiv = document.createElement('div');
        attackTextDiv.classList.add('attack-text-div')
        attackTextDiv.textContent = unit.attacks[i].text(i)
        
        attackDiv.append(attackNameDiv, attackTextDiv)
        rowDiv.append(attackDiv)
    }

    return rowDiv
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

        if (cell.accuracy !== 0) {
            const stunnedIndicator = createStatusIndicator('stunned', cell.accuracy);
            cellDiv.appendChild(stunnedIndicator);
        }
        if (cell.mark !== 0) {
            const markedIndicator = createStatusIndicator('marked', cell.mark);
            cellDiv.appendChild(markedIndicator);
        }
    }
    return cellDiv;
}