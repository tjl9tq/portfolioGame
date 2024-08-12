import { scaleFactor } from "./constants";
import k from "./kaplayContext";
import { drawCollisions, drawInteractions, setCamScale } from "./utils";

k.loadSprite("spritesheet", "./spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "idle-down": 964,
    "walk-down": { from: 964, to: 967, loop: true, speed: 8 },
    "idle-side": 1003,
    "walk-side": { from: 1003, to: 1006, loop: true, speed: 8 },
    "idle-up": 1042,
    "walk-up": { from: 1042, to: 1045, loop: true, speed: 8 },
    "attack-down": 1120,
    "attack-side": 1121,
    "attack-up": 1122,
    "slime-idle-down": 858,
    "slime-idle-side": 860,
    "slime-idle-up": 897,
    "slime-move-down": { from: 858, to: 859, loop: true, speed: 4 },
    "slime-move-side": { from: 860, to: 861, loop: true, speed: 4 },
    "slime-move-up": { from: 897, to: 898, loop: true, speed: 4 },
  },
});

k.loadSprite("map", "./map.png");

k.setBackground(k.Color.fromHex("#3495eb"));

k.scene("main", async () => {
  const mapData = await fetch("./map.json");
  const mapJSON = await mapData.json();
  const layers = mapJSON.layers;

  const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor)]);

  const player = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area({
      shape: new k.Rect(k.vec2(0, 3), 10, 10),
    }),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(scaleFactor),
    {
      speed: 250,
      direction: "down",
      isInDialogue: false,
      attacking: false,
      cooldown: false,
      health: 8,
    },
    "player",
  ]);

  for (const layer of layers) {
    if (layer.name === "objectCollision") {
      drawCollisions(map, layer);
    }
    if (layer.name === "spawnpoint") {
      for (const entity of layer.objects) {
        if (entity.name === "player") {
          player.pos = k.vec2(
            (map.pos.x + entity.x) * scaleFactor,
            (map.pos.y + entity.y) * scaleFactor,
          );
          k.add(player);
        }
      }
    }
    if (layer.name === "interactions") {
      drawInteractions(map, layer, player);
    }
  }

  console.log(k.center());

  // const box = k.make([
  //   k.rect(300, 400),
  //   k.color(255, 255, 255),
  //   k.outline(4),
  //   k.anchor("center"),
  //   k.pos(k.center()),
  // ]);

  // k.add(box);

  setCamScale(k);

  k.onResize(() => {
    setCamScale(k);
  });

  k.onUpdate(() => {
    k.camPos(player.pos.x, player.pos.y + 100);
    if (player.attacking) {
      if (player.direction === "right" || player.direction === "left") {
        player.play("attack-side");
      } else {
        player.play(`attack-${player.direction}`);
      }
    }
  });

  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== "left" || player.isInDialogue) return;

    const worldMousePos = k.toWorld(k.mousePos());
    player.moveTo(worldMousePos, player.speed);

    const mouseAngle = player.pos.angle(worldMousePos);

    const lowerBound = 50;
    const upperBound = 125;

    if (
      mouseAngle > lowerBound &&
      mouseAngle < upperBound &&
      player.getCurAnim()?.name !== "walk-up"
    ) {
      player.play("walk-up");
      player.direction = "up";
      return;
    }

    if (
      mouseAngle < -lowerBound &&
      mouseAngle > -upperBound &&
      player.getCurAnim()?.name !== "walk-down"
    ) {
      player.play("walk-down");
      player.direction = "down";
      return;
    }

    if (Math.abs(mouseAngle) > upperBound) {
      player.flipX = false;
      if (player.getCurAnim()?.name !== "walk-side") {
        player.play("walk-side");
        player.direction = "right";
      }
    }

    if (Math.abs(mouseAngle) < lowerBound) {
      player.flipX = true;
      if (player.getCurAnim()?.name !== "walk-side") {
        player.play("walk-side");
        player.direction = "left";
      }
    }
  });

  function stopAnims() {
    if (player.direction === "down") {
      player.play("idle-down");
      return;
    }
    if (player.direction === "up") {
      player.play("idle-up");
      return;
    }

    player.play("idle-side");
  }

  k.onMouseRelease(stopAnims);

  k.onKeyRelease(stopAnims);

  k.onKeyDown((key) => {
    if (player.attacking) return;
    const directions = ["right", "left", "up", "down"];
    const keyMap = [
      k.isKeyDown("right"),
      k.isKeyDown("left"),
      k.isKeyDown("up"),
      k.isKeyDown("down"),
    ];

    let nbOfKeyPressed = 0;
    for (const key of keyMap) {
      if (key) {
        nbOfKeyPressed++;
      }
    }

    if (key === "z") {
      if (player.attacking || player.cooldown) return;
      player.attacking = true;
      const getHitboxPosition = () => {
        switch (player.direction) {
          case "left":
            return {
              x: player.pos.x - player.width * 0.5 * scaleFactor,
              y: player.pos.y,
            };
          case "right":
            return {
              x: player.pos.x + player.width * 0.5 * scaleFactor,
              y: player.pos.y,
            };
          case "up":
            return {
              x: player.pos.x,
              y: player.pos.y - player.width * 0.5 * scaleFactor,
            };
          case "down":
            return {
              x: player.pos.x,
              y: player.pos.y + player.width * 0.5 * scaleFactor,
            };
          default:
            return {
              x: player.pos.x - player.width * 0.5 * scaleFactor,
              y: player.pos.y,
            };
        }
      };
      const getHitboxShape = () => {
        if (player.direction === "up" || player.direction === "down")
          return new k.Rect(k.vec2(0), player.width * 3, player.height * 2);
        if (player.direction === "left" || player.direction === "right")
          return new k.Rect(k.vec2(0), player.width * 2, player.height * 3);
      };

      const hitboxPos = getHitboxPosition();
      const hitboxShape = getHitboxShape();
      const hitbox = k.make([
        k.area({
          shape: hitboxShape,
        }),
        k.pos(hitboxPos.x, hitboxPos.y),
        k.anchor("center"),
        "playerAttack",
      ]);
      k.add(hitbox);
      setTimeout(() => {
        k.destroy(hitbox);
        player.attacking = false;
        stopAnims();
        player.cooldown = true;
        setTimeout(() => {
          player.cooldown = false;
        }, 500);
      }, 250);
    }

    if (!directions.includes(key)) return;

    if (nbOfKeyPressed > 1 || player.attacking) {
      stopAnims();
      return;
    }

    if (player.isInDialogue) return;
    if (keyMap[0]) {
      player.flipX = false;
      if (player.getCurAnim()?.name !== "walk-side") {
        player.play("walk-side");
      }
      player.direction = "right";
      player.move(player.speed, 0);
      return;
    }

    if (keyMap[1]) {
      player.flipX = true;
      if (player.getCurAnim()?.name !== "walk-side") player.play("walk-side");
      player.direction = "left";
      player.move(-player.speed, 0);
      return;
    }

    if (keyMap[2]) {
      if (player.getCurAnim()?.name !== "walk-up") player.play("walk-up");
      player.direction = "up";
      player.move(0, -player.speed);
      return;
    }

    if (keyMap[3]) {
      if (player.getCurAnim()?.name !== "walk-down") player.play("walk-down");
      player.direction = "down";
      player.move(0, player.speed);
    }
  });
});

k.go("main");
