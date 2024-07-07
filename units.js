
class BasicWarrior {
    constructor(isPlayerOwned = true, unitCurrentSquare = 0, color = "black", id=0) {
        this.type = 'warrior';
        this.health = 5;
        this.movementSquares = 1; 
        this.playerOwned = isPlayerOwned;
        this.currentSquare = unitCurrentSquare;
        this.color = color;
        this.unitMovedThisTurn = false;
        this.unitAttackedThisTurn = false;
        this.moveTowardsClosestEnemy = false;
        this.id = id
        this.img = 'img/rifleman.png',

        this.attack1 = {
            range: 4,
            attack: 2,
            name: "Rifle Shot - 2",
            distanceAccuracyModifier: 0.1,  
            execute: (stateObj, targetIndex, distance) => {
                return immer.produce(stateObj, draft => {
                    const targetUnit = draft.opponentArmy.find(unit => unit.currentSquare === targetIndex);
                    if (targetUnit) {
                        const hitRoll = Math.random()
                        const threshold = (distance-1) * this.attack1.distanceAccuracyModifier
                        console.log("hit roll was " + hitRoll + "and threshold is " + threshold)
                        if (hitRoll > (threshold)) {
                            targetUnit.health -= this.attack1.attack;
                            this.unitAttackedThisTurn = true;
                        }
                        
                    }
                });
            }
        };

        this.attack2 = {
            range: 5, 
            attack: 1,
            name: "Distant Shot - 1", 
            distanceAccuracyModifier: 0.05,
            execute: (stateObj, targetIndex, distance) => {
                stateObj = immer.produce(stateObj, draft => {
                    const targetUnit = draft.opponentArmy.find(unit => unit.currentSquare === targetIndex);
                    if (targetUnit) {
                        const hitRoll = Math.random()
                        const threshold = (distance-1) * this.attack2.distanceAccuracyModifier
                        console.log("hit roll was " + hitRoll + "and threshold is " + threshold)
                        if (hitRoll > (threshold)) {
                            targetUnit.health -= this.attack2.attack;
                            this.unitAttackedThisTurn = true;
                        }
                        
                    }
                });
                return stateObj
            }
        };
    }

    whenClicked(stateObj) {
        if (!this.playerOwned || (this.unitMovedThisTurn && this.unitAttackedThisTurn)) return stateObj;

        let newState = immer.produce(stateObj, draft => {
            const { movableSquares, attackRangeSquares1, attackRangeSquares2  } = this.getMovableSquares(stateObj.gridSize);

            if (!this.unitMovedThisTurn) {
                draft.movableSquares = movableSquares.filter(square => {
                    return square >= 0 && square < draft.grid.length && draft.grid[square] === 0;
                });
            }

            if (!this.unitAttackedThisTurn) {
                draft.attackRangeSquares1 = attackRangeSquares1.filter(square => {
                    return square >= 0 && square < draft.grid.length && draft.opponentArmy.some(unit => unit.currentSquare === square);
                });
                draft.attackRangeSquares2 = attackRangeSquares2.filter(square => {
                    return square >= 0 && square < draft.grid.length && draft.opponentArmy.some(unit => unit.currentSquare === square);
                });
            }

        });

        if (this.unitMovedThisTurn && (newState.attackRangeSquares1.length === 0 && newState.attackRangeSquares2.length === 0)) {
            return stateObj
        } else {
            return newState
        }
    }

    getMovableSquares(gridSize) {
        const movableSquares = new Set();
        const attackRangeSquares1 = new Set();
        const attackRangeSquares2 = new Set();
        const currentRow = Math.floor(this.currentSquare / gridSize);
        const currentCol = this.currentSquare % gridSize;

        // Check for movement range
        for (let rowOffset = -this.movementSquares; rowOffset <= this.movementSquares; rowOffset++) {
            for (let colOffset = -this.movementSquares; colOffset <= this.movementSquares; colOffset++) {
                const newRow = currentRow + rowOffset;
                const newCol = currentCol + colOffset;
                
                if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                    const distance = Math.max(Math.abs(rowOffset), Math.abs(colOffset));
                    if (distance <= this.movementSquares && distance > 0) {
                        movableSquares.add(newRow * gridSize + newCol);
                    }
                }
            }
        }

