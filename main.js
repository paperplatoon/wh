//the problem is that buffs don't work
//they don't even appear unless the buffer is in range of an ENEMY
let state = {
    currentScreen: "armySelectionScreen",
    playerTurn: true,
    turnCounter: 0,
    currentFloor: 0,
    playerArmy: [...playerArray],
    opponentArmy: [...opponentArray],
    movableSquares: [],
    attackRangeSquares: [],
    buffableSquares: [],
    selectedUnitIndex: null,
    gridSize: 8,
    grid: new Array(64).fill(0),
    showAttackPopup: false,
    attackPopupPosition: null,
    attackOptions: [],
    targetEnemyIndex: null,
    targetAllyIndex: null,
    currentUnitID: 4,
    selectedArmyPoints: 0,
    maxArmyPoints: 10, // Adjust this value as needed
    selectedArmy: [],
    powerfulWeaponChoice: powerfulWeapons[1],
};

async function handleEndTurn(stateObj) {
    stateObj =  immer.produce(stateObj, draft => {
        resetUnitTurnStatus(draft.playerArmy);
        resetUnitTurnStatus(draft.opponentArmy);
        draft.turnCounter++;
    });
    stateObj = setBackToNormal(stateObj)
    return await EnemiesMove(stateObj);
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

            if (cell.accuracy > 0) {
                const stunnedIndicator = createStatusIndicator('stunned', cell.accuracy);
                cellDiv.appendChild(stunnedIndicator);
            }
            if (cell.mark !== 0) {
                const markedIndicator = createStatusIndicator('marked', cell.mark);
                cellDiv.appendChild(markedIndicator);
            }
        }
        
        if (stateObj.attackRangeSquares.includes(index)) {
            cellDiv.classList.add('glow-red');
        } else if (stateObj.movableSquares.includes(index)) {
            cellDiv.classList.add('glow-blue');
        } else if (stateObj.buffableSquares.includes(index)) {
            cellDiv.classList.add('glow-green');
        }
        
        cellDiv.addEventListener('click', async () => {
            stateObj = await handleMoveToSquare(stateObj, index);
            if (stateObj.showAttackPopup) {
                renderAttackPopup(stateObj);
            }
        });
         
        gridContainer.appendChild(cellDiv);
    });

    appDiv.appendChild(gridContainer);
    let attackRowDiv = createUnitAttacksDiv(stateObj.playerArmy[stateObj.selectedUnitIndex])
    appDiv.appendChild(attackRowDiv)
}

function calculatePopupPosition(index) {
    const row = Math.floor(index / state.gridSize) - 1;
    const col = index % state.gridSize - 1;

    let insertSize = (state.attackOptions.length > 1 ) ? ((80/state.gridSize)/2) : ((80/state.gridSize)) 

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

    // Add buttons to the popup
    for (let i=0; i < stateObj.attackOptions.length; i++ ) {
        let attack = stateObj.attackOptions[i]
        if ( (stateObj.targetEnemyIndex !== null && !attack.buff) || (stateObj.targetAllyIndex !== null && attack.buff) ) {
            let attackButton = createAttackButton(stateObj, attack);
            attackButton.onclick = async () => {
                // console.log("clicking buttons and targ enemy index is " + stateObj.targetEnemyIndex)
                stateObj = await handleAttackButtonClick(stateObj, i);
            };
            popup.appendChild(attackButton);
        } 
    }
    
    const position = calculatePopupPosition(stateObj.attackPopupPosition);

    // Set the calculated position
    popup.style.position = 'absolute';
    popup.style.left = `${position.x}vw`;
    popup.style.top = `${position.y}vh`;

    document.body.appendChild(popup);
}

function handleAttackSelection(stateObj, unitIndex, attackIndex) {
    const confirmationPopup = document.createElement('div');
    confirmationPopup.className = 'confirmation-popup';
    confirmationPopup.innerHTML = `
      <p>Are you sure you want to replace ${stateObj.playerArmy[unitIndex].attacks[attackIndex].name} with ${stateObj.powerfulWeaponChoice.name}?</p>
      <button id="confirm-swap">Yes</button>
      <button id="cancel-swap">Cancel</button>
    `;
  
    document.body.appendChild(confirmationPopup);
  
    document.getElementById('confirm-swap').addEventListener('click', () => {
      stateObj = swapAttack(stateObj, unitIndex, attackIndex);
      confirmationPopup.remove();
    });
  
    document.getElementById('cancel-swap').addEventListener('click', () => {
      confirmationPopup.remove();
    });
  }

