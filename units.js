class BasicWarrior {
    constructor(isPlayerOwned = true, unitCurrentSquare = 0, color = "black") {
        this.type = 'warrior';
        this.health = 5;
        this.attack = 2;
        this.diceToHit = 3;
        this.movementSquares = 1; 
        this.playerOwned = isPlayerOwned;
        this.currentSquare = unitCurrentSquare;
        this.color = color;
        this.unitMovedThisTurn = false;
        this.unitAttackedThisTurn = false;

        this.attack1 = {
            range: 2,
            attack: 2,  
            execute: (stateObj, targetIndex) => {
                return immer.produce(stateObj, draft => {
                    const targetUnit = draft.opponentArmy.find(unit => unit.currentSquare === targetIndex);
                    if (targetUnit) {
                        targetUnit.health -= this.attack1.attack;
                        this.unitAttackedThisTurn = true;

                        // Check if the target unit is defeated
                        if (targetUnit.health <= 0) {
                            // Remove the defeated unit from the opponent's army
                            const index = draft.opponentArmy.indexOf(targetUnit);
                            if (index > -1) {
                                draft.opponentArmy.splice(index, 1);
                            }
                            // Clear the defeated unit from the grid
                            draft.grid[targetIndex] = 0;
                        }
                    }
                });
            }
        };

        this.attack2 = {
            range: 3, 
            attack: 1, 
            execute: (stateObj, targetIndex) => {
                return immer.produce(stateObj, draft => {
                    const targetUnit = draft.opponentArmy.find(unit => unit.currentSquare === targetIndex);
                    if (targetUnit) {
                        targetUnit.health -= this.attack2.attack;
                        this.unitAttackedThisTurn = true;

                        // Check if the target unit is defeated
                        if (targetUnit.health <= 0) {
                            // Remove the defeated unit from the opponent's army
                            const index = draft.opponentArmy.indexOf(targetUnit);
                            if (index > -1) {
                                draft.opponentArmy.splice(index, 1);
                            }
                            // Clear the defeated unit from the grid
                            draft.grid[targetIndex] = 0;
                        }
                    }
                });
            }
        };
    }

    whenClicked(stateObj) {
        if (!this.playerOwned || (this.unitMovedThisTurn && this.unitAttackedThisTurn)) return stateObj;

        let newState = immer.produce(stateObj, draft => {
            const gridSize = 5; // Assuming a 5x5 grid
            const { movableSquares, attackRangeSquares1, attackRangeSquares2  } = this.getMovableSquares(gridSize);

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

const playerWarrior1 = new BasicWarrior(true, 20, "green");
const playerWarrior2 = new BasicWarrior(true, 3, "green");

const opponentWarrior1 = new BasicWarrior(false, 21, "red");
const opponentWarrior2 = new BasicWarrior(false, 23, "red");

