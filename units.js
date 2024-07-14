
class BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color = "white", unitCurrentSquare = 0) {
        this.health = 5;
        this.points = 2;
        this.name = "rifleman"
        this.leader = false;
        this.movementSquares = 2;
        this.playerOwned = isPlayerOwned;
        this.color = color;
        this.unitMovedThisTurn = false;
        this.unitAttackedThisTurn = false;
        this.moveTowardsClosestEnemy = false;
        this.currentSquare = unitCurrentSquare;
        this.id = id;
        this.movement = "moveTowardsLeader";
        this.mark = 0;
        this.accuracy=0;
        this.img = 'img/rifleman.png';
        this.attacks = [
            {
                name: "Rifle Shot - 2",
                range: 4,
                accuracyModifier: 0.15,
                damage: 2,
                execute: (stateObj, targetIndex, attack) => {
                    return applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage. Medium accuracy. Long range"
                    return textString
                }
            },
            {
                name: "Aim Dart - 1",
                range: 6,
                accuracyModifier: 0.1,
                damage: 1,
                mark: 1,
                execute: (stateObj, targetIndex, attack) => {
                    stateObj = applyMark(stateObj, targetIndex, attack.mark, this.playerOwned);
                    return applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage. Apply " + this.attacks[i].mark + ".  High accuracy. Long range"
                    return textString
                }
            },
        ];
    }
}

class Samurai extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.name = "Samurai"
        this.health = 5;
        this.color = color;
        this.movementSquares = 2;
        this.leader = false;
        this.points = 3;
        this.movement = "awayFromAll";
        this.moveTowardsClosestEnemy = true;
        this.img = 'img/samurai.png';

        this.attacks = [
            {
                name: "Kunai - 1",
                range: 4,
                accuracyModifier: 0.1,
                damage: 1,
                mark: -2,
                execute: (stateObj, targetIndex, attack) => {
                    const userIndex = (this.playerOwned) ? stateObj.playerArmy.indexOf(this) : stateObj.opponentArmy.indexOf(this)
                    stateObj = applyMark(stateObj, userIndex, attack.mark, !this.playerOwned)
                    return applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage.  Increase evasiveness by + " + (-this.attacks[i].mark) + ". High accuracy. Medium range"
                    return textString
                }
            },
            {
                name: "Tracking Shot - 2",
                range: 6,
                accuracyModifier: 0.05,
                damage: 4,
                mark: -1,
                execute: (stateObj, targetIndex, attack) => {
                    const userIndex = (this.playerOwned) ? stateObj.playerArmy.indexOf(this) : stateObj.opponentArmy.indexOf(this)
                    stateObj = applyMark(stateObj, userIndex, attack.mark, !this.playerOwned)
                    stateObj = applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                    return stateObj
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage.  Increase evasiveness by + " + (-this.attacks[i].mark) + ". Very high accuracy. Medium range"
                    return textString
                }
            },
        ];
    }
}



class closeUpWarrior extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'advancedWarrior';
        this.name = "Shotgunner"
        this.health = 4;
        this.color = color;
        this.movementSquares = 2;
        this.points = 2;
        this.leader = false;
        this.movement = "towardsClosestEnemy";
        this.moveTowardsClosestEnemy = true;
        this.img = 'img/shotgun.png';

        this.attacks = [
            {
                name: "Pistol Shot - 1",
                range: 4,
                accuracyModifier: 0.1,
                damage: 1,
                execute: (stateObj, targetIndex, attack) => {
                    return applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage.  High accuracy. Medium range"
                    return textString
                }
            },
            {
                name: "Shotgun Blast - 4",
                range: 3,
                accuracyModifier: 0.25,
                damage: 4,
                execute: (stateObj, targetIndex, attack) => {
                    return applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage.  Low accuracy. Close range"
                    return textString
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
        this.name = "Minigunner"
        this.leader = false;
        this.health = 8;
        this.color = color;
        this.movementSquares = 1;
        this.points = 4;
        this.moveTowardsClosestEnemy = true;
        this.movement = "towardsClosestEnemy";
        this.img = 'img/minigun.png',

        this.attacks = [
            {
                name: "Aim Beacon",
                range: 6,
                damage: 0,
                mark: 1,
                execute: (stateObj, targetIndex, attack) => {
                    return applyMark(stateObj, targetIndex, attack.mark, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Apply " + this.attacks[i].mark + " mark.  Perfect accuracy. Long range"
                    return textString
                }
            },
            {
                name: "Minigun - 3",
                range: 5,
                accuracyModifier: 0.15,
                damage: 3,
                execute: (stateObj, targetIndex, attack) => {
                    return applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage.  Medium accuracy. Long range"
                    return textString
                }
            },
        ];
    }
}

class speederBike extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'advancedWarrior';
        this.name = "Speeder Bike"
        this.health = 7;
        this.color = color;
        this.movementSquares = 3;
        this.points = 8;
        this.moveTowardsClosestEnemy = true;
        this.leader = false;
        this.movement = "towardsClosestEnemy";
        this.img = 'img/bike.png',

        this.attacks = [
            {
                name: "Front Guns - 5",
                range: 4,
                accuracyModifier: 0.2,
                damage: 5,
                execute: (stateObj, targetIndex, attack) => {
                    return applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage.  Medium-low accuracy. Medium range"
                    return textString
                }
            },
            {
                name: "Splatter - 6",
                range: 1,
                accuracyModifier: 0.15,
                damage: 6,
                execute: (stateObj, targetIndex, attack) => {
                    return applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage.  High accuracy. Must be adjacent"
                    return textString
                }
            },
        ];
    }
}