function swapAttack(stateObj, unitIndex, attackIndex) {
    stateObj =  immer.produce(stateObj, draft => {
        const unit = draft.playerArmy[unitIndex];
        const newWeapon = {...stateObj.powerfulWeaponChoice};
        
        // Ensure the execute function has access to unit properties
        unit.attacks[attackIndex] = newWeapon;

        draft.currentFloor++;
        draft.powerfulWeaponChoice = null;
    });
    return startNewFight(stateObj)
}

  function startNewFight(stateObj) {
    console.log("starting new fight")
    stateObj = immer.produce(stateObj, draft => {
      draft.opponentArmy = [...opponentArray];
      draft.opponentArmy = opponentArray.map(unit => resetUnit(unit));
      draft.turnCounter = 0;
      draft.playerTurn = true;
      draft.currentScreen = "normalScreen"
      draft.powerfulWeaponChoice = null;
      draft.grid = new Array(draft.gridSize * draft.gridSize).fill(0);

      const playerLocations = getRandomNumbersInRange(0, 16, draft.playerArmy.length)

      draft.playerArmy.forEach((unit, unitIndex) => {
        unit.currentSquare = playerLocations[unitIndex];
    });

    });
    updateState(stateObj);
  }

function handleCellClick(stateObj, index) {
    const clickedUnit = stateObj.playerArmy.find(unit => unit.currentSquare === index);
    if (clickedUnit && (!clickedUnit.unitMovedThisTurn || !clickedUnit.unitAttackedThisTurn)) {
        stateObj = whenUnitClicked(stateObj, clickedUnit);
        //allow buffs
        if (!clickedUnit.unitMovedThisTurn || (!clickedUnit.unitAttackedThisTurn && (stateObj.attackRangeSquares.length > 0 || stateObj.buffableSquares.length > 0 ))) {
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
    const targetIndex = (stateObj.targetEnemyIndex !== null) ? stateObj.targetEnemyIndex : stateObj.targetAllyIndex
    const attackIndex = selectedUnit.attacks.indexOf(stateObj.attackOptions[attackOptionsIndex])

    const existingPopup = document.querySelector('.attack-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    stateObj = await executeAttack(stateObj, attackIndex, targetIndex);
    stateObj = setBackToNormal(stateObj);
    stateObj = updateState(stateObj)
    return stateObj
}

async function handleMoveToSquare(stateObj, index) {

    if (canMoveToSquare(stateObj, index)) {
        stateObj = await moveUnitToSquare(stateObj, index);
        stateObj = clearSelectionAndGlowingSquares(stateObj)
    } else if (canAttackSquare(stateObj, index)) {
        stateObj = prepareAttack(stateObj, index, true);
    } else if (canBuffUnit(stateObj, index)) {
        stateObj = prepareAttack(stateObj, index, false);
    }else {
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

async function moveUnitToSquare(stateObj, index) {
    return immer.produce(stateObj, async draft => {
        const selectedUnit = draft.playerArmy[draft.selectedUnitIndex];
        const oldSquare = selectedUnit.currentSquare;
        draft.grid[oldSquare] = 0;
        selectedUnit.currentSquare = index;
        draft.grid[index] = selectedUnit.color;
        selectedUnit.unitMovedThisTurn = true;
        draft.selectedUnitIndex = null;
        draft.currentScreen = "normalScreen";
        // You could add an animation here
        // await animateMove(selectedUnit, oldSquare, index);
    });
}

function canAttackSquare(stateObj, index) {
    const selectedUnit = stateObj.playerArmy[stateObj.selectedUnitIndex];
    const hasEnemyUnit = stateObj.opponentArmy.some(unit => unit.currentSquare === index);
    return hasEnemyUnit && 
           !selectedUnit.unitAttackedThisTurn && 
           stateObj.attackRangeSquares.includes(index);
}

function prepareAttack(stateObj, index, targetingEnemy) {
    return immer.produce(stateObj, draft => {
        const selectedUnit = draft.playerArmy[draft.selectedUnitIndex];
        const enemyUnit = (targetingEnemy) ? draft.opponentArmy.find(unit => unit.currentSquare === index) : draft.playerArmy.find(unit => unit.currentSquare === index)
        draft.showAttackPopup = true;
        draft.attackPopupPosition = index;
        draft.attackOptions = getValidAttacks(selectedUnit, index);
        draft.targetEnemyIndex = (draft.opponentArmy.indexOf(enemyUnit) !== -1) ? draft.opponentArmy.indexOf(enemyUnit) : null
        draft.targetAllyIndex = (draft.playerArmy.indexOf(enemyUnit) !== -1) ? draft.playerArmy.indexOf(enemyUnit) : null
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
        draft.targetAllyIndex = null;
        draft.selectedUnitIndex = null;
        draft.movableSquares = []
        draft.buffableSquares = []
        draft.attackRangeSquares = []
        draft.currentScreen = "normalScreen";
    });
}

function renderWeaponSelectionScreen(stateObj) {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = 'Found ' + stateObj.powerfulWeaponChoice.name + '! Choose unit attack to swap';
    title.className = 'weapon-selection-title';
    appDiv.appendChild(title);

    const powerfulWeaponDiv = createAttackDiv(stateObj.powerfulWeaponChoice);
    powerfulWeaponDiv.className = 'powerful-weapon-div';
    appDiv.appendChild(powerfulWeaponDiv);

    const unitRowDiv = document.createElement('div');
    unitRowDiv.className = 'unit-row';
    appDiv.appendChild(unitRowDiv);

    const unitAttackDivs = displayPlayerUnits(stateObj, true);
    unitRowDiv.appendChild(unitAttackDivs);
}

function renderScreen(stateObj) {
    const screenRenderers = {
      "armySelectionScreen": renderArmySelectionScreen,
      "normalScreen": renderGrid,
      "chooseSquareToMove": renderGlowingSquares,
      "weaponSelectionScreen": renderWeaponSelectionScreen,
    };
  
    const renderer = screenRenderers[stateObj.currentScreen];
    if (renderer) {
      renderer(stateObj);
    } else {
      console.error(`Unknown screen: ${stateObj.currentScreen}`);
    }
}

async function moveEnemyUnit(stateObj, enemy) {
    return immer.produce(stateObj, async draft => {
        const currentEnemy = draft.opponentArmy.find(e => e.id === enemy.id);
        const movements = {
            "towardsClosestEnemy": moveTowardsClosestPlayer,
            "awayFromEnemy": moveAwayFromAllPlayers,
            "awayFromAll": moveAwayFromAllUnits,
            "moveTowardsFellows": moveTowardsClosestFellow,
            "moveTowardsLeader": moveTowardsLeader,
        };
        
        const movement = movements[currentEnemy.movement];
        await movement(draft, currentEnemy);
        // Here you can add an animation function
        // await animateMove(currentEnemy, oldPosition, newPosition);
    });
}

function checkForDeath(stateObj) {

    stateObj = immer.produce(stateObj, draft => {
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
        if (draft.opponentArmy.length === 0) {
            console.log("all opponents dead, moving to selectRandom")
            resetUnitsHealth(draft.playerArmy);
            resetUnitTurnStatus(draft.playerArmy);
            resetUnitTurnStatus(draft.opponentArmy);
            draft.powerfulWeaponChoice = selectRandomWeapon(powerfulWeapons)
            draft.currentScreen = "weaponSelectionScreen";
          }
    });
    
    return stateObj
}

  // Usage

function updateState(stateObj) {
    if (stateObj.currentScreen === "normalScreen") {
        stateObj = checkForDeath(stateObj)
        stateObj = updateGrid(stateObj)
    }
    state = {...stateObj}
    renderScreen(stateObj)
    return state;
}

updateState(state)





async function EnemiesMove(stateObj) {
    for (let i = 0; i < stateObj.opponentArmy.length; i++) {
        const enemy = stateObj.opponentArmy[i];
        stateObj = await moveEnemy(stateObj, enemy);
        stateObj = updateState(stateObj);
        
        stateObj = await enemyAttack(stateObj, enemy);
        stateObj = updateState(stateObj);
        
        // If you want to pause briefly between each enemy's actions:
        await new Promise(resolve => setTimeout(resolve, 300)); // 500ms delay
    }
    return stateObj;
}

async function moveEnemy(stateObj, enemy) {
    return immer.produce(stateObj, draft => {
        const currentEnemy = draft.opponentArmy.find(e => e.id === enemy.id);
        moveEnemyUnit(draft, currentEnemy)
        updateGrid(draft);
    });
}

async function enemyAttack(stateObj, enemy) {
    const currentEnemy = stateObj.opponentArmy.find(e => e.id === enemy.id);
    const attackInfo = findTargetForAttack(stateObj, currentEnemy);
    if (attackInfo) {
        const attackerSquare = currentEnemy.currentSquare;
        const targetSquare = attackInfo.target.currentSquare;

        // Determine if the attack hits
        const distance = chebyshevDistance(attackerSquare, targetSquare);
        const hitRoll = Math.random();
        const markBuff = attackInfo.target.mark * 0.1;
        const stunnedPenalty = currentEnemy.accuracy * 0.1;
        const distanceModifier = ((distance - 1) * attackInfo.attack.accuracyModifier);
        const threshold = distanceModifier + stunnedPenalty - markBuff;
        const hit = hitRoll > threshold;

        // Animate the attack
        await animateAttack(attackerSquare, targetSquare, hit, stateObj.gridSize);

        if (hit) {
            stateObj = await executeEnemyAttack(stateObj, currentEnemy, attackInfo.target, attackInfo.attack);
        }
    }
    updateGrid(stateObj);
    return stateObj;
}


//maybe split into two functions?
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

function moveTowardsClosestFellow(draft, enemy) {
    let closestPlayer = null;
    let minDistance = Infinity;

    draft.opponentArmy.forEach(player => {
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

function moveTowardsLeader(draft, enemy) {
    let closestPlayer = null;
    let minDistance = Infinity;
    const leader = draft.opponentArmy.find(unit => unit.leader === true)

    if (leader) {
        minDistance = chebyshevDistance(enemy.currentSquare, leader.currentSquare)
        closestPlayer = leader
    } else {
        draft.opponentArmy.forEach(player => {
            const distance = chebyshevDistance(enemy.currentSquare, player.currentSquare);
            if (distance < minDistance) {
                minDistance = distance;
                closestPlayer = player;
            }
        });
    }

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
            //find closest distance for each player
            const distance = chebyshevDistance(move, player.currentSquare);
            //if player is closer than any other, make that the new minimum distance
            if (distance < minDistance) {
                minDistance = distance;
            }
        });
        //if that new minimum distance is larger than the established best move, make this the new best move
        if (minDistance > maxMinDistance) {
            maxMinDistance = minDistance;
            bestMove = move;
        }
    });

    enemy.currentSquare = bestMove;
}

function moveAwayFromAllUnits(draft, enemy) {
    const possibleMoves = getPossibleMoves(draft, enemy);
    let bestMove = enemy.currentSquare;
    let maxMinDistance = 0;

    possibleMoves.forEach(move => {
        let minDistance = Infinity;

        // Find the closest distance for each player unit
        draft.playerArmy.forEach(player => {
            const distance = chebyshevDistance(move, player.currentSquare);
            if (distance < minDistance) {
                minDistance = distance;
            }
        });

        // Find the closest distance for each opponent unit, excluding the current enemy
        draft.opponentArmy.forEach(opponent => {
            if (opponent.id !== enemy.id) {
                const distance = chebyshevDistance(move, opponent.currentSquare);
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
        });

        // If that new minimum distance is larger than the established best move, make this the new best move
        if (minDistance > maxMinDistance) {
            maxMinDistance = minDistance;
            bestMove = move;
        }
    });

    enemy.currentSquare = bestMove;
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
            unit.attacks.forEach(attack => {
                if (attack.buff) {
                    const buffableSquares = getBuffableSquares(unit, attack, draft);
                    draft.buffableSquares.push(...buffableSquares);
                } else {
                    const enemySquares = attackRangeSquares.filter(square => 
                        square >= 0 && square < draft.grid.length && 
                        draft.opponentArmy.some(enemy => enemy.currentSquare === square)
                    );
                    draft.attackRangeSquares.push(...enemySquares);
                }
            });
        }
    });
}

function renderArmySelectionScreen(stateObj) {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = '';

    const pointsDiv = document.createElement('div');
    pointsDiv.id = 'points-tracker';
    pointsDiv.className = 'points-tracker';
    pointsDiv.textContent = `Total Points: ${stateObj.selectedArmyPoints}/${stateObj.maxArmyPoints}`;
    appDiv.appendChild(pointsDiv);

    const unitSelectionDiv = document.createElement('div');
    unitSelectionDiv.className = 'unit-selection-container';

    const unitClasses = [BasicWarrior, Samurai, Shotgunner, minigunWarrior, speederBike, stunner, explosive, Lieutenant];

    unitClasses.forEach(UnitClass => {
        const unit = new UnitClass(true);
        const unitDiv = createUnitSelectionDiv(unit, stateObj);
        unitSelectionDiv.appendChild(unitDiv);
    });

    appDiv.appendChild(unitSelectionDiv);

    const startGameButton = createStartGameButton(stateObj);
    appDiv.appendChild(startGameButton);
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

