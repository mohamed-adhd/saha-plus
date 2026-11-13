export type HealthMetric = {
  id: string;
  label: string;
  value: string;
  unit: string;
  trend: string;
  direction: "up" | "down";
  icon: "heart" | "moon" | "mood" | "steps" | "water";
  points: number[];
  zone: string;
  liveValue: string;
};

export type RegionDetail = {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: "Good" | "Needs attention";
  action: string;
  secondary: string;
  stats: { label: string; value: string; points: number[] }[];
};

export const healthMetrics: HealthMetric[] = [
  { id: "heart", label: "Resting heart rate", value: "62", unit: "bpm", trend: "4% this week", direction: "down", icon: "heart", points: [7, 8, 6, 7, 5, 6, 4, 4], zone: "Chest", liveValue: "62 bpm" },
  { id: "sleep", label: "Sleep last night", value: "7.8", unit: "hrs", trend: "32 min more", direction: "up", icon: "moon", points: [4, 5, 5, 6, 4, 7, 7, 8], zone: "Head", liveValue: "7.8 hours" },
  { id: "mood", label: "Mood today", value: "Good", unit: "", trend: "steady", direction: "up", icon: "mood", points: [4, 5, 5, 6, 6, 6, 7, 7], zone: "Head", liveValue: "Good" },
  { id: "steps", label: "Steps today", value: "8,420", unit: "steps", trend: "12% today", direction: "up", icon: "steps", points: [2, 4, 3, 5, 6, 5, 8, 9], zone: "Legs", liveValue: "8,420 steps" },
  { id: "water", label: "Water today", value: "1.6", unit: "L", trend: "2 glasses to go", direction: "up", icon: "water", points: [2, 3, 5, 4, 6, 7, 7, 8], zone: "Core", liveValue: "1.6 litres" },
];

export const regionDetails: RegionDetail[] = [
  { id: "head-mind", title: "Head and Mind", description: "Rest, focus and mood all shape how your day feels.", icon: "✳", status: "Good", action: "View sleep trends", secondary: "Explore mind and mood", stats: [{ label: "Sleep", value: "7.8 hrs", points: [5, 6, 4, 7, 6, 8] }, { label: "Mood", value: "Good", points: [4, 5, 5, 6, 7, 7] }, { label: "Focus", value: "Steady", points: [6, 5, 6, 6, 7, 7] }] },
  { id: "chest-heart", title: "Chest and Heart", description: "A calm look at the signals that support your everyday energy.", icon: "♡", status: "Good", action: "View heart data", secondary: "See breathing guide", stats: [{ label: "Resting pulse", value: "62 bpm", points: [7, 6, 7, 5, 6, 4] }, { label: "Heart range", value: "58–132", points: [5, 6, 4, 7, 5, 7] }, { label: "Breathing", value: "14 / min", points: [6, 6, 5, 6, 5, 6] }] },
  { id: "core-digestion", title: "Core and Digestion", description: "Small daily habits help keep hydration and nourishment in balance.", icon: "◌", status: "Needs attention", action: "View daily balance", secondary: "Log a meal", stats: [{ label: "Hydration", value: "1.6 L", points: [3, 4, 5, 4, 6, 7] }, { label: "Meals logged", value: "2 today", points: [4, 5, 4, 6, 6, 7] }, { label: "Energy", value: "Good", points: [5, 4, 6, 5, 7, 7] }] },
  { id: "legs-strength", title: "Legs and Strength", description: "Your movement adds up, one walk and one stretch at a time.", icon: "⌁", status: "Good", action: "View activity", secondary: "Start a movement break", stats: [{ label: "Steps", value: "8,420", points: [2, 3, 4, 6, 5, 9] }, { label: "Active time", value: "42 min", points: [3, 5, 4, 6, 7, 8] }, { label: "Move goal", value: "84%", points: [2, 4, 5, 6, 7, 8] }] },
];

export const todaySummary = { move: 0.78, exercise: 0.64, stand: 0.83, streak: 6, score: 86 };
