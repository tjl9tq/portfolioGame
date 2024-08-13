import { KAPLAYCtx, GameObj } from "kaplay";
import k from "./kaplayContext";
import { MapObjectLayer } from "./types";
import { dialogueData, scaleFactor } from "./constants";

export function displayDialogue(text: string, onDisplayEnd: Function) {
  const dialogueUI = document.getElementById("textbox-container");
  const dialogue = document.getElementById("dialogue");

  if (dialogueUI) dialogueUI.style.display = "block";

  let index = 0;
  let currentText = "";
  const intervalRef = setInterval(() => {
    if (index < text.length) {
      currentText += text[index];
      if (dialogue) {
        dialogue.innerHTML = currentText;
      }
      index++;
      return;
    }

    clearInterval(intervalRef);
  }, 3);

  const closeBtn = document.getElementById("close");

  function onCloseBtnClick() {
    onDisplayEnd();
    if (dialogue && dialogueUI) {
      dialogueUI.style.display = "none";
      dialogue.innerHTML = "";
      clearInterval(intervalRef);
      closeBtn?.removeEventListener("click", onCloseBtnClick);
    }
  }

  function onEnterPress(e: KeyboardEvent) {
    if (e.code === "Enter" || e.code === "Escape") {
      onCloseBtnClick();
      removeEventListener("keydown", onEnterPress);
    }
  }

  closeBtn?.addEventListener("click", onCloseBtnClick);
  addEventListener("keydown", onEnterPress);
}

export function setCamScale(k: KAPLAYCtx) {
  const resizeFactor = k.width() / k.height();
  if (resizeFactor < 1) {
    k.camScale(k.vec2(1));
    return;
  }
  k.camScale(k.vec2(1.5));
}

export const drawCollisions = (map: GameObj, layer: MapObjectLayer) => {
  for (const boundary of layer.objects) {
    map.add([
      k.area({
        shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
      }),
      k.body({ isStatic: true }),
      k.pos(boundary.x, boundary.y),
      boundary.name,
    ]);
  }
};

export const drawInteractions = (
  map: GameObj,
  layer: MapObjectLayer,
  player: GameObj,
) => {
  for (const interaction of layer.objects) {
    // TODO: Remove when wardrobe is implemented
    if (interaction.name === "wardrobe") continue;
    if (interaction.name) {
      const xPos = interaction.x * scaleFactor;
      const yPos = interaction.y * scaleFactor;

      map.add([
        k.area({
          shape: new k.Rect(k.vec2(0), interaction.width, interaction.height),
        }),
        k.body({ isStatic: true }),
        k.pos(interaction.x, interaction.y),
        interaction.name,
      ]);

      const label = k.make([
        k.rect(80, 18),
        k.outline(2),
        k.Color.WHITE,
        k.animate(),
      ]);

      const text = k.make([
        k.text(interaction.name, {
          size: 3 * scaleFactor,
          transform: { color: k.Color.BLACK },
        }),
        k.animate(),
      ]);
      const arrow = k.make([
        k.text(">", {
          size: 7 * scaleFactor,
          transform: { color: k.Color.BLACK, angle: 90 },
        }),
        k.animate(),
      ]);
      label.animate(
        "pos",
        [
          k.vec2(xPos - 10, yPos - 35),
          k.vec2(xPos - 10, yPos - 50),
          k.vec2(xPos - 10, yPos - 35),
        ],
        { duration: 3 },
      ),
        text.animate(
          "pos",
          [
            k.vec2(xPos - 5, yPos - 32),
            k.vec2(xPos - 5, yPos - 47),
            k.vec2(xPos - 5, yPos - 32),
          ],
          { duration: 3 },
        );
      arrow.animate(
        "pos",
        [
          k.vec2(xPos + 22, yPos - 20),
          k.vec2(xPos + 22, yPos - 35),
          k.vec2(xPos + 22, yPos - 20),
        ],
        { duration: 3 },
      );
      k.add(label);
      k.add(text);
      k.add(arrow);
      player.onCollide(interaction.name, () => {
        player.isInDialogue = true;
        if (interaction.name !== "wardrobe") {
          displayDialogue(
            dialogueData[interaction.name] ?? "default",
            () => (player.isInDialogue = false),
          );
        }
      });
    }
  }
};

export const loadSpriteSheet = (spriteToUse: number) => {
  k.loadSprite("spritesheet", "./spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    anims: {
      "idle-down": spriteToUse,
      "walk-down": {
        from: spriteToUse,
        to: spriteToUse + 3,
        loop: true,
        speed: 8,
      },
      "idle-side": spriteToUse + 39,
      "walk-side": {
        from: spriteToUse + 39,
        to: spriteToUse + 42,
        loop: true,
        speed: 8,
      },
      "idle-up": spriteToUse + 78,
      "walk-up": {
        from: spriteToUse + 78,
        to: spriteToUse + 81,
        loop: true,
        speed: 8,
      },
      "attack-down": 1120,
      "attack-side": 1121,
      "attack-up": 1122,
      // "slime-idle-down": 858,
      // "slime-idle-side": 860,
      // "slime-idle-up": 897,
      // "slime-move-down": { from: 858, to: 859, loop: true, speed: 4 },
      // "slime-move-side": { from: 860, to: 861, loop: true, speed: 4 },
      // "slime-move-up": { from: 897, to: 898, loop: true, speed: 4 },
    },
  });
};
