// Hand-picked gradient presets offered alongside the auto-extracted palette.

export interface GradientPreset {
  name: string;
  from: string;
  to: string;
  angle: number;
}

export const PRESETS: readonly GradientPreset[] = [
  { name: "Midnight", from: "#5365d8", to: "#252a45", angle: 135 },
  { name: "Ember", from: "#f0975a", to: "#a92f67", angle: 135 },
  { name: "Lagoon", from: "#25b8aa", to: "#10313a", angle: 145 },
  { name: "Linen", from: "#ebe8df", to: "#aba493", angle: 135 },
  { name: "Graphite", from: "#24252b", to: "#50515c", angle: 145 },
  { name: "Ultraviolet", from: "#8a5cf5", to: "#34266f", angle: 125 },
];
