import type { RegionId } from "../../data/mockHealth";
import type { FocusRegion, Layer, OrganId } from "./geometry";

export type Camera = {
  /** Focus point in figure units (400 × 1000 space). */
  x: number;
  y: number;
  /** Zoom relative to the "whole body fits the stage" framing. */
  zoom: number;
};

export type Callout = {
  id: string;
  /** Anchor on the figure, in figure units. */
  at: readonly [number, number];
  title: string;
  detail: string;
  organ?: OrganId;
  /** Overview and summary callouts jump to a chapter instead of describing an organ. */
  target?: RegionId;
};

export type Chapter = {
  id: "overview" | RegionId | "summary";
  nav: string;
  kicker: string;
  title: string;
  /** Second line of the title, set in italics. */
  titleAccent: string;
  body: string;
  camera: Camera;
  focus: FocusRegion;
  layers: Layer[];
  callouts: Callout[];
  /** Relative scroll length of the chapter (1 = one viewport). */
  length: number;
};

const REGION_HOTSPOTS: Callout[] = [
  { id: "spot-mind", at: [222, 62], title: "Head & mind", detail: "Focus, rest and the nervous system", target: "head-mind" },
  { id: "spot-heart", at: [216, 276], title: "Chest & heart", detail: "Heart rate, breathing, circulation", target: "chest-heart" },
  { id: "spot-core", at: [232, 420], title: "Core & digestion", detail: "Hydration, meals and energy", target: "core-digestion" },
  { id: "spot-legs", at: [240, 590], title: "Legs & strength", detail: "Steps, muscles and mobility", target: "legs-strength" },
];

export const CHAPTERS: Chapter[] = [
  {
    id: "overview",
    nav: "Overview",
    kicker: "Body atlas · Today",
    title: "Your body,",
    titleAccent: "mapped.",
    body: "Scroll down to move from head to toe. Each region shows the systems behind it and the signals you track there.",
    camera: { x: 200, y: 491, zoom: 1 },
    focus: "body",
    layers: ["organs", "skeleton", "circulation"],
    callouts: REGION_HOTSPOTS,
    length: 1.25,
  },
  {
    id: "head-mind",
    nav: "Mind",
    kicker: "01 · Head & mind",
    title: "Where every",
    titleAccent: "signal begins.",
    body: "Your brain and nervous system read the world and coordinate the rest of your body. Rest, focus and recovery all start here.",
    camera: { x: 200, y: 96, zoom: 3.1 },
    focus: "head-mind",
    layers: ["organs", "skeleton", "nerves", "circulation"],
    callouts: [
      { id: "brain", at: [226, 60], organ: "brain", title: "Brain", detail: "Uses about a fifth of your body's energy at rest." },
      { id: "skull", at: [228, 104], title: "Skull", detail: "Twenty-two bones fused to protect the brain." },
      { id: "brainstem", at: [204, 132], title: "Brainstem", detail: "Keeps breathing and heartbeat running without a thought." },
      { id: "carotid", at: [213, 168], title: "Carotid arteries", detail: "Carry oxygen-rich blood up to the brain." },
    ],
    length: 1.6,
  },
  {
    id: "chest-heart",
    nav: "Heart",
    kicker: "02 · Chest & heart",
    title: "The rhythm",
    titleAccent: "that carries you.",
    body: "Your heart and lungs work as one system, moving oxygen into the blood and out to every cell, minute after minute.",
    camera: { x: 200, y: 262, zoom: 2.15 },
    focus: "chest-heart",
    layers: ["organs", "skeleton", "circulation"],
    callouts: [
      { id: "heart", at: [222, 280], organ: "heart", title: "Heart", detail: "Beats roughly 100,000 times a day." },
      { id: "lungs", at: [240, 236], organ: "lungs", title: "Lungs", detail: "Move around 11,000 litres of air every day." },
      { id: "aorta", at: [224, 236], title: "Aorta", detail: "The body's largest artery leaves the heart here." },
      { id: "ribs", at: [252, 318], title: "Rib cage", detail: "Twelve pairs of ribs shield the heart and lungs." },
    ],
    length: 1.6,
  },
  {
    id: "core-digestion",
    nav: "Core",
    kicker: "03 · Core & digestion",
    title: "Fuel, turned",
    titleAccent: "into energy.",
    body: "Your digestive organs break food down, absorb what you need and keep fluids in balance. Water and regular meals help them work.",
    camera: { x: 200, y: 418, zoom: 2.05 },
    focus: "core-digestion",
    layers: ["organs", "skeleton"],
    callouts: [
      { id: "liver", at: [214, 352], organ: "liver", title: "Liver", detail: "Processes nutrients and filters your blood." },
      { id: "stomach", at: [248, 364], organ: "stomach", title: "Stomach", detail: "Mixes food with acid and enzymes." },
      { id: "kidneys", at: [230, 404], organ: "kidneys", title: "Kidneys", detail: "Filter about 180 litres of fluid a day." },
      { id: "intestines", at: [234, 462], organ: "intestines", title: "Intestines", detail: "Absorb most of the nutrients you eat." },
    ],
    length: 1.6,
  },
  {
    id: "legs-strength",
    nav: "Strength",
    kicker: "04 · Legs & strength",
    title: "Built to",
    titleAccent: "keep you moving.",
    body: "Your largest muscles and longest bones carry you through the day. Every walk and stretch adds up.",
    camera: { x: 206, y: 712, zoom: 1.7 },
    focus: "legs-strength",
    layers: ["muscles", "skeleton", "circulation"],
    callouts: [
      { id: "quadriceps", at: [244, 582], organ: "quadriceps", title: "Quadriceps", detail: "Four muscles that straighten the knee." },
      { id: "knee", at: [238, 692], organ: "knee", title: "Knee", detail: "The largest joint in the body." },
      { id: "calves", at: [254, 772], organ: "calves", title: "Calves", detail: "Squeeze blood back up toward the heart." },
      { id: "feet", at: [250, 936], title: "Feet", detail: "Twenty-six bones in each foot." },
    ],
    length: 1.6,
  },
  {
    id: "summary",
    nav: "Summary",
    kicker: "Today, in balance",
    title: "Your body. Your data.",
    titleAccent: "Your journey.",
    body: "One region needs a little attention today. Pick any area to revisit it.",
    camera: { x: 200, y: 491, zoom: 1 },
    focus: "body",
    layers: ["organs", "skeleton", "circulation", "nerves"],
    callouts: REGION_HOTSPOTS,
    length: 1.25,
  },
];

export const LAYER_LABELS: Record<Layer, string> = {
  organs: "Organs",
  skeleton: "Skeleton",
  muscles: "Muscles",
  circulation: "Circulation",
  nerves: "Nerves",
};
export const LAYER_ORDER: Layer[] = ["organs", "skeleton", "muscles", "circulation", "nerves"];
