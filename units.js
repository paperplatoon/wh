
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
        this.mark = 0;
        this.img = 'img/rifleman.png';
        this.attacks = [
            {
                name: "Rifle Shot - 2",
                range: 4,
                accuracyModifier: 0.15,
                damage: 2,
                execute: (stateObj, targetIndex, attack) => {
                    if (this.playerOwned) {
                        return applyDamage(stateObj, targetIndex, attack.damage, attack.accuracyModifier);
                    } else {
                        return applyPlayerDamage(stateObj, targetIndex, this.currentSquare, attack.damage, attack.accuracyModifier)
                    }
                    
                }
            },
            {
                name: "Aimed Shot - 1",
                range: 6,
                accuracyModifier: 0.1,
                damage: 1,
                execute: (stateObj, targetIndex, attack) => {
                    if (this.playerOwned) {
                        return applyDamage(stateObj, targetIndex, attack.damage, attack.accuracyModifier);
                    } else {
                        return applyPlayerDamage(stateObj, targetIndex, this.currentSquare, attack.damage, attack.accuracyModifier)
                    }
                    
                }
            },
        ];
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
                name: "Pistol Shot - 1",
                range: 5,
                accuracyModifier: 0.1,
                damage: 1,
                execute: (stateObj, targetIndex, attack) => {
                    if (this.playerOwned) {
                        return applyDamage(stateObj, targetIndex, attack.damage, attack.accuracyModifier);
                    } else {
                        return applyPlayerDamage(stateObj, targetIndex, this.currentSquare, attack.damage, attack.accuracyModifier)
                    }
                    
                }
            },
            {
                name: "Shotgun Blast - 4",
                range: 3,
                accuracyModifier: 0.25,
                damage: 4,
                execute: (stateObj, targetIndex, attack) => {
                    if (this.playerOwned) {
                        return applyDamage(stateObj, targetIndex, attack.damage, attack.accuracyModifier);
                    } else {
                        return applyPlayerDamage(stateObj, targetIndex, this.currentSquare, attack.damage, attack.accuracyModifier)
                    }
                    
                }
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
                name: "Aim Beacon",
                range: 6,
                damage: 0,
                mark: 1,
                execute: (stateObj, targetIndex, attack) => {
                    if (this.playerOwned) {
                        return applyMark(stateObj, targetIndex, attack.mark, true);
                    } else {
                        return applyMark(stateObj, targetIndex, attack.mark, false);
                    }
                    
                }
            },
            {
                name: "Minigun - 3",
                range: 4,
                accuracyModifier: 0.15,
                damage: 3,
                execute: (stateObj, targetIndex, attack) => {
                    if (this.playerOwned) {
                        return applyDamage(stateObj, targetIndex, attack.damage, attack.accuracyModifier);
                    } else {
                        return applyPlayerDamage(stateObj, targetIndex, this.currentSquare, attack.damage, attack.accuracyModifier)
                    }
                    
                }
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
                accuracyModifier: 0.2,
                damage: 4,
                execute: (stateObj, targetIndex, attack) => {
                    if (this.playerOwned) {
                        return applyDamage(stateObj, targetIndex, attack.damage, attack.accuracyModifier);
                    } else {
                        return applyPlayerDamage(stateObj, targetIndex, this.currentSquare, attack.damage, attack.accuracyModifier)
                    }
                    
                }
            },
            {
                name: "Splatter - 6",
                range: 1,
                accuracyModifier: 0.15,
                damage: 6,
                execute: (stateObj, targetIndex, attack) => {
                    if (this.playerOwned) {
                        return applyDamage(stateObj, targetIndex, attack.damage, attack.accuracyModifier);
                    } else {
                        return applyPlayerDamage(stateObj, targetIndex, this.currentSquare, attack.damage, attack.accuracyModifier)
                    }
                    
                }
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