class stunner extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'advancedWarrior';
        this.name = "Scout"
        this.health = 3;
        this.color = color;
        this.movementSquares = 3;
        this.leader = false;
        this.points = 2;
        this.moveTowardsClosestEnemy = true;
        this.movement = "towardsClosestEnemy";
        this.img = 'img/scout.png',

        this.attacks = [
            {
                name: "Stun Dart",
                range: 4,
                stun: 1,
                accuracyModifier: 0.05,
                damage: 1,
                execute: async (stateObj, targetIndex, attack) => {
                    stateObj = await applyStun(stateObj, targetIndex, attack.stun, this.isPlayerOwned)
                    return applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage. Lower target accuracy by " + this.attacks[i].stun + ". Very High accuracy. Medium range"
                    return textString
                }
            },
            {
                name: "Sword Swing - 4",
                range: 1,
                accuracyModifier: 0.1,
                damage: 4,
                execute: (stateObj, targetIndex, attack) => {
                    return applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage.  High accuracy. Must be adjacent"
                    return textString
                }
            },
        ];
    }
}

class explosive extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'advancedWarrior';
        this.name = "Grenadier"
        this.health = 3;
        this.color = color;
        this.leader = false;
        this.movementSquares = 2;
        this.points = 2;
        this.moveTowardsClosestEnemy = true;
        this.movement = "towardsClosestEnemy";
        this.img = 'img/grenadier.png',

        this.attacks = [
            {
                name: "Frag Grenade",
                range: 4,
                radius: 2,
                damage: 2,
                explosive: true,
                execute: (stateObj, targetIndex, attack) => {
                    return applyAOEdamage(stateObj, targetIndex, attack, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage within " + this.attacks[i].radius + " squares. Perfect accuracy. Medium range"
                    return textString
                }
            },
            {
                name: "Dual Pistols - 2",
                range: 3,
                accuracyModifier: 0.1,
                damage: 2,
                execute: (stateObj, targetIndex, attack) => {
                    return applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage.  High accuracy. Close range"
                    return textString
                }
                
            },
        ];
    }
}

//buffAttack.execute(stateObj, stateObj.targetAllyIndex, buffAttack);

class Lieutenant extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.type = 'Lieutenant';
        this.name = "Lieutenant"
        this.leader = true;
        this.health = 6;
        this.color = color;
        this.movementSquares = 3;
        this.points = 2;
        this.moveTowardsClosestEnemy = true;
        this.movement = "towardsClosestEnemy";
        this.img = 'img/lieutenant.png',

        this.attacks = [
            {
                name: "Inspire",
                range: 3,
                stun: -2,
                buff: true,
                execute: async (stateObj, targetIndex, attack) => {
                    stateObj = await applyStun(stateObj, targetIndex, attack.stun, !this.isPlayerOwned)
                    return stateObj
                },
                text: (i) => {
                    let textString = "Raise ally accuracy by " + (-this.attacks[i].stun) + ".  Perfect accuracy. Close range"
                    return textString
                }
            },
            {
                name: "Huge Sword",
                range: 1,
                accuracyModifier: 0.1,
                damage: 4,
                buff: false,
                execute: (stateObj, targetIndex, attack) => {
                    return applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                },
                text: (i) => {
                    let textString = "Deal " + this.attacks[i].damage + " damage.  Perfect accuracy. Must be adjacent"
                    return textString
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

const playerWarrior1 = new stunner(true, 0, "blue", playerLocations[0]);
const playerWarrior2 = new Lieutenant(true, 1, "blue", playerLocations[1]);
const playerWarrior3 = new minigunWarrior(true, 2, "green", playerLocations[2]);
const playerWarrior4 = new speederBike(true, 3, "gold", playerLocations[3]);

const opponentWarrior1 = new BasicWarrior(false, 4, "red",  opponentLocations[0]);
const opponentWarrior2 = new BasicWarrior(false, 5, "red", opponentLocations[1]);
const opponentWarrior3 = new Lieutenant(false, 6, "red", opponentLocations[2]);
const opponentWarrior4 = new Samurai(false, 7, "red", opponentLocations[3]);