        // Check for attack range
        for (let rowOffset = -this.attack1.range; rowOffset <= this.attack1.range; rowOffset++) {
            for (let colOffset = -this.attack1.range; colOffset <= this.attack1.range; colOffset++) {
                const newRow = currentRow + rowOffset;
                const newCol = currentCol + colOffset;
                
                if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                    const distance = Math.max(Math.abs(rowOffset), Math.abs(colOffset));
                    if (distance <= this.attack1.range && distance > 0) {
                        attackRangeSquares1.add(newRow * gridSize + newCol);
                    }
                }
            }
        }

        for (let rowOffset = -this.attack2.range; rowOffset <= this.attack2.range; rowOffset++) {
            for (let colOffset = -this.attack2.range; colOffset <= this.attack2.range; colOffset++) {
                const newRow = currentRow + rowOffset;
                const newCol = currentCol + colOffset;
                
                if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                    const distance = Math.max(Math.abs(rowOffset), Math.abs(colOffset));
                    if (distance <= this.attack2.range && distance > 0) {
                        attackRangeSquares2.add(newRow * gridSize + newCol);
                    }
                }
            }
        }

        return { 
            movableSquares: Array.from(movableSquares), 
            attackRangeSquares1: Array.from(attackRangeSquares1),
            attackRangeSquares2: Array.from(attackRangeSquares2) 
        };
    }
}

class closeUpWarrior extends BasicWarrior {
    constructor(isPlayerOwned = true, unitCurrentSquare = 0, color = "red", id = 1) {
        super(isPlayerOwned, unitCurrentSquare, color, id);
        this.type = 'advancedWarrior';
        this.health = 3;
        this.movementSquares = 2;
        this.moveTowardsClosestEnemy = true;
        this.img = 'img/shotgun.png',

        this.attack1 = {
            range: 4,
            attack: 2,
            name: "Rifle Shot - 2",
            distanceAccuracyModifier: 0.1,
            execute: (stateObj, targetIndex, distance) => {
                return immer.produce(stateObj, draft => {
                    const targetUnit = draft.opponentArmy.find(unit => unit.currentSquare === targetIndex);
                    if (targetUnit) {
                        const hitRoll = Math.random()
                        const threshold = (distance-1) * this.attack1.distanceAccuracyModifier
                        console.log("hit roll was " + hitRoll + "and threshold is " + threshold)
                        if (hitRoll > (threshold)) {
                            targetUnit.health -= this.attack1.attack;
                            this.unitAttackedThisTurn = true;
                        }
                        
                    }
                });
            }
        };

        this.attack2 = {
            range: 2,
            attack: 5,
            distanceAccuracyModifier: 0.3,
            name: "Shotgun Blast - 5",
            execute: (stateObj, targetIndex, distance) => {
                stateObj = immer.produce(stateObj, draft => {
                    const targetUnit = draft.opponentArmy.find(unit => unit.currentSquare === targetIndex);
                    if (targetUnit) {
                        const hitRoll = Math.random()
                        const threshold = (distance-1) * this.attack2.distanceAccuracyModifier
                        console.log("hit roll was " + hitRoll + "and threshold is " + threshold)
                        if (hitRoll > (threshold)) {
                            targetUnit.health -= this.attack2.attack;
                            this.unitAttackedThisTurn = true;
                        }
                        
                    }
                });
                return stateObj;
            }
        };
    }
}

const playerWarrior1 = new BasicWarrior(true, 2, "green", 0);
const playerWarrior2 = new closeUpWarrior(true, 11, "blue", 1);
const playerWarrior3 = new closeUpWarrior(true, 13, "blue", 2);

const opponentWarrior1 = new BasicWarrior(false, 41, "red", 3);
const opponentWarrior2 = new BasicWarrior(false, 43, "red", 4);
const opponentWarrior3 = new BasicWarrior(false, 45, "red", 5);

