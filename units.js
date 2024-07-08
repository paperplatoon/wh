
class BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color = "white", unitCurrentSquare = 0) {
        this.health = 5;
        this.points = 2;
        this.movementSquares = 2;
        this.playerOwned = isPlayerOwned;
        this.color = color;
        this.unitMovedThisTurn = false;
        this.unitAttackedThisTurn = false;
        this.moveTowardsClosestEnemy = false;
        this.currentSquare = unitCurrentSquare;
        this.id = id;
        this.img = 'img/rifleman.png';
        this.attacks = [
            {
                name: "Rifle Shot - 2",
                range: 4,
                effects: [
                    { type: 'damage', amount: 2, accuracyModifier: 0.15 }
                ]
            },
            {
                name: "Aimed Shot - 1",
                range: 4,
                effects: [
                    { type: 'damage', amount: 1, accuracyModifier: 0.1 }
                ]
            },
        ];
    }

    whenClicked(stateObj) {
        if (!this.playerOwned || (this.unitMovedThisTurn && this.unitAttackedThisTurn)) return stateObj;

        return immer.produce(stateObj, draft => {
            const { movableSquares, attackRangeSquares } = this.getActionSquares(stateObj.gridSize);

            if (!this.unitMovedThisTurn) {
                draft.movableSquares = movableSquares.filter(square => 
                    square >= 0 && square < draft.grid.length && draft.grid[square] === 0
                );
            }

            if (!this.unitAttackedThisTurn) {
                draft.attackRangeSquares = attackRangeSquares.filter(square => 
                    square >= 0 && square < draft.grid.length && 
                    draft.opponentArmy.some(unit => unit.currentSquare === square)
                );
            }
        });
    }

    getActionSquares(gridSize) {
        const movableSquares = new Set();
        const attackRangeSquares = new Set();
        const currentRow = Math.floor(this.currentSquare / gridSize);
        const currentCol = this.currentSquare % gridSize;

        this.getSquaresInRange(currentRow, currentCol, this.movementSquares, gridSize, movableSquares);
        this.attacks.forEach(attack => {
            this.getSquaresInRange(currentRow, currentCol, attack.range, gridSize, attackRangeSquares);
        });

        return { 
            movableSquares: Array.from(movableSquares), 
            attackRangeSquares: Array.from(attackRangeSquares)
        };
    }

    getSquaresInRange(currentRow, currentCol, range, gridSize, squaresSet) {
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

    executeAttack(stateObj, attackIndex, targetIndex) {
        const attack = this.attacks[attackIndex];
        if (!attack) return stateObj;

        attack.effects.forEach(effect => { 
        })

        stateObj = immer.produce(stateObj, draft => {
            attack.effects.forEach(effect => {
                this.applyEffect(draft, effect, targetIndex);
            });
            this.unitAttackedThisTurn = true;
        });

        return stateObj
    }

    applyEffect(draft, effect, targetIndex) {
        switch (effect.type) {
            case 'damage':
                this.applyDamage(draft, targetIndex, effect.amount, effect.accuracyModifier);
                break;
            case 'stun':
                this.applyStun(draft, targetIndex, effect.duration);
                break;
            case 'areaEffect':
                this.applyAreaEffect(draft, targetIndex, effect.radius, effect.effect);
                break;
            // Add more effect types as needed
        }
    }

    applyDamage(draft, targetIndex, amount, accuracyModifier) {
        const targetUnit = draft.opponentArmy[targetIndex]
        if (targetUnit) {
            const distance = chebyshevDistance(this.currentSquare, targetUnit.currentSquare);
            const hitRoll = Math.random();
            const threshold = (distance - 1) * accuracyModifier;
            console.log("hitroll is " + Math.round(hitRoll*100)/100 + " and threshold is " + Math.round(threshold*100)/100)
            if (hitRoll > threshold) {
                targetUnit.health -= amount;
            }
        }
    }

    applyStun(draft, targetIndex, duration) {
        const targetUnit = draft.opponentArmy.find(unit => unit.currentSquare === targetIndex);
        if (targetUnit) {
            targetUnit.stunned = duration;
        }
    }

    applyAreaEffect(draft, centerIndex, radius, effect) {
        const affectedSquares = getSquaresInRadius(centerIndex, radius, draft.gridSize);
        affectedSquares.forEach(square => {
            this.applyEffect(draft, effect, square);
        });
    }
}

class closeUpWarrior extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'advancedWarrior';
        this.health = 4;
        this.color = color;
        this.movementSquares = 2;
        this.points = 2;
        this.moveTowardsClosestEnemy = true;
        this.img = 'img/shotgun.png';

        this.attacks = [
            {
                name: "Rifle Shot - 2",
                range: 4,
                effects: [
                    { type: 'damage', amount: 2, accuracyModifier: 0.15 }
                ]
            },
            {
                name: "Shotgun Blast - 4",
                range: 2,
                effects: [
                    { type: 'damage', amount: 4, accuracyModifier: 0.25 }
                ]
            },
        ];
    }
}

//SUPPRESSIVE FIRE ATTACK
class minigunWarrior extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'advancedWarrior';
        this.health = 8;
        this.color = color;
        this.movementSquares = 1;
        this.points = 4;
        this.moveTowardsClosestEnemy = true;
        this.img = 'img/minigun.png',

        this.attacks = [
            {
                name: "Rifle Shot - 2",
                range: 4,
                effects: [
                    { type: 'damage', amount: 2, accuracyModifier: 0.1 }
                ]
            },
            {
                name: "Minigun - 3",
                range: 3,
                effects: [
                    { type: 'damage', amount: 3, accuracyModifier: 0.15 }
                ]
            },
        ];
    }
}

class speederBike extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'advancedWarrior';
        this.health = 7;
        this.color = color;
        this.movementSquares = 3;
        this.points = 8;
        this.moveTowardsClosestEnemy = true;
        this.img = 'img/bike.png',

        this.attacks = [
            {
                name: "Front Guns - 4",
                range: 4,
                effects: [
                    { type: 'damage', amount: 4, accuracyModifier: 0.2 }
                ]
            },
            {
                name: "Splatter - 6",
                range: 1,
                effects: [
                    { type: 'damage', amount: 6, accuracyModifier: 0.15 }
                ]
            },
        ];
    }
}

function getRandomNumbersInRange(x, y, arraySize) {
    const uniqueNumbers = new Set();

    while (uniqueNumbers.size < arraySize) {
        const randomNumber = Math.floor(Math.random() * (y - x + 1)) + x;
        uniqueNumbers.add(randomNumber);
    }

    return Array.from(uniqueNumbers);
}

const playerLocations = getRandomNumbersInRange(0, 16, 4)
const opponentLocations = getRandomNumbersInRange(47, 63, 4)
console.log("player locatios " + playerLocations + " and opponents " + opponentLocations)

const playerWarrior1 = new BasicWarrior(true, 0, "blue", playerLocations[0]);
const playerWarrior2 = new closeUpWarrior(true, 1, "blue", playerLocations[1]);
const playerWarrior3 = new minigunWarrior(true, 2, "green", playerLocations[2]);
const playerWarrior4 = new speederBike(true, 3, "gold", playerLocations[3]);

const opponentWarrior1 = new BasicWarrior(false, 4, "red",  opponentLocations[0]);
const opponentWarrior2 = new BasicWarrior(false, 5, "red", opponentLocations[1]);
const opponentWarrior3 = new BasicWarrior(false, 6, "red", opponentLocations[2]);
const opponentWarrior4 = new BasicWarrior(false, 7, "red", opponentLocations[3]);

