import { scaleFactor } from "../constants";
import k from "../kaplayContext";

export const generatePlayer = () => {
  return [
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
  ];
};
