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

export const regionDetails: RegionDetail[] = [
  { id: "head-mind", title: "Head and Mind", description: "Focus and moments of mental reset can shape how your day feels.", icon: "✳", status: "Good", action: "View focus notes", secondary: "Explore mind and focus", stats: [{ label: "Focus", value: "Steady", points: [5, 6, 4, 7, 6, 8] }, { label: "Mind breaks", value: "3 today", points: [4, 5, 5, 6, 7, 7] }, { label: "Screen pause", value: "On track", points: [6, 5, 6, 6, 7, 7] }] },
  { id: "chest-heart", title: "Chest and Heart", description: "A calm look at the signals that support your everyday energy.", icon: "♡", status: "Good", action: "View heart data", secondary: "See breathing guide", stats: [{ label: "Heart rate", value: "62 bpm", points: [7, 6, 7, 5, 6, 4] }, { label: "Heart range", value: "58–132", points: [5, 6, 4, 7, 5, 7] }, { label: "Breathing", value: "14 / min", points: [6, 6, 5, 6, 5, 6] }] },
  { id: "core-digestion", title: "Core and Digestion", description: "Small daily habits help keep hydration and nourishment in balance.", icon: "◌", status: "Needs attention", action: "View daily balance", secondary: "Log a meal", stats: [{ label: "Hydration", value: "1.6 L", points: [3, 4, 5, 4, 6, 7] }, { label: "Meals logged", value: "2 today", points: [4, 5, 4, 6, 6, 7] }, { label: "Energy", value: "Good", points: [5, 4, 6, 5, 7, 7] }] },
  { id: "legs-strength", title: "Legs and Strength", description: "Your movement adds up, one walk and one stretch at a time.", icon: "⌁", status: "Good", action: "View activity", secondary: "Start a movement break", stats: [{ label: "Steps", value: "8,420", points: [2, 3, 4, 6, 5, 9] }, { label: "Active time", value: "42 min", points: [3, 5, 4, 6, 7, 8] }, { label: "Move goal", value: "84%", points: [2, 4, 5, 6, 7, 8] }] },
];

export const todaySummary = { move: 0.78, exercise: 0.64, stand: 0.83, streak: 6, score: 86 };
