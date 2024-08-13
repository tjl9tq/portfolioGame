import { scaleFactor } from "./constants";
import k from "./kaplayContext";
import {
  drawCollisions,
  drawInteractions,
  loadSpriteSheet,
  setCamScale,
} from "./utils";

let characterSpriteIndex = 7;
const characterSpriteBase = 936;

let spriteToUse = characterSpriteBase + 4 * characterSpriteIndex;

loadSpriteSheet(spriteToUse);

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
      speed: 300,
      direction: "down",
      isInDialogue: false,
      attacking: false,
      cooldown: false,
      health: 8,
    },
    "player",
  ]);

  const wardrobeMenu = k.make([
    k.rect(240, 380),
    k.outline(2),
    k.Color.WHITE,
    k.pos(k.camPos().x - scaleFactor * 50, k.camPos().y),
    k.anchor("center"),
  ]);

  const menuSprite = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.scale(scaleFactor * 3),
    k.pos(0, -30),
    k.anchor("center"),
  ]);

  wardrobeMenu.add(menuSprite);

  wardrobeMenu.add([
    k.text(">", {
      size: 12 * scaleFactor,
      transform: { color: k.Color.BLACK },
    }),
    k.pos(20, 100),
    k.area({
      shape: new k.Rect(k.vec2(0), 30, 30),
    }),
    k.anchor("center"),
    "rightArrow",
  ]);

  wardrobeMenu.add([
    k.text("<", {
      size: 12 * scaleFactor,
      transform: { color: k.Color.BLACK },
    }),
    k.pos(-20, 100),
    k.area({
      shape: new k.Rect(k.vec2(0), 30, 30),
    }),
    k.anchor("center"),
    "leftArrow",
  ]);

  wardrobeMenu.add([
    k.text("x", {
      size: scaleFactor * 8,
      transform: { color: k.Color.BLACK },
    }),
    k.area({
      shape: new k.Rect(k.vec2(0), 30, 30),
    }),
    k.anchor("center"),
    k.pos(100, -170),
    "closeButton",
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

  k.add(wardrobeMenu);

  wardrobeMenu.hidden = true;

  k.onClick("rightArrow", () => {
    if (wardrobeMenu.hidden) return;
    if (characterSpriteIndex === 7) {
      characterSpriteIndex = 0;
    } else {
      characterSpriteIndex += 1;
    }
    loadSpriteSheet(characterSpriteBase + 4 * characterSpriteIndex);
    menuSprite.use(k.sprite("spritesheet", { anim: "idle-down" }));
    let initialAnim = "idle-down";

    if (player.direction === "right" || player.direction === "left") {
      initialAnim = "idle-side";
    } else if (player.direction === "up") {
      initialAnim = "idle-up";
    }
    player.use(k.sprite("spritesheet", { anim: initialAnim }));
  });

  k.onClick("leftArrow", () => {
    if (wardrobeMenu.hidden) return;
    if (characterSpriteIndex === 0) {
      characterSpriteIndex = 7;
    } else {
      characterSpriteIndex -= 1;
    }
    loadSpriteSheet(characterSpriteBase + 4 * characterSpriteIndex);
    menuSprite.use(k.sprite("spritesheet", { anim: "idle-down" }));
    let initialAnim = "idle-down";

    if (player.direction === "right" || player.direction === "left") {
      initialAnim = "idle-side";
    } else if (player.direction === "up") {
      initialAnim = "idle-up";
    }
    player.use(k.sprite("spritesheet", { anim: initialAnim }));
  });

  k.onClick("closeButton", () => {
    if (wardrobeMenu.hidden) return;
    wardrobeMenu.hidden = true;

    setTimeout(() => {
      player.isInDialogue = false;
    }, 500);
  });

  player.onCollide("wardrobe", () => {
    wardrobeMenu.hidden = false;
  });

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
