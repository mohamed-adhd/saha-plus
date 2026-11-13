/**
 * Placeholder wellness data for the body atlas. Replace these values with live data
 * once the health-data backend is connected; the UI reads everything from here.
 */
export type RegionId = "head-mind" | "chest-heart" | "core-digestion" | "legs-strength";
export type LogKind = "water" | "workout" | "note";
export type RegionStat = { label: string; value: string; points: number[] };

export type RegionDetail = {
  id: RegionId;
  status: "Good" | "Needs attention";
  headline: string;
  stats: RegionStat[];
  action: { label: string; log: LogKind };
};

export const regionDetails: Record<RegionId, RegionDetail> = {
  "head-mind": {
    id: "head-mind",
    status: "Good",
    headline: "3 focus blocks today",
    stats: [
      { label: "Focus", value: "Steady", points: [5, 6, 4, 7, 6, 8, 7] },
      { label: "Mind breaks", value: "3 today", points: [4, 5, 5, 6, 7, 7, 8] },
      { label: "Sleep", value: "7 h 20 m", points: [6, 5, 7, 6, 6, 7, 7] },
    ],
    action: { label: "Add a reflection", log: "note" },
  },
  "chest-heart": {
    id: "chest-heart",
    status: "Good",
    headline: "62 bpm resting",
    stats: [
      { label: "Resting heart", value: "62 bpm", points: [7, 6, 7, 5, 6, 5, 4] },
      { label: "Daily range", value: "58–132", points: [5, 6, 4, 7, 5, 7, 6] },
      { label: "Breathing", value: "14 / min", points: [6, 6, 5, 6, 5, 6, 6] },
    ],
    action: { label: "Log a workout", log: "workout" },
  },
  "core-digestion": {
    id: "core-digestion",
    status: "Needs attention",
    headline: "1.6 of 2.5 L water",
    stats: [
      { label: "Hydration", value: "1.6 L", points: [3, 4, 5, 4, 6, 6, 7] },
      { label: "Meals logged", value: "2 today", points: [4, 5, 4, 6, 6, 7, 6] },
      { label: "Energy", value: "Good", points: [5, 4, 6, 5, 7, 7, 8] },
    ],
    action: { label: "Log water", log: "water" },
  },
  "legs-strength": {
    id: "legs-strength",
    status: "Good",
    headline: "8,420 steps so far",
    stats: [
      { label: "Steps", value: "8,420", points: [2, 3, 4, 6, 5, 7, 9] },
      { label: "Active time", value: "42 min", points: [3, 5, 4, 6, 7, 7, 8] },
      { label: "Move goal", value: "84%", points: [2, 4, 5, 6, 7, 8, 8] },
    ],
    action: { label: "Start a movement break", log: "workout" },
  },
};

export const todaySummary = { move: 0.78, exercise: 0.64, stand: 0.83, streak: 6, score: 86 };
