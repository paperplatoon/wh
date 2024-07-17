function createEndTurnButton(stateObj) {
    const endTurnButton = document.createElement('button');
    endTurnButton.textContent = 'End Turn';
    endTurnButton.className = "bottom-button"
    endTurnButton.addEventListener('click', async () => {
        stateObj = await handleEndTurn(stateObj);
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
    if (attack.accuracyModifier > 0 && stateObj.targetEnemyIndex !== null) {
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

function createUnitSelectionDiv(unit, stateObj) {
    const unitDiv = document.createElement('div');
    unitDiv.className = 'unit-selection';
    
    const avatar = createImageAvatar(unit);
    const pointsDiv = document.createElement('div');
    pointsDiv.className = 'points-div';
    pointsDiv.textContent = `Points: ${unit.points}`;

    unitDiv.appendChild(avatar);
    unitDiv.appendChild(pointsDiv);

    unitDiv.addEventListener('click', () => {
        if (stateObj.selectedArmyPoints + unit.points <= stateObj.maxArmyPoints) {
            stateObj = addUnitToArmy(stateObj, unit);
            updateState(stateObj);
        }
    });

    return unitDiv;
}

function createStartGameButton(stateObj) {
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Game';
    startButton.className = 'bottom-button';
    startButton.disabled = stateObj.selectedArmyPoints === 0;
    
    startButton.addEventListener('click', () => {
        stateObj = startGame(stateObj);
        updateState(stateObj);
    });

    return startButton;
}

async function animateAttack(attackerSquare, targetSquare, hit, gridSize) {
    const gridContainer = document.querySelector('.grid-container');
    
    // Calculate cell size
    const cellWidth = 80 / gridSize;
    const cellHeight = 80 / gridSize;

    // Calculate attacker and target positions
    const attackerRow = Math.floor(attackerSquare / gridSize);
    const attackerCol = attackerSquare % gridSize;
    const targetRow = Math.floor(targetSquare / gridSize);
    const targetCol = targetSquare % gridSize;

    // Calculate center points
    const attackerX = 10 + (attackerCol + 0.5) * cellWidth;
    const attackerY = (attackerRow + 0.5) * cellHeight;
    const targetX = 10 + (targetCol + 0.5) * cellWidth;
    const targetY = (targetRow + 0.5) * cellHeight;

    // Calculate distance and angle
    const dx = targetX - attackerX;
    const dy = targetY - attackerY;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // Create laser beam
    const laser = document.createElement('div');
    laser.className = 'laser-beam';
    
    laser.style.left = `${attackerX}vw`;
    laser.style.top = `${attackerY}vh`;
    laser.style.width = `3vw`;
    laser.style.transform = `rotate(${angle}deg)`;

    gridContainer.appendChild(laser);

    // Animate laser
    laser.animate([
        { transform: `rotate(${angle}deg) translateX(0)` },
        { transform: `rotate(${angle}deg) translateX(${hit ? distance/1.3 : distance}vw)` }
    ], {
        duration: 300,
        easing: 'linear'
    });

    // Wait for animations to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    laser.remove();

    // Animate hit or miss
    const targetCell = document.querySelector(`.grid-cell:nth-child(${targetSquare + 1})`);
    const avatar = targetCell.querySelector('img');
    if (hit && avatar) {
        console.log('applying glow red')
        avatar.classList.add('taking-damage');
        targetCell.classList.add('flash')
    } else if (avatar) {
        console.log('applying duck')
        avatar.classList.add('duck');
    }

    await new Promise(resolve => setTimeout(resolve, 300));


    // Clean up
    
    targetCell.classList.remove('flash-orange', 'flash');
    if (avatar) {
        avatar.classList.remove('glow-red', 'duck');
    }
}