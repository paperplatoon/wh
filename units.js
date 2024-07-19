

class Samurai extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.name = "Samurai"
        this.race = "samuraiArmy"
        this.health = 5;
        this.maxHealth = 5;
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
                execute: async (stateObj, targetIndex, attack) => {
                    const userIndex = (this.playerOwned) ? stateObj.playerArmy.indexOf(this) : stateObj.opponentArmy.indexOf(this)
                    stateObj = await applyMark(stateObj, userIndex, attack.mark, !this.playerOwned)
                    stateObj = await applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage.  Increase evasiveness by + " + (-this.mark) + ". High accuracy. Medium range"
                    return textString
                }
            },
            {
                name: "Tracking Shot - 2",
                range: 6,
                accuracyModifier: 0.05,
                damage: 2,
                mark: -1,
                execute: async (stateObj, targetIndex, attack) => {
                    const userIndex = (this.playerOwned) ? stateObj.playerArmy.indexOf(this) : stateObj.opponentArmy.indexOf(this)
                    stateObj = await applyMark(stateObj, userIndex, attack.mark, !this.playerOwned)
                    stateObj = await applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage.  Increase evasiveness by + " + (-this.mark) + ". Very high accuracy. Medium range"
                    return textString
                }
            },
        ];
    }
}

class katana extends BasicWarrior {
    constructor(isPlayerOwned = true, id = 0, color="white", unitCurrentSquare = 1) {
        super(isPlayerOwned, id, color, unitCurrentSquare);
        this.name = "Katana Samurai"
        this.race = "samuraiArmy"
        this.health = 5;
        this.maxHealth = 5;
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
                execute: async (stateObj, targetIndex, attack) => {
                    const userIndex = (this.playerOwned) ? stateObj.playerArmy.indexOf(this) : stateObj.opponentArmy.indexOf(this)
                    stateObj = await applyMark(stateObj, userIndex, attack.mark, !this.playerOwned)
                    stateObj = await applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage.  Increase evasiveness by + " + (-this.mark) + ". High accuracy. Medium range"
                    return textString
                }
            },
            {
                name: "Tracking Shot - 2",
                range: 6,
                accuracyModifier: 0.05,
                damage: 2,
                mark: -1,
                execute: async (stateObj, targetIndex, attack) => {
                    const userIndex = (this.playerOwned) ? stateObj.playerArmy.indexOf(this) : stateObj.opponentArmy.indexOf(this)
                    stateObj = await applyMark(stateObj, userIndex, attack.mark, !this.playerOwned)
                    stateObj = await applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
                    return stateObj
                },
                text: function() {
                    let textString = "Deal " + this.damage + " damage.  Increase evasiveness by + " + (-this.mark) + ". Very high accuracy. Medium range"
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
const opponentWarrior4 = new BasicWarrior(false, 7, "red", opponentLocations[3]);

let opponentArray = [opponentWarrior1, opponentWarrior2, opponentWarrior3, opponentWarrior4]
opponentArray = [opponentWarrior1]

const powerfulWeapons = [
    {
      name: "Plasma Cannon",
      range: 5,
      accuracyModifier: 0.05,
      damage: 4,
      execute: async (stateObj, targetIndex, attack) => {
        stateObj = await applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
        return stateObj;
      },
      text: function() {
        "Deal 4 damage. Very high accuracy. Long range"
      }
    },
    {
      name: "Railgun",
      range: 6,
      accuracyModifier: 0.1,
      damage: 5,
      execute: async (stateObj, targetIndex, attack) => {
        stateObj = await applyDamage(stateObj, targetIndex, attack, this.currentSquare, this.playerOwned);
        return stateObj;
      },
      text: function() {
        "Deal 5 damage. High accuracy. Very long range"
      },
    },
    // Add more powerful weapons here
  ];

  

