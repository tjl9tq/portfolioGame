import { KAPLAYCtx, GameObj } from "kaplay";
import k from "./kaplayContext";
import { MapObjectLayer } from "./types";
import { dialogueData } from "./constants";

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
    if (interaction.name) {
      map.add([
        k.area({
          shape: new k.Rect(k.vec2(0), interaction.width, interaction.height),
        }),
        k.body({ isStatic: true }),
        k.pos(interaction.x, interaction.y),
        interaction.name,
      ]);
      const label = k.make([
        k.rect(19, 5),
        k.pos(interaction.x, interaction.y - 10),
        k.outline(0.3),
        k.Color.WHITE,
        k.animate(),
      ]);
      const text = k.make([
        k.text(interaction.name, {
          size: 3,
          transform: { color: k.Color.BLACK },
        }),
        k.animate(),
      ]);
      const arrow = k.make([
        k.text(">", {
          size: 7,
          transform: { color: k.Color.BLACK, angle: 90 },
        }),
        k.animate(),
      ]);
      label.animate(
        "pos",
        [
          k.vec2(interaction.x - 1, interaction.y - 8),
          k.vec2(interaction.x - 1, interaction.y - 12),
          k.vec2(interaction.x - 1, interaction.y - 8),
        ],
        { duration: 3 },
      ),
        text.animate(
          "pos",
          [
            k.vec2(interaction.x, interaction.y - 7),
            k.vec2(interaction.x, interaction.y - 11),
            k.vec2(interaction.x, interaction.y - 7),
          ],
          { duration: 3 },
        );
      arrow.animate(
        "pos",
        [
          k.vec2(interaction.x + 6, interaction.y - 4),
          k.vec2(interaction.x + 6, interaction.y - 8),
          k.vec2(interaction.x + 6, interaction.y - 4),
        ],
        { duration: 3 },
      );

      map.add(label);
      map.add(text);
      map.add(arrow);
      player.onCollide(interaction.name, () => {
        player.isInDialogue = true;
        displayDialogue(
          dialogueData[interaction.name] ?? "default",
          () => (player.isInDialogue = false),
        );
      });
    }
  }
};
