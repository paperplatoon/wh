
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
                effects: [
                    { type: 'damage', amount: 2, accuracyModifier: 0.15 }
                ]
            },
            {
                name: "Aimed Shot - 1",
                range: 6,
                effects: [
                    { type: 'damage', amount: 1, accuracyModifier: 0.1 }
                ]
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
                range: 4,
                effects: [
                    { type: 'damage', amount: 1, accuracyModifier: 0.1 }
                ]
            },
            {
                name: "Shotgun Blast - 4",
                range: 3,
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
                name: "Aim Beacon",
                range: 5,
                effects: [
                    { type: 'applyMark', amount: 1 }
                ]
            },
            {
                name: "Minigun - 3",
                range: 4,
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
                    { type: 'damage', amount: 6, accuracyModifier: 0.35 }
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

