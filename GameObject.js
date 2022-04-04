class GameObject {
  constructor(config) {
    this.id = null;
    this.isMounted = false;

    this.x = config.x || 0;
    this.y = config.y || 0;
    this.direction = config.direction || "down";
    this.sprite = new Sprite({
      gameObject: this,
      src: config.src || "assets/images/characters/sprite01.png",
    });

    this.behaviorLoop = config.behaviorLoop || 0;
    this.behaviorLoopIndex = 0;

    this.talking = config.talking || [];
  }

  mount(map) {
    console.log("mounting!");
    this.isMounted = true;
    map.addWall(this.x, this.y);

    setTimeout(() => {
      this.doBehaviorEvent(map);
    }, 10);
  }

  update() {}

  async doBehaviorEvent(map) {
    //Don't do anything if there is a more important cutscene or I don't have config to do anything
    //anyway.
    if (map.isCutscenePlaying || this.behaviorLoop.length === 0) {
      return;
    }

    let eventConfig = this.behaviorLoop[this.behaviorLoopIndex];
    eventConfig.who = this.id;

    const eventHandler = new OverworldEvent({ map, event: eventConfig });
    await eventHandler.init();

    //Setting the next event to fire
    this.behaviorLoopIndex += 1;
    if (this.behaviorLoopIndex === this.behaviorLoop.length) {
      this.behaviorLoopIndex = 0;
    }

    //Do it again!
    this.doBehaviorEvent(map);
  }
}
// //This is the class for the user to pick an apple
class PickApple extends GameObject {
  constructor(config) {
    super(config);
    this.sprite = new Sprite({
      gameObject: this,
      src: "/assets/images/food/test3.png",
      animations: {
        "used-down": [[0.5, 1]],
        "unused-down": [[0, 0.5]],
      },
      currentAnimation: "unused-down",
    });
    this.storyFlag = config.storyFlag;
    this.fruits = config.fruits;
    this.talking = [
      {
        events: [
          { type: "textMessage", text: "Approaching an apple..." },
          { type: "addStoryFlag", flag: this.storyFlag },
          { type: "craftingMenu", fruits: this.fruits },
        ],
      },
      {
        required: [this.storyFlag],
        events: [{ type: "textMessage", text: "You have already used this." }],
      },
      
    ];
  }
  update() {
   this.sprite.currentAnimation = playerState.storyFlags[this.storyFlag]
    ? "used-down"
    : "unused-down";
  }
}
//This is the class for the user to pick a srawberry

class PickStrawberry extends GameObject {
  constructor(config) {
    super(config);
    this.sprite = new Sprite({
      gameObject: this,
      src: "/assets/images/food/Strawberry.png",
      animations: {
        "used-down": [[0, 0]],
        "unused-down" : [ [1,0] ],
      },
      currentAnimation: "used-down",
    });
    this.storyFlag = config.storyFlag;
    this.fruits = config.fruits;

    this.talking = [
      {
        required: [this.storyFlag],
        events: [{ type: "textMessage", text: "You have already used this." }],
      },
      {
        events: [
          { type: "textMessage", text: "Approaching a Strawberry..." },
          { type: "craftingMenu", fruits: this.fruits },
          { type: "addStoryFlag", flag: this.storyFlag },
        ],
      },
    ];
  }
  update() {
    this.sprite.currentAnimation = playerState.storyFlags[this.storyFlag]
    ? "used-down"
    : "unused-down";
  }
}

// =======================================

class Person extends GameObject {
  constructor(config) {
    super(config);
    this.movingProgressRemaining = 0;

    this.isPlayerControlled = config.isPlayerControlled || false;

    this.directionUpdate = {
      up: ["y", -1],
      down: ["y", 1],
      left: ["x", -1],
      right: ["x", 1],
    };
  }

  update(state) {
    this.updatePosition();
    this.updateSprite(state);

    if (
      this.isPlayerControlled &&
      this.movingProgressRemaining === 0 &&
      state.arrow
    ) {
      this.direction = state.arrow;
      this.movingProgressRemaining = 16;
    }
  }
  startBehavior(state, behavior) {
    //Set character direction to whatever behavior has
    this.direction = behavior.direction;

    if (behavior.type === "walk") {
      //Stop here if space is not free
      // if (state.map.isSpaceTaken(this.x, this.y, this.direction)) {
      //   behavior.retry &&
      //     setTimeout(() => {
      //       this.startBehavior(state, behavior);
      //     }, 10);
      //   return;
    }

    //Ready to walk!
    // state.map.moveWall(this.x, this.y, this.direction);
    this.movingProgressRemaining = 16;
    // this.updateSprite(state);
    if (behavior.type === "stand") {
      setTimeout(() => {
        utils.emitEvent("PersonStandComplete", {
          whoId: this.id,
        });
      }, behavior.time);
    }
  }

  updatePosition() {
    if (this.movingProgressRemaining > 0) {
      const [property, change] = this.directionUpdate[this.direction];
      this[property] += change;
      this.movingProgressRemaining -= 1;

      if (this.movingProgressRemaining === 0) {
        //We finished the walk!
        utils.emitEvent("PersonWalkingComplete", {
          whoId: this.id,
        });
      }
    }
  }

  updateSprite(state) {
    if (
      this.isPlayerControlled &&
      this.movingProgressRemaining === 0 &&
      !state.arrow
    ) {
      this.sprite.setAnimation("idle-" + this.direction);
      return;
    }
    if (this.movingProgressRemaining > 0) {
      this.sprite.setAnimation("walk-" + this.direction);
    }
  }
}
